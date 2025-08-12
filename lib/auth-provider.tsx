"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { useSupabase } from "./supabase-provider"
import bcrypt from "bcryptjs"

interface User {
  id: number
  username: string
  email: string
  nome?: string
  cognome?: string
  ruolo: string
  attivo: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  checkSession: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Stato globale persistente per l'autenticazione
const globalAuthState = {
  user: null as User | null,
  isLoading: true,
  sessionChecked: false,
  lastSessionCheck: 0,
  sessionCache: new Map<string, { user: User | null; timestamp: number }>(),
}

const SESSION_CACHE_DURATION = 300000 // 5 minuti
const SESSION_CHECK_INTERVAL = 60000 // 1 minuto

// Backup in sessionStorage
const SESSION_STORAGE_KEY = "istudio_auth_backup"
const COOKIE_NAME = "istudio_session"

const saveAuthBackup = (user: User | null) => {
  try {
    if (typeof window !== "undefined") {
      const backup = {
        user,
        timestamp: Date.now(),
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(backup))
    }
  } catch (error) {
    console.warn("AuthProvider: Impossibile salvare backup auth:", error)
  }
}

const loadAuthBackup = (): User | null => {
  try {
    if (typeof window === "undefined") return null

    const backup = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!backup) return null

    const parsed = JSON.parse(backup)
    const age = Date.now() - parsed.timestamp

    // Backup valido per 1 ora
    if (age > 3600000) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return parsed.user
  } catch (error) {
    console.warn("AuthProvider: Impossibile caricare backup auth:", error)
    return null
  }
}

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null

  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

let renderCount = 0

