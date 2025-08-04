"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { useSupabase } from "./supabase-provider"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Costanti per la gestione delle sessioni
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minuti
const THROTTLE_DELAY = 1000 // 1 secondo
const SESSION_COOKIE_NAMES = [
  "sb-access-token",
  "sb-refresh-token",
  "supabase-auth-token",
  "supabase.auth.token",
  "sb-istudio-auth-token",
  "auth-token",
  "session",
  "auth-session",
]

export function AuthProvider({ children }: AuthProviderProps) {
  const { supabase, isReady } = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Refs per prevenire race conditions
  const isCheckingSessionRef = useRef(false)
  const initializationCompleteRef = useRef(false)
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSessionCheckRef = useRef<number>(0)

  // Funzione per validare il formato della sessione
  const isValidSession = (session: Session | null): boolean => {
    if (!session) return false

    try {
      // Verifica che la sessione abbia i campi obbligatori
      const hasRequiredFields = !!(session.access_token && session.refresh_token && session.user && session.expires_at)

      if (!hasRequiredFields) {
        console.warn("⚠️ AuthProvider: Session missing required fields")
        return false
      }

      // Verifica che la sessione non sia scaduta
      const now = Math.floor(Date.now() / 1000)
      const isExpired = session.expires_at ? session.expires_at < now : true

      if (isExpired) {
        console.warn("⚠️ AuthProvider: Session expired")
        return false
      }

      // Verifica che il token abbia una lunghezza ragionevole (almeno 32 caratteri)
      if (session.access_token.length < 32) {
        console.warn("⚠️ AuthProvider: Access token too short")
        return false
      }

      return true
    } catch (error) {
      console.error("❌ AuthProvider: Error validating session:", error)
      return false
    }
  }

  // Funzione per pulire tutti i cookie di autenticazione
  const clearAuthCookies = () => {
    try {
      console.log("🧹 AuthProvider: Clearing auth cookies...")

      SESSION_COOKIE_NAMES.forEach((cookieName) => {
        // Pulisci per il dominio corrente
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`

        // Pulisci per il dominio con punto
        const domain = window.location.hostname
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`
      })

      // Pulisci anche localStorage e sessionStorage
      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth")) {
            localStorage.removeItem(key)
          }
        })

        Object.keys(sessionStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("auth")) {
            sessionStorage.removeItem(key)
          }
        })
      }

      console.log("✅ AuthProvider: Auth cookies cleared")
    } catch (error) {
      console.error("❌ AuthProvider: Error clearing cookies:", error)
    }
  }

  // Funzione per controllare la sessione con throttling
  const checkSession = async (force = false) => {
    if (!supabase || !isReady) {
      console.log("⏭️ AuthProvider: Supabase not ready, skipping session check")
      return
    }

    // Throttling per evitare chiamate eccessive
    const now = Date.now()
    if (!force && now - lastSessionCheckRef.current < THROTTLE_DELAY) {
      console.log("⏭️ AuthProvider: Session check throttled")
      return
    }

    if (isCheckingSessionRef.current && !force) {
      console.log("⏭️ AuthProvider: Session check already in progress")
      return
    }

    isCheckingSessionRef.current = true
    lastSessionCheckRef.current = now

    try {
      console.log("🔍 AuthProvider: Checking session...")

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ AuthProvider: Error getting session:", error)
        setUser(null)
        setSession(null)
        clearAuthCookies()
        return
      }

      if (isValidSession(currentSession)) {
        console.log("✅ AuthProvider: Valid session found")
        setUser(currentSession.user)
        setSession(currentSession)
      } else {
        console.log("❌ AuthProvider: No valid session found")
        setUser(null)
        setSession(null)
        clearAuthCookies()
      }
    } catch (error) {
      console.error("❌ AuthProvider: Session check error:", error)
      setUser(null)
      setSession(null)
      clearAuthCookies()
    } finally {
      isCheckingSessionRef.current = false
      if (!initializationCompleteRef.current) {
        setIsLoading(false)
        initializationCompleteRef.current = true
        console.log("✅ AuthProvider: Initialization completed")
      }
    }
  }

  // Funzione per avviare i controlli periodici della sessione
  const startPeriodicSessionCheck = () => {
    // Pulisci eventuali interval esistenti
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current)
    }

    console.log(`📅 AuthProvider: Starting periodic session checks every ${SESSION_CHECK_INTERVAL / 1000}s`)

    sessionCheckIntervalRef.current = setInterval(() => {
      console.log("⏰ AuthProvider: Periodic session check")
      checkSession()
    }, SESSION_CHECK_INTERVAL)
  }

  // Funzione per tentare il recupero automatico della sessione
  const attemptSessionRecovery = async () => {
    if (!supabase) return

    try {
      console.log("🔄 AuthProvider: Attempting session recovery...")

      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("❌ AuthProvider: Session recovery failed:", error)
        return false
      }

      if (isValidSession(data.session)) {
        console.log("✅ AuthProvider: Session recovered successfully")
        setUser(data.session.user)
        setSession(data.session)
        return true
      }

      return false
    } catch (error) {
      console.error("❌ AuthProvider: Session recovery error:", error)
      return false
    }
  }

  // Funzioni di autenticazione
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error("Supabase not initialized") as AuthError }
    }

    try {
      console.log("🔐 AuthProvider: Signing in...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ AuthProvider: Sign in error:", error)
        return { error }
      }

      if (isValidSession(data.session)) {
        setUser(data.user)
        setSession(data.session)
        console.log("✅ AuthProvider: Sign in successful")
      }

      return { error: null }
    } catch (error) {
      console.error("❌ AuthProvider: Sign in exception:", error)
      return { error: error as AuthError }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error("Supabase not initialized") as AuthError }
    }

    try {
      console.log("📝 AuthProvider: Signing up...")
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error("❌ AuthProvider: Sign up error:", error)
        return { error }
      }

      console.log("✅ AuthProvider: Sign up successful")
      return { error: null }
    } catch (error) {
      console.error("❌ AuthProvider: Sign up exception:", error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      console.log("🚪 AuthProvider: Signing out...")

      // Pulisci lo stato locale prima
      setUser(null)
      setSession(null)

      // Pulisci i cookie
      clearAuthCookies()

      // Esegui il logout su Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ AuthProvider: Sign out error:", error)
      } else {
        console.log("✅ AuthProvider: Sign out successful")
      }
    } catch (error) {
      console.error("❌ AuthProvider: Sign out exception:", error)
    }
  }

  const refreshSession = async () => {
    if (!supabase) return

    try {
      console.log("🔄 AuthProvider: Refreshing session...")
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("❌ AuthProvider: Refresh session error:", error)
        return
      }

      if (isValidSession(data.session)) {
        setUser(data.session.user)
        setSession(data.session)
        console.log("✅ AuthProvider: Session refreshed successfully")
      }
    } catch (error) {
      console.error("❌ AuthProvider: Refresh session exception:", error)
    }
  }

  // Effetto per inizializzare l'autenticazione
  useEffect(() => {
    if (!supabase || !isReady) {
      console.log("⏳ AuthProvider: Waiting for Supabase to be ready...")
      return
    }

    if (initializationCompleteRef.current) {
      console.log("⏭️ AuthProvider: Already initialized")
      return
    }

    console.log("🚀 AuthProvider: Starting initialization...")

    // Controlla la sessione iniziale
    checkSession(true)

    // Avvia i controlli periodici
    startPeriodicSessionCheck()

    // Listener per i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 AuthProvider: Auth state changed: ${event}`)

      if (event === "SIGNED_IN" && isValidSession(session)) {
        setUser(session.user)
        setSession(session)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setSession(null)
        clearAuthCookies()
      } else if (event === "TOKEN_REFRESHED" && isValidSession(session)) {
        setUser(session.user)
        setSession(session)
      }
    })

    return () => {
      console.log("🧹 AuthProvider: Cleaning up...")
      subscription.unsubscribe()

      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current)
      }
    }
  }, [supabase, isReady])

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
