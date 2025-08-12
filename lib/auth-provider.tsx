"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useSupabase } from "./supabase-provider"

interface AuthUser {
  id: number
  nome: string
  username: string
  email: string
  ruolo?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Stato globale persistente per prevenire reset durante unmount/remount
const globalAuthState = {
  user: null as AuthUser | null,
  isLoading: true,
  isAdmin: false,
  sessionChecked: false,
  lastSessionCheck: 0,
  sessionCache: new Map<string, { user: AuthUser | null; timestamp: number }>(),
}

// Backup in sessionStorage per recupero rapido
const SESSION_STORAGE_KEY = "istudio_auth_backup"
const SESSION_CACHE_DURATION = 300000 // 5 minuti

const saveAuthBackup = (user: AuthUser | null) => {
  try {
    const backup = {
      user,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(backup))
  } catch (error) {
    console.warn("Impossibile salvare backup auth:", error)
  }
}

const loadAuthBackup = (): AuthUser | null => {
  try {
    const backup = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!backup) return null

    const parsed = JSON.parse(backup)
    const age = Date.now() - parsed.timestamp

    if (age > SESSION_CACHE_DURATION) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return parsed.user
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
    // Se abbiamo già uno stato globale valido, usalo
    if (globalAuthState.sessionChecked && globalAuthState.user) {
      return {
        user: globalAuthState.user,
        isLoading: false,
        isAdmin: globalAuthState.isAdmin,
      }
    }

    // Altrimenti prova a caricare dal backup
    const backupUser = loadAuthBackup()
    if (backupUser) {
      globalAuthState.user = backupUser
      globalAuthState.isAdmin = backupUser.ruolo === "admin"
      globalAuthState.sessionChecked = true
      globalAuthState.isLoading = false

      return {
        user: backupUser,
        isLoading: false,
        isAdmin: backupUser.ruolo === "admin",
      }
    }

    return {
      user: globalAuthState.user,
      isLoading: globalAuthState.isLoading,
      isAdmin: globalAuthState.isAdmin,
    }
  })

  const initializingRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Funzione per aggiornare sia lo stato locale che globale
  const updateAuthState = useCallback((newState: Partial<typeof state>) => {
    Object.assign(globalAuthState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }

    // Salva backup se c'è un utente
    if (newState.user !== undefined) {
      saveAuthBackup(newState.user)
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
        sessionChecked: globalAuthState.sessionChecked,
        renderCount,
      }),
    )
  }

  const checkSession = useCallback(async (): Promise<AuthUser | null> => {
    if (!supabase || !supabaseConnected) {
      return null
    }

    const cacheKey = "session_check"
    const now = Date.now()
    const cached = globalAuthState.sessionCache.get(cacheKey)

    // Cache per 30 secondi
    if (cached && now - cached.timestamp < 30000) {
      return cached.user
    }

    try {
      console.log(`${new Date().toISOString()} AuthProvider: Verifica sessione...`)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        console.log(`${new Date().toISOString()} AuthProvider: Sessione non valida o scaduta`)
        globalAuthState.sessionCache.set(cacheKey, { user: null, timestamp: now })
        return null
      }

      const { data: userData, error: userError } = await supabase
        .from("utenti")
        .select("id, nome, username, email, ruolo")
        .eq("email", session.user.email)
        .single()

      if (userError || !userData) {
        console.error(`${new Date().toISOString()} AuthProvider: Errore caricamento dati utente:`, userError)
        globalAuthState.sessionCache.set(cacheKey, { user: null, timestamp: now })
        return null
      }

      const authUser: AuthUser = {
        id: userData.id,
        nome: userData.nome,
        username: userData.username,
        email: userData.email,
        ruolo: userData.ruolo,
      }

      globalAuthState.sessionCache.set(cacheKey, { user: authUser, timestamp: now })
      return authUser
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore verifica sessione:`, error)
      globalAuthState.sessionCache.set(cacheKey, { user: null, timestamp: now })
      return null
    }
  }, [supabase, supabaseConnected])

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current || globalAuthState.sessionChecked) {
      return
    }

    if (!supabase || !supabaseConnected || supabaseInitializing) {
      return
    }

    initializingRef.current = true
    console.log(`${new Date().toISOString()} AuthProvider: Inizializzazione autenticazione...`)

    try {
      const user = await checkSession()

      updateAuthState({
        user,
        isLoading: false,
        isAdmin: user?.ruolo === "admin",
      })

      globalAuthState.sessionChecked = true
      globalAuthState.lastSessionCheck = Date.now()

      if (user) {
        console.log(`${new Date().toISOString()} AuthProvider: Utente autenticato: ${user.username}`)
      }
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore inizializzazione:`, error)
      updateAuthState({
        user: null,
        isLoading: false,
        isAdmin: false,
      })
      globalAuthState.sessionChecked = true
    } finally {
      initializingRef.current = false
    }
  }, [supabase, supabaseConnected, supabaseInitializing, checkSession, updateAuthState])

  const login = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { success: false, error: "Supabase non disponibile" }
      }

      try {
        console.log(`${new Date().toISOString()} AuthProvider: Tentativo di login per: ${email}`)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error(`${new Date().toISOString()} AuthProvider: Errore login:`, error)
          return { success: false, error: error.message }
        }

        if (!data.user) {
          return { success: false, error: "Dati utente non disponibili" }
        }

        const { data: userData, error: userError } = await supabase
          .from("utenti")
          .select("id, nome, username, email, ruolo")
          .eq("email", data.user.email)
          .single()

        if (userError || !userData) {
          console.error(`${new Date().toISOString()} AuthProvider: Errore caricamento dati utente:`, userError)
          return { success: false, error: "Errore caricamento dati utente" }
        }

        const authUser: AuthUser = {
          id: userData.id,
          nome: userData.nome,
          username: userData.username,
          email: userData.email,
          ruolo: userData.ruolo,
        }

        updateAuthState({
          user: authUser,
          isLoading: false,
          isAdmin: authUser.ruolo === "admin",
        })

        // Aggiorna cache
        globalAuthState.sessionCache.clear()
        globalAuthState.sessionCache.set("session_check", { user: authUser, timestamp: Date.now() })

        console.log(`${new Date().toISOString()} AuthProvider: Login riuscito per: ${authUser.username}`)
        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
        console.error(`${new Date().toISOString()} AuthProvider: Errore login:`, error)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, updateAuthState],
  )

  const logout = useCallback(async () => {
    if (!supabase) return

    try {
      console.log(`${new Date().toISOString()} AuthProvider: Logout...`)

      await supabase.auth.signOut()

      updateAuthState({
        user: null,
        isLoading: false,
        isAdmin: false,
      })

      // Pulisci cache e backup
      globalAuthState.sessionCache.clear()
      globalAuthState.sessionChecked = false
      sessionStorage.removeItem(SESSION_STORAGE_KEY)

      console.log(`${new Date().toISOString()} AuthProvider: Logout completato`)
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore logout:`, error)
    }
  }, [supabase, updateAuthState])

  const refreshUser = useCallback(async () => {
    if (!supabase || !supabaseConnected) return

    try {
      const user = await checkSession()
      updateAuthState({
        user,
        isAdmin: user?.ruolo === "admin",
      })
    } catch (error) {
      console.error(`${new Date().toISOString()} AuthProvider: Errore refresh utente:`, error)
    }
  }, [supabase, supabaseConnected, checkSession, updateAuthState])

  useEffect(() => {
    // Timeout di sicurezza per inizializzazione
    if (!supabaseInitializing && supabaseConnected && !globalAuthState.sessionChecked) {
      timeoutRef.current = setTimeout(() => {
        initializeAuth()
      }, 200)
    }

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // NON resettiamo globalAuthState qui per mantenerlo tra i remount
    }
  }, [supabaseInitializing, supabaseConnected, initializeAuth])

  const contextValue: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAdmin: state.isAdmin,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
