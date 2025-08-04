"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import type { Database } from "@/types/supabase"

type User = Database["public"]["Tables"]["utenti"]["Row"]

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hashPassword: (password: string) => Promise<string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Nomi dei cookie di sessione da pulire
const SESSION_COOKIE_NAMES = [
  "session",
  "auth-token",
  "user-session",
  "sb-access-token",
  "sb-refresh-token",
  "supabase-auth-token",
  "next-auth.session-token",
  "next-auth.csrf-token",
  "istudio-session",
  "istudio-auth",
]

// Intervallo per il controllo periodico delle sessioni (5 minuti)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected } = useSupabase()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const lastSessionCheck = useRef<number>(0)
  const isCheckingSession = useRef(false)

  // Funzione per l'hash delle password
  const hashPassword = useCallback(async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }, [])

  // Funzione per pulire tutti i cookie di autenticazione
  const clearAuthCookies = useCallback(() => {
    console.log("🍪 AuthProvider: Clearing authentication cookies...")

    SESSION_COOKIE_NAMES.forEach((cookieName) => {
      // Pulisci per il dominio corrente
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`

      // Pulisci per il dominio con punto
      const domain = window.location.hostname
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`
    })

    // Pulisci anche localStorage e sessionStorage
    try {
      localStorage.removeItem("user")
      localStorage.removeItem("session")
      localStorage.removeItem("auth-token")
      sessionStorage.removeItem("user")
      sessionStorage.removeItem("session")
      sessionStorage.removeItem("auth-token")
    } catch (error) {
      console.warn("🍪 AuthProvider: Error clearing storage:", error)
    }

    console.log("✅ AuthProvider: Authentication cookies cleared")
  }, [])

  // Funzione per validare una sessione
  const validateSession = useCallback((sessionData: any): boolean => {
    if (!sessionData || typeof sessionData !== "object") {
      return false
    }

    // Controlla che abbia i campi necessari
    const requiredFields = ["id", "username", "email"]
    const hasRequiredFields = requiredFields.every((field) => sessionData[field])

    if (!hasRequiredFields) {
      console.warn("🔐 AuthProvider: Session missing required fields")
      return false
    }

    // Controlla la scadenza se presente
    if (sessionData.expires) {
      const expirationTime = new Date(sessionData.expires).getTime()
      const currentTime = Date.now()

      if (currentTime > expirationTime) {
        console.warn("🔐 AuthProvider: Session expired")
        return false
      }
    }

    // Controlla la lunghezza del token se presente
    if (sessionData.token && sessionData.token.length < 32) {
      console.warn("🔐 AuthProvider: Session token too short")
      return false
    }

    return true
  }, [])

  // Funzione per controllare la sessione esistente
  const checkExistingSession = useCallback(async () => {
    // Throttling: non controllare più di una volta al secondo
    const now = Date.now()
    if (now - lastSessionCheck.current < 1000) {
      console.log("🔐 AuthProvider: Session check throttled")
      return
    }

    if (isCheckingSession.current) {
      console.log("🔐 AuthProvider: Session check already in progress")
      return
    }

    isCheckingSession.current = true
    lastSessionCheck.current = now

    console.log("🔐 AuthProvider: Checking existing session...")

    try {
      // Controlla se c'è una sessione nei cookie
      const cookies = document.cookie.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          if (key && value) {
            acc[key] = decodeURIComponent(value)
          }
          return acc
        },
        {} as Record<string, string>,
      )

      // Cerca una sessione valida
      let sessionData = null
      for (const cookieName of SESSION_COOKIE_NAMES) {
        if (cookies[cookieName]) {
          try {
            sessionData = JSON.parse(cookies[cookieName])
            if (validateSession(sessionData)) {
              console.log("🔐 AuthProvider: Valid session found in cookie:", cookieName)
              break
            }
          } catch (error) {
            console.warn("🔐 AuthProvider: Invalid session data in cookie:", cookieName)
          }
        }
      }

      // Se non c'è sessione nei cookie, controlla localStorage
      if (!sessionData) {
        try {
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            if (validateSession(parsedUser)) {
              sessionData = parsedUser
              console.log("🔐 AuthProvider: Valid session found in localStorage")
            }
          }
        } catch (error) {
          console.warn("🔐 AuthProvider: Invalid session data in localStorage")
        }
      }

      if (sessionData && supabase && isConnected) {
        // Verifica che l'utente esista ancora nel database
        const { data: userData, error } = await supabase
          .from("utenti")
          .select("*")
          .eq("id", sessionData.id)
          .eq("attivo", true)
          .single()

        if (userData && !error) {
          console.log("✅ AuthProvider: Session validated successfully")
          setUser(userData)
          setIsAuthenticated(true)

          // Aggiorna la sessione nei cookie
          const sessionCookie = JSON.stringify({
            ...userData,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 ore
            token: crypto.getRandomValues(new Uint8Array(32)).join(""),
          })

          document.cookie = `session=${encodeURIComponent(sessionCookie)}; path=/; max-age=${24 * 60 * 60}; SameSite=Strict`
          localStorage.setItem("user", JSON.stringify(userData))
        } else {
          console.warn("🔐 AuthProvider: Session validation failed - user not found or inactive")
          await logout()
        }
      } else if (!sessionData) {
        console.log("🔐 AuthProvider: No existing session found")
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("❌ AuthProvider: Error checking session:", error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
      isCheckingSession.current = false
    }
  }, [supabase, isConnected, validateSession])

  // Funzione di login
  const login = useCallback(
    async (username: string, password: string) => {
      if (!supabase) {
        return { success: false, error: "Database connection not available" }
      }

      console.log("🔐 AuthProvider: Attempting login for user:", username)
      setIsLoading(true)

      try {
        const hashedPassword = await hashPassword(password)

        const { data: userData, error } = await supabase
          .from("utenti")
          .select("*")
          .eq("username", username)
          .eq("password", hashedPassword)
          .eq("attivo", true)
          .single()

        if (error || !userData) {
          console.warn("🔐 AuthProvider: Login failed - invalid credentials")
          return { success: false, error: "Credenziali non valide" }
        }

        // Aggiorna ultimo accesso
        await supabase.from("utenti").update({ ultimo_accesso: new Date().toISOString() }).eq("id", userData.id)

        // Crea la sessione
        const sessionData = {
          ...userData,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 ore
          token: crypto.getRandomValues(new Uint8Array(32)).join(""),
        }

        // Salva la sessione
        const sessionCookie = JSON.stringify(sessionData)
        document.cookie = `session=${encodeURIComponent(sessionCookie)}; path=/; max-age=${24 * 60 * 60}; SameSite=Strict`
        localStorage.setItem("user", JSON.stringify(userData))

        setUser(userData)
        setIsAuthenticated(true)

        console.log("✅ AuthProvider: Login successful")
        return { success: true }
      } catch (error) {
        console.error("❌ AuthProvider: Login error:", error)
        return { success: false, error: "Errore durante il login" }
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, hashPassword],
  )

  // Funzione di logout
  const logout = useCallback(async () => {
    console.log("🔐 AuthProvider: Logging out...")

    clearAuthCookies()
    setUser(null)
    setIsAuthenticated(false)

    console.log("✅ AuthProvider: Logout completed")
  }, [clearAuthCookies])

  // Funzione per aggiornare i dati dell'utente
  const refreshUser = useCallback(async () => {
    if (!user || !supabase) return

    console.log("🔐 AuthProvider: Refreshing user data...")

    try {
      const { data: userData, error } = await supabase.from("utenti").select("*").eq("id", user.id).single()

      if (userData && !error) {
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        console.log("✅ AuthProvider: User data refreshed")
      }
    } catch (error) {
      console.error("❌ AuthProvider: Error refreshing user:", error)
    }
  }, [user, supabase])

  // Effetto per controllare la sessione quando Supabase è pronto
  useEffect(() => {
    if (isConnected && supabase) {
      console.log("🔐 AuthProvider: Supabase ready, checking session...")
      checkExistingSession()
    }
  }, [isConnected, supabase, checkExistingSession])

  // Effetto per il controllo periodico delle sessioni
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🔐 AuthProvider: Starting periodic session validation...")

      sessionCheckInterval.current = setInterval(() => {
        console.log("🔐 AuthProvider: Periodic session check...")
        checkExistingSession()
      }, SESSION_CHECK_INTERVAL)
    }

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
        sessionCheckInterval.current = null
      }
    }
  }, [isAuthenticated, user, checkExistingSession])

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    hashPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