export function AuthProvider({ children }: { children: ReactNode }) {
  renderCount++

  const { supabase, isConnected: supabaseConnected, isInitializing: supabaseInitializing } = useSupabase()

  const [state, setState] = useState(() => {
    // Se abbiamo già un utente nello stato globale, usalo
    if (globalAuthState.user && globalAuthState.sessionChecked) {
      return {
        user: globalAuthState.user,
        isLoading: false,
      }
    }

    // Altrimenti prova a caricare dal backup
    const backupUser = loadAuthBackup()
    if (backupUser) {
      globalAuthState.user = backupUser
      globalAuthState.sessionChecked = true
      return {
        user: backupUser,
        isLoading: false,
      }
    }

    return {
      user: globalAuthState.user,
      isLoading: globalAuthState.isLoading,
    }
  })

  const checkingRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Log ridotti - solo ogni 5 render
  if (renderCount % 5 === 1) {
    console.log(
      `AuthProvider: Render`,
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

  const updateAuthState = (newState: Partial<typeof state>) => {
    Object.assign(globalAuthState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }

    // Salva backup se c'è un utente
    if (newState.user !== undefined) {
      saveAuthBackup(newState.user)
    }
  }

  const checkSession = async (): Promise<User | null> => {
    if (!supabase || !supabaseConnected || checkingRef.current) {
      return null
    }

    const now = Date.now()
    const cacheKey = "session_check"

    // Usa cache per evitare controlli ripetuti
    if (globalAuthState.sessionCache.has(cacheKey)) {
      const cached = globalAuthState.sessionCache.get(cacheKey)!
      if (now - cached.timestamp < SESSION_CACHE_DURATION) {
        return cached.user
      }
    }

    checkingRef.current = true

    try {
      console.log("AuthProvider: Verifica sessione...")

      const sessionId = getCookie(COOKIE_NAME)
      if (!sessionId) {
        console.log("AuthProvider: Nessun cookie di sessione trovato")
        globalAuthState.sessionCache.set(cacheKey, { user: null, timestamp: now })
        return null
      }

      // Verifica se l'utente esiste ancora nel database
      const { data: userData, error } = await supabase
        .from("utenti")
        .select("id, username, email, nome, cognome, ruolo, attivo")
        .eq("id", Number.parseInt(sessionId))
        .eq("attivo", true)
        .single()

      if (error || !userData) {
        console.log("AuthProvider: Sessione non valida o scaduta")
        deleteCookie(COOKIE_NAME)
        globalAuthState.sessionCache.set(cacheKey, { user: null, timestamp: now })
        return null
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        nome: userData.nome || undefined,
        cognome: userData.cognome || undefined,
        ruolo: userData.ruolo,
        attivo: userData.attivo,
      }

      console.log(`AuthProvider: Sessione valida per utente: ${user.username}`)

      // Salva in cache
      globalAuthState.sessionCache.set(cacheKey, { user, timestamp: now })
      globalAuthState.lastSessionCheck = now

      return user
    } catch (error) {
      console.error("AuthProvider: Errore verifica sessione:", error)
      globalAuthState.sessionCache.set(cacheKey, { user: null, timestamp: now })
      return null
    } finally {
      checkingRef.current = false
    }
  }

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (!supabase || !supabaseConnected) {
      return { success: false, message: "Database non disponibile" }
    }

    try {
      console.log(`AuthProvider: Tentativo di login per: ${identifier}`)

      // Cerca l'utente per username o email
      const { data: userData, error } = await supabase
        .from("utenti")
        .select("id, username, email, password, nome, cognome, ruolo, attivo")
        .or(`username.eq.${identifier},email.eq.${identifier}`)
        .eq("attivo", true)
        .single()

      if (error || !userData) {
        console.log("AuthProvider: Utente non trovato o non attivo")
        return { success: false, message: "Credenziali non valide" }
      }

      // Verifica password
      let passwordValid = false

      if (userData.password.startsWith("$2")) {
        // Password hashata con bcrypt
        passwordValid = await bcrypt.compare(password, userData.password)
      } else {
        // Password in chiaro (per compatibilità)
        passwordValid = password === userData.password

        // Aggiorna la password hashata nel database
        if (passwordValid) {
          const hashedPassword = await bcrypt.hash(password, 12)
          await supabase.from("utenti").update({ password: hashedPassword }).eq("id", userData.id)
        }
      }

      if (!passwordValid) {
        console.log("AuthProvider: Password non valida")
        return { success: false, message: "Credenziali non valide" }
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        nome: userData.nome || undefined,
        cognome: userData.cognome || undefined,
        ruolo: userData.ruolo,
        attivo: userData.attivo,
      }

      // Imposta cookie di sessione
      setCookie(COOKIE_NAME, user.id.toString(), 7)

      // Aggiorna stato
      updateAuthState({
        user,
        isLoading: false,
      })

      globalAuthState.sessionChecked = true

      // Pulisci cache per forzare refresh
      globalAuthState.sessionCache.clear()

      console.log(`AuthProvider: Login riuscito per: ${user.username}`)

      return { success: true, message: "Login effettuato con successo" }
    } catch (error) {
      console.error("AuthProvider: Errore login:", error)
      return { success: false, message: "Errore durante il login" }
    }
  }

  const logout = () => {
    console.log("AuthProvider: Logout")

    deleteCookie(COOKIE_NAME)

    updateAuthState({
      user: null,
      isLoading: false,
    })

    globalAuthState.sessionChecked = true
    globalAuthState.sessionCache.clear()

    // Rimuovi backup
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  // Inizializzazione e verifica sessione
  useEffect(() => {
    const initializeAuth = async () => {
      if (supabaseInitializing || !supabaseConnected || globalAuthState.sessionChecked) {
        return
      }

      console.log("AuthProvider: Inizializzazione autenticazione...")

      const user = await checkSession()

      updateAuthState({
        user,
        isLoading: false,
      })

      globalAuthState.sessionChecked = true
    }

    // Debouncing per evitare chiamate multiple
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        initializeAuth()
      }
    }, 200)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [supabase, supabaseConnected, supabaseInitializing])

  // Controllo periodico della sessione
  useEffect(() => {
    if (!state.user || !supabaseConnected) return

    const interval = setInterval(async () => {
      const now = Date.now()
      if (now - globalAuthState.lastSessionCheck > SESSION_CHECK_INTERVAL) {
        const user = await checkSession()
        if (!user && state.user) {
          // Sessione scaduta
          logout()
        }
      }
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [state.user, supabaseConnected])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const contextValue: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isAdmin: state.user?.ruolo === "admin",
    login,
    logout,
    checkSession,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve essere usato all'interno di AuthProvider")
  }
  return context
}

// Funzione per reset esplicito (da usare solo su logout)
export const resetAuthState = () => {
  console.log("AuthProvider: Reset esplicito dello stato")
  globalAuthState.user = null
  globalAuthState.isLoading = true
  globalAuthState.sessionChecked = false
  globalAuthState.lastSessionCheck = 0
  globalAuthState.sessionCache.clear()

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
