"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useSupabase } from "./supabase-provider"

interface AuthUser {
  id: number
  nome: string
  username: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  supabaseConnected: boolean
  supabaseInitializing: boolean
  sessionChecked: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Stato globale persistente per prevenire reset durante unmount/remount
const globalAuthState = {
  user: null as AuthUser | null,
  isLoading: true,
  isAdmin: false,
  sessionChecked: false,
  lastSessionCheck: 0,
  sessionCache: new Map<string, any>(),
}

// Backup in sessionStorage
const SESSION_STORAGE_KEY = "istudio_auth_backup"

const saveAuthBackup = (user: AuthUser | null, isAdmin: boolean) => {
  try {
    const backup = {
      user,
      isAdmin,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(backup))
  } catch (error) {
    console.warn("Impossibile salvare backup auth:", error)
  }
}

const loadAuthBackup = (): { user: AuthUser | null; isAdmin: boolean } | null => {
  try {
    const backup = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!backup) return null

    const parsed = JSON.parse(backup)
    const age = Date.now() - parsed.timestamp

    // Backup valido per 1 ora
    if (age > 3600000) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return { user: parsed.user, isAdmin: parsed.isAdmin }
  } catch (error) {
    console.warn("Impossibile caricare backup auth:", error)
    return null
  }
}

let renderCount = 0

