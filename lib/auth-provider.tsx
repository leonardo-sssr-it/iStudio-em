"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { useSupabase } from "./supabase-provider"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  login: async () => ({ user: null, error: null }),
  logout: async () => {},
  checkSession: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Costanti per la gestione delle sessioni
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minuti
const SESSION_CHECK_THROTTLE = 1000 // 1 secondo

export function AuthProvider({ children }: AuthProviderProps) {
  const { supabase, isInitialized } = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Refs per prevenire race conditions
  const isCheckingSessionRef = useRef(false)
  const initializationCompleteRef = useRef(false)
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSessionCheckRef = useRef<number>(0)

  // Funzione per pulire tutti i cookie di autenticazione
  const clearAuthCookies = () => {
    console.log("🍪 AuthProvider: Clearing all auth cookies...")

    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "supabase.auth.token",
      "sb-localhost-auth-token",
      "sb-127.0.0.1-auth-token",
      "auth-token",
      "session",
      "user-session",
      "auth-session",
    ]

    const domains = ["", ".localhost", ".127.0.0.1", window.location.hostname]
    const paths = ["/", "/auth", "/dashboard"]

    cookiesToClear.forEach((cookieName) => {
      domains.forEach((domain) => {
        paths.forEach((path) => {
          const cookieString = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=Lax; Secure`
          document.cookie = cookieString

          // Anche senza domain
          const cookieStringNoDomain = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`
          document.cookie = cookieStringNoDomain
        })
      })
    })

    // Pulisci anche localStorage e sessionStorage
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes("supabase") || key.includes("auth") || key.includes("session"))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      const sessionKeysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes("supabase") || key.includes("auth") || key.includes("session"))) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))

      console.log("✅ AuthProvider: Auth cookies and storage cleared")
    } catch (error) {
      console.error("❌ AuthProvider: Error clearing storage:", error)
    }
  }

  // Funzione per validare una sessione
  const isValidSession = (session: Session | null): boolean => {
    if (!session) return false

    try {
      // Verifica che la sessione abbia i campi obbligatori
      if (!session.access_token || !session.user) {
        console.warn("⚠️ AuthProvider: Session missing required fields")
        return false
      }

      // Verifica che la sessione non sia scaduta
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
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

  // Funzione per controllare la sessione con throttling
  const checkSession = async () => {
    if (!supabase || !isInitialized) {
      console.log("⏳ AuthProvider: Supabase not ready for session check")
      return
    }

    // Throttling: non controllare più di una volta al secondo
    const now = Date.now()
    if (now - lastSessionCheckRef.current < SESSION_CHECK_THROTTLE) {
      console.log("🚫 AuthProvider: Session check throttled")
      return
    }
    lastSessionCheckRef.current = now

    if (isCheckingSessionRef.current) {
      console.log("🚫 AuthProvider: Session check already in progress")
      return
    }

    isCheckingSessionRef.current = true
    console.log("🔍 AuthProvider: Checking session...")

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ AuthProvider: Error getting session:", error.message)
        setUser(null)
        setSession(null)
        clearAuthCookies()
        return
      }

      if (isValidSession(session)) {
        console.log("✅ AuthProvider: Valid session found")
        setUser(session.user)
        setSession(session)
      } else {
        console.log("❌ AuthProvider: Invalid or expired session")
        setUser(null)
        setSession(null)
        clearAuthCookies()

        // Tentativo di recupero automatico
        try {
          console.log("🔄 AuthProvider: Attempting session recovery...")
          const {
            data: { session: recoveredSession },
            error: recoveryError,
          } = await supabase.auth.refreshSession()

          if (!recoveryError && isValidSession(recoveredSession)) {
            console.log("✅ AuthProvider: Session recovered successfully")
            setUser(recoveredSession.user)
            setSession(recoveredSession)
          } else {
            console.log("❌ AuthProvider: Session recovery failed")
          }
        } catch (recoveryError) {
          console.error("❌ AuthProvider: Session recovery error:", recoveryError)
        }
      }
    } catch (error) {
      console.error("❌ AuthProvider: Unexpected error during session check:", error)
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

    console.log("⏰ AuthProvider: Starting periodic session checks...")
    sessionCheckIntervalRef.current = setInterval(() => {
      console.log("⏰ AuthProvider: Periodic session check triggered")
      checkSession()
    }, SESSION_CHECK_INTERVAL)
  }

  const login = async (email: string, password: string) => {
    if (!supabase) {
      console.error("❌ AuthProvider: Supabase not available for login")
      return { user: null, error: { message: "Supabase not available" } as AuthError }
    }

    console.log("🔐 AuthProvider: Attempting login for:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ AuthProvider: Login error:", error.message)
        return { user: null, error }
      }

      if (isValidSession(data.session)) {
        console.log("✅ AuthProvider: Login successful")
        setUser(data.user)
        setSession(data.session)

        // Avvia i controlli periodici dopo il login
        startPeriodicSessionCheck()

        return { user: data.user, error: null }
      } else {
        console.error("❌ AuthProvider: Invalid session after login")
        return { user: null, error: { message: "Invalid session" } as AuthError }
      }
    } catch (error) {
      console.error("❌ AuthProvider: Unexpected login error:", error)
      return { user: null, error: error as AuthError }
    }
  }

  const logout = async () => {
    console.log("🚪 AuthProvider: Logging out...")

    // Ferma i controlli periodici
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current)
      sessionCheckIntervalRef.current = null
    }

    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error("❌ AuthProvider: Logout error:", error.message)
        } else {
          console.log("✅ AuthProvider: Logout successful")
        }
      } catch (error) {
        console.error("❌ AuthProvider: Unexpected logout error:", error)
      }
    }

    // Pulisci lo stato e i cookie
    setUser(null)
    setSession(null)
    clearAuthCookies()
  }

  // Effetto per l'inizializzazione
  useEffect(() => {
    if (!isInitialized || !supabase) {
      console.log("⏳ AuthProvider: Waiting for Supabase initialization...")
      return
    }

    if (initializationCompleteRef.current) {
      console.log("✅ AuthProvider: Already initialized")
      return
    }

    console.log("🚀 AuthProvider: Starting initialization...")

    // Controlla la sessione iniziale
    checkSession()

    // Avvia i controlli periodici
    startPeriodicSessionCheck()

    // Listener per i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthProvider: Auth state changed:", event)

      if (event === "SIGNED_IN" && isValidSession(session)) {
        console.log("✅ AuthProvider: User signed in")
        setUser(session.user)
        setSession(session)
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 AuthProvider: User signed out")
        setUser(null)
        setSession(null)
        clearAuthCookies()
      } else if (event === "TOKEN_REFRESHED" && isValidSession(session)) {
        console.log("🔄 AuthProvider: Token refreshed")
        setUser(session.user)
        setSession(session)
      }
    })

    // Cleanup
    return () => {
      console.log("🧹 AuthProvider: Cleaning up...")
      subscription.unsubscribe()
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current)
      }
    }
  }, [isInitialized, supabase])

  const value = {
    user,
    session,
    isLoading,
    login,
    logout,
    checkSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
