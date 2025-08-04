"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { useSupabase } from "@/lib/supabase-provider"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Configurazione per la gestione delle sessioni
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minuti
const SESSION_CHECK_THROTTLE = 1000 // 1 secondo
const SESSION_COOKIE_NAMES = [
  "sb-access-token",
  "sb-refresh-token",
  "supabase-auth-token",
  "supabase.auth.token",
  "sb-localhost-auth-token",
  "supabase-auth",
  "auth-token",
  "session",
  "access_token",
  "refresh_token",
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected } = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const lastSessionCheck = useRef<number>(0)
  const isCheckingSessionRef = useRef(false)
  const initializationCompleteRef = useRef(false)

  // Funzione per pulire tutti i cookie di autenticazione
  const clearAuthCookies = useCallback(() => {
    console.log("🍪 AuthProvider: Clearing all auth cookies...")

    SESSION_COOKIE_NAMES.forEach((cookieName) => {
      // Pulisci per il dominio corrente
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`

      // Pulisci per domini parent
      const hostParts = window.location.hostname.split(".")
      if (hostParts.length > 1) {
        const parentDomain = hostParts.slice(-2).join(".")
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${parentDomain};`
      }

      console.log(`🍪 AuthProvider: Cleared cookie: ${cookieName}`)
    })

    // Pulisci anche localStorage e sessionStorage
    try {
      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("sb-localhost-auth-token")
      sessionStorage.removeItem("supabase.auth.token")
      sessionStorage.removeItem("sb-localhost-auth-token")
      console.log("🍪 AuthProvider: Cleared localStorage and sessionStorage")
    } catch (error) {
      console.error("🍪 AuthProvider: Error clearing storage:", error)
    }
  }, [])

  // Funzione per validare una sessione
  const validateSession = useCallback((session: Session | null): boolean => {
    if (!session) {
      console.log("🔍 AuthProvider: No session to validate")
      return false
    }

    // Controlla che la sessione abbia i campi obbligatori
    if (!session.access_token || !session.user) {
      console.warn("🔍 AuthProvider: Session missing required fields")
      return false
    }

    // Controlla la scadenza
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.warn("🔍 AuthProvider: Session expired")
      return false
    }

    // Controlla la lunghezza del token (dovrebbe essere abbastanza lungo)
    if (session.access_token.length < 32) {
      console.warn("🔍 AuthProvider: Access token too short")
      return false
    }

    console.log("✅ AuthProvider: Session validation passed")
    return true
  }, [])

  // Funzione per controllare la sessione corrente
  const checkSession = useCallback(async () => {
    if (!supabase || !isConnected) {
      console.log("🔍 AuthProvider: Supabase not ready for session check")
      return
    }

    // Throttling per evitare chiamate eccessive
    const now = Date.now()
    if (now - lastSessionCheck.current < SESSION_CHECK_THROTTLE) {
      console.log("🔍 AuthProvider: Session check throttled")
      return
    }

    // Evita chiamate multiple simultanee
    if (isCheckingSessionRef.current) {
      console.log("🔍 AuthProvider: Session check already in progress")
      return
    }

    isCheckingSessionRef.current = true
    lastSessionCheck.current = now

    try {
      console.log("🔍 AuthProvider: Checking current session...")

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("🔍 AuthProvider: Error getting session:", error)
        setUser(null)
        setSession(null)
        clearAuthCookies()
        return
      }

      if (currentSession && validateSession(currentSession)) {
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
      console.error("🔍 AuthProvider: Error in checkSession:", error)
      setUser(null)
      setSession(null)
      clearAuthCookies()
    } finally {
      isCheckingSessionRef.current = false
    }
  }, [supabase, isConnected, validateSession, clearAuthCookies])

  // Funzione per tentare il recupero della sessione
  const attemptSessionRecovery = useCallback(async () => {
    if (!supabase || !isConnected) return

    try {
      console.log("🔄 AuthProvider: Attempting session recovery...")

      const {
        data: { session: recoveredSession },
        error,
      } = await supabase.auth.refreshSession()

      if (error) {
        console.error("🔄 AuthProvider: Session recovery failed:", error)
        return false
      }

      if (recoveredSession && validateSession(recoveredSession)) {
        console.log("✅ AuthProvider: Session recovered successfully")
        setUser(recoveredSession.user)
        setSession(recoveredSession)
        return true
      }

      console.log("❌ AuthProvider: Session recovery failed - invalid session")
      return false
    } catch (error) {
      console.error("🔄 AuthProvider: Error during session recovery:", error)
      return false
    }
  }, [supabase, isConnected, validateSession])

  // Inizializzazione dell'AuthProvider
  useEffect(() => {
    if (!supabase || !isConnected || initializationCompleteRef.current) {
      console.log("🚀 AuthProvider: Skipping initialization", {
        hasSupabase: !!supabase,
        isConnected,
        initializationComplete: initializationCompleteRef.current,
      })
      return
    }

    console.log("🚀 AuthProvider: Starting initialization...")

    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Controlla la sessione corrente
        await checkSession()

        // Imposta il listener per i cambiamenti di autenticazione
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(`🔄 AuthProvider: Auth state changed: ${event}`)

          switch (event) {
            case "SIGNED_IN":
              if (session && validateSession(session)) {
                console.log("✅ AuthProvider: User signed in")
                setUser(session.user)
                setSession(session)
              }
              break

            case "SIGNED_OUT":
              console.log("👋 AuthProvider: User signed out")
              setUser(null)
              setSession(null)
              clearAuthCookies()
              break

            case "TOKEN_REFRESHED":
              if (session && validateSession(session)) {
                console.log("🔄 AuthProvider: Token refreshed")
                setUser(session.user)
                setSession(session)
              }
              break

            case "USER_UPDATED":
              if (session && validateSession(session)) {
                console.log("👤 AuthProvider: User updated")
                setUser(session.user)
                setSession(session)
              }
              break

            default:
              console.log(`🔄 AuthProvider: Unhandled auth event: ${event}`)
          }
        })

        initializationCompleteRef.current = true
        console.log("✅ AuthProvider: Initialization completed")

        return () => {
          console.log("🧹 AuthProvider: Cleaning up auth subscription")
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("❌ AuthProvider: Initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const cleanup = initializeAuth()

    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn()
      })
    }
  }, [supabase, isConnected, checkSession, validateSession, clearAuthCookies])

  // Controllo periodico della sessione
  useEffect(() => {
    if (!supabase || !isConnected || !initializationCompleteRef.current) {
      return
    }

    console.log("⏰ AuthProvider: Starting periodic session validation...")

    sessionCheckInterval.current = setInterval(async () => {
      console.log("⏰ AuthProvider: Periodic session check...")

      if (session && !validateSession(session)) {
        console.warn("⚠️ AuthProvider: Current session invalid, attempting recovery...")

        const recovered = await attemptSessionRecovery()
        if (!recovered) {
          console.error("❌ AuthProvider: Session recovery failed, signing out...")
          await signOut()
        }
      } else if (!session) {
        console.log("🔍 AuthProvider: No session, checking for available session...")
        await checkSession()
      }
    }, SESSION_CHECK_INTERVAL)

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
        console.log("🧹 AuthProvider: Cleared session check interval")
      }
    }
  }, [supabase, isConnected, session, validateSession, attemptSessionRecovery, checkSession])

  // Funzioni di autenticazione
  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: new Error("Supabase not initialized") as AuthError }
      }

      try {
        console.log("🔐 AuthProvider: Attempting sign in...")
        setIsLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error("🔐 AuthProvider: Sign in error:", error)
          return { error }
        }

        if (data.session && validateSession(data.session)) {
          console.log("✅ AuthProvider: Sign in successful")
          setUser(data.session.user)
          setSession(data.session)
        }

        return { error: null }
      } catch (error) {
        console.error("🔐 AuthProvider: Sign in exception:", error)
        return { error: error as AuthError }
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, validateSession],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: new Error("Supabase not initialized") as AuthError }
      }

      try {
        console.log("📝 AuthProvider: Attempting sign up...")
        setIsLoading(true)

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          console.error("📝 AuthProvider: Sign up error:", error)
          return { error }
        }

        console.log("✅ AuthProvider: Sign up successful")
        return { error: null }
      } catch (error) {
        console.error("📝 AuthProvider: Sign up exception:", error)
        return { error: error as AuthError }
      } finally {
        setIsLoading(false)
      }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return

    try {
      console.log("👋 AuthProvider: Attempting sign out...")
      setIsLoading(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("👋 AuthProvider: Sign out error:", error)
      }

      // Pulisci lo stato locale indipendentemente dall'errore
      setUser(null)
      setSession(null)
      clearAuthCookies()

      console.log("✅ AuthProvider: Sign out completed")
    } catch (error) {
      console.error("👋 AuthProvider: Sign out exception:", error)
      // Pulisci comunque lo stato locale
      setUser(null)
      setSession(null)
      clearAuthCookies()
    } finally {
      setIsLoading(false)
    }
  }, [supabase, clearAuthCookies])

  const resetPassword = useCallback(
    async (email: string) => {
      if (!supabase) {
        return { error: new Error("Supabase not initialized") as AuthError }
      }

      try {
        console.log("🔑 AuthProvider: Attempting password reset...")

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
          console.error("🔑 AuthProvider: Password reset error:", error)
          return { error }
        }

        console.log("✅ AuthProvider: Password reset email sent")
        return { error: null }
      } catch (error) {
        console.error("🔑 AuthProvider: Password reset exception:", error)
        return { error: error as AuthError }
      }
    },
    [supabase],
  )

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