export function AuthProvider({ children }: { children: React.ReactNode }) {
  renderCount++

  const { supabase, isConnected: supabaseConnected, isInitializing: supabaseInitializing } = useSupabase()

  // Inizializza lo stato dal globalState o dal backup
  const [state, setState] = useState(() => {
    // Se abbiamo già uno stato globale, usalo
    if (globalAuthState.user !== null || globalAuthState.sessionChecked) {
      return {
        user: globalAuthState.user,
        isLoading: globalAuthState.isLoading,
        isAdmin: globalAuthState.isAdmin,
        sessionChecked: globalAuthState.sessionChecked,
      }
    }

    // Altrimenti prova a caricare dal backup
    const backup = loadAuthBackup()
    if (backup) {
      globalAuthState.user = backup.user
      globalAuthState.isAdmin = backup.isAdmin
      globalAuthState.isLoading = false
      globalAuthState.sessionChecked = true

      return {
        user: backup.user,
        isLoading: false,
        isAdmin: backup.isAdmin,
        sessionChecked: true,
      }
    }

    return {
      user: globalAuthState.user,
      isLoading: globalAuthState.isLoading,
      isAdmin: globalAuthState.isAdmin,
      sessionChecked: globalAuthState.sessionChecked,
    }
  })

  const initializingRef = useRef(false)
  const mountedRef = useRef(true)

  // Funzione per aggiornare sia lo stato locale che globale
  const updateAuthState = useCallback((newState: Partial<typeof state>) => {
    Object.assign(globalAuthState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }

    // Salva backup se abbiamo dati utente
    if (newState.user !== undefined || newState.isAdmin !== undefined) {
      saveAuthBackup(
        newState.user !== undefined ? newState.user : globalAuthState.user,
        newState.isAdmin !== undefined ? newState.isAdmin : globalAuthState.isAdmin,
      )
    }
  }, [])

  // Log ridotto (ogni 5 render)
  if (renderCount % 5 === 0) {
    console.log(
      `${new Date().toISOString()} AuthProvider: Render`,
      JSON.stringify({
        user: !!state.user,
        isLoading: state.isLoading,
        supabaseConnected,
        supabaseInitializing,
        sessionChecked: state.sessionChecked,
        renderCount,
      }),
    )
  }

  const checkSession = useCallback(async () => {
    if (!supabase || !supabaseConnected) return

    const now = Date.now()
    const cacheKey = "session_check"

    // Cache della verifica sessione per 30 secondi
    if (globalAuthState.sessionCache.has(cacheKey) && now - globalAuthState.lastSessionCheck < 30000) {
      return globalAuthState.sessionCache.get(cacheKey)
    }

    try {
      console.log(`${new Date().toISOString()} AuthProvider: Verifica sessione...`)

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        console.log(`${new Date().toISOString()} AuthProvider: Sessione non valida o scaduta`)
        globalAuthState.sessionCache.set(cacheKey, null)
        globalAuthState.lastSessionCheck = now
        return null
      }

      const { data: userData, error: userError } = await supabase
        .from("utenti")
        .select("id, nome, username, email, ruolo")
        .eq("email", session.user.email)
        .single()

      if (userError || !userData) {
        console.log(`${new Date().toISOString()} AuthProvider: Utente non trovato nel database`)
        globalAuthState.sessionCache.set(cacheKey, null)
        globalAuthState.lastSessionCheck = now
        return null
      }

      const authUser: AuthUser = {
        id: userData.id,
        nome: userData.nome,
        username: userData.username,
        email: userData.email,
      }

      const result = {
        user: authUser,
        isAdmin: userData.ruolo === "admin",
      }

      globalAuthState.sessionCache.set(cacheKey, result)
      globalAuthState.lastSessionCheck = now

      return result
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore verifica sessione:`, error)
      globalAuthState.sessionCache.set(cacheKey, null)
      globalAuthState.lastSessionCheck = now
      return null
    }
  }, [supabase, supabaseConnected])

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || !supabase || !supabaseConnected || supabaseInitializing) {
      return
    }

    // Se abbiamo già un utente valido, non reinizializzare
    if (globalAuthState.user && globalAuthState.sessionChecked) {
      return
    }

    initializingRef.current = true
    console.log(`${new Date().toISOString()} AuthProvider: Inizializzazione autenticazione...`)

    try {
      const sessionResult = await checkSession()

      if (sessionResult) {
        updateAuthState({
          user: sessionResult.user,
          isAdmin: sessionResult.isAdmin,
          isLoading: false,
          sessionChecked: true,
        })
      } else {
        updateAuthState({
          user: null,
          isAdmin: false,
          isLoading: false,
          sessionChecked: true,
        })
      }
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore inizializzazione:`, error)
      updateAuthState({
        user: null,
        isAdmin: false,
        isLoading: false,
        sessionChecked: true,
      })
    } finally {
      initializingRef.current = false
    }
  }, [supabase, supabaseConnected, supabaseInitializing, checkSession, updateAuthState])

  useEffect(() => {
    initializeAuth()

    return () => {
      mountedRef.current = false
    }
  }, [initializeAuth])

  const login = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { success: false, error: "Supabase non inizializzato" }
      }

      try {
        console.log(`${new Date().toISOString()} AuthProvider: Tentativo di login per: ${email}`)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        const { data: userData, error: userError } = await supabase
          .from("utenti")
          .select("id, nome, username, email, ruolo")
          .eq("email", email)
          .single()

        if (userError || !userData) {
          return { success: false, error: "Utente non trovato" }
        }

        const authUser: AuthUser = {
          id: userData.id,
          nome: userData.nome,
          username: userData.username,
          email: userData.email,
        }

        const isAdmin = userData.ruolo === "admin"

        updateAuthState({
          user: authUser,
          isAdmin,
          isLoading: false,
          sessionChecked: true,
        })

        // Invalida cache
        globalAuthState.sessionCache.clear()

        console.log(`${new Date().toISOString()} AuthProvider: Login riuscito per: ${userData.username}`)
        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
        console.error(`${new Date().toISOString()} AuthProvider: Errore login:`, errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, updateAuthState],
  )

  const logout = useCallback(async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()

      updateAuthState({
        user: null,
        isAdmin: false,
        isLoading: false,
        sessionChecked: true,
      })

      // Pulisci backup e cache
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      globalAuthState.sessionCache.clear()

      console.log(`${new Date().toISOString()} AuthProvider: Logout completato`)
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore logout:`, error)
    }
  }, [supabase, updateAuthState])

  const contextValue: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAdmin: state.isAdmin,
    login,
    logout,
    supabaseConnected,
    supabaseInitializing,
    sessionChecked: state.sessionChecked,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
