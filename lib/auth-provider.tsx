"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "./supabase-provider"
import { toast } from "@/components/ui/use-toast"
import * as bcrypt from "bcryptjs"

// Define types directly in this file to avoid circular imports
export interface AuthUser {
  id: string
  username: string
  email?: string
  nome?: string
  cognome?: string
  ruolo: string
  ultimo_accesso?: string
  password: string
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  login: (usernameOrEmail: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  checkSession: () => Promise<boolean>
  hashPassword: (password: string) => Promise<string>
  verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  login: async () => false,
  logout: async () => {},
  refreshUser: async () => {},
  checkSession: async () => false,
  hashPassword: async () => "",
  verifyPassword: async () => false,
})

const AUTH_COOKIE_NAME = "auth_session"
const SESSION_DURATION_DAYS = 7
const HASH_PREFIX = "hashed_"

export function AuthProvider({ children }: { children: ReactNode }) {
  const { supabase, isConnected: supabaseConnected, isInitializing: supabaseInitializing, resetClient } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const isCheckingSessionRef = useRef(false)
  const redirectingRef = useRef(false)
  const initializationCompleteRef = useRef(false)

  const hashPassword = useCallback(async (password: string): Promise<string> => {
    try {
      return await bcrypt.hash(password, 10)
    } catch (error) {
      console.error("Errore nell'hashing della password:", error)
      throw new Error("Impossibile eseguire l'hashing della password")
    }
  }, [])

  const verifyPassword = useCallback(async (password: string, hashedPassword: string): Promise<boolean> => {
    if (!password || !hashedPassword) return false
    try {
      if (hashedPassword.startsWith(HASH_PREFIX)) {
        const actualHash = hashedPassword.substring(HASH_PREFIX.length)
        return await bcrypt.compare(password, actualHash)
      }
      const isHashed = hashedPassword.match(/^\$2[aby]\$\d+\$/) !== null
      if (isHashed) {
        return await bcrypt.compare(password, hashedPassword)
      } else {
        return password === hashedPassword
      }
    } catch (error) {
      console.error("Errore durante la verifica della password:", error)
      return password === hashedPassword
    }
  }, [])

  const fetchUserData = useCallback(
    async (userId: string) => {
      if (!supabase || !userId) return null
      try {
        console.log(`AuthProvider: Fetching user data for ID: ${userId}`)
        const { data, error } = await supabase.from("utenti").select("*").eq("id", userId).single()
        if (error) {
          console.error("AuthProvider: Error fetching user data:", error)
          throw error
        }
        console.log(`AuthProvider: User data fetched successfully for: ${data.username}`)
        return data as AuthUser
      } catch (error) {
        console.error("AuthProvider: Error in fetchUserData:", error)
        return null
      }
    },
    [supabase],
  )

  const updateLastAccess = useCallback(
    async (userId: string) => {
      if (!supabase || !userId) return
      try {
        const { error } = await supabase
          .from("utenti")
          .update({ ultimo_accesso: new Date().toISOString() })
          .eq("id", userId)
        if (error) console.error("Errore nell'aggiornamento dell'ultimo accesso:", error)
      } catch (error) {
        console.error("Errore nell'aggiornamento dell'ultimo accesso:", error)
      }
    },
    [supabase],
  )

  const updatePasswordToHashed = useCallback(
    async (userId: string, plainPassword: string) => {
      if (!supabase || !userId || !plainPassword) return
      try {
        const hashedPassword = await hashPassword(plainPassword)
        const { error } = await supabase
          .from("utenti")
          .update({ password: HASH_PREFIX + hashedPassword })
          .eq("id", userId)
        if (error) console.error("Errore nell'aggiornamento della password:", error)
        else console.log("Password aggiornata con successo alla versione hashata")
      } catch (error) {
        console.error("Errore nell'aggiornamento della password:", error)
      }
    },
    [supabase, hashPassword],
  )

  const clearAllAuthCookies = useCallback(() => {
    if (typeof document === "undefined") return

    console.log("AuthProvider: Clearing all auth cookies and storage")

    // Clear main auth cookie
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`

    // Clear other potential auth cookies
    const cookiesToClear = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "auth-token"]

    cookiesToClear.forEach((cookieName) => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    })

    // Clear with different domains and paths
    const domains = [location.hostname, `.${location.hostname}`]
    const paths = ["/", "/auth"]

    domains.forEach((domain) => {
      paths.forEach((path) => {
        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        })
      })
    })

    // Clear localStorage and sessionStorage
    try {
      const storageKeys = ["supabase.auth.token", "authToken", "authUser", "auth_session", "user_session"]

      storageKeys.forEach((key) => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
    } catch (e) {
      console.error("Errore nella pulizia dello storage:", e)
    }
  }, [])

  const getSessionFromCookie = useCallback(() => {
    if (typeof document === "undefined") return null
    try {
      const cookies = document.cookie.split(";")
      const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`))
      if (sessionCookie) {
        const cookieValue = sessionCookie.split("=")[1]
        return JSON.parse(decodeURIComponent(cookieValue))
      }
    } catch (error) {
      console.error("AuthProvider: Error parsing session cookie:", error)
    }
    return null
  }, [])

  const saveSessionToCookie = useCallback((userId: string, expiresInDays = SESSION_DURATION_DAYS) => {
    if (typeof document === "undefined" || typeof crypto === "undefined") return
    try {
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      const randomToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
      const session = { user_id: userId, expires_at: expiresAt, token: randomToken }
      const cookieValue = encodeURIComponent(JSON.stringify(session))
      const isSecure = window.location.protocol === "https:"
      document.cookie = `${AUTH_COOKIE_NAME}=${cookieValue}; path=/; max-age=${expiresInDays * 24 * 60 * 60}; SameSite=Lax${isSecure ? "; Secure" : ""}`
      console.log(`AuthProvider: Session cookie saved for user: ${userId}`)
    } catch (error) {
      console.error("AuthProvider: Error saving session cookie:", error)
    }
  }, [])

  const checkSession = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous session checks
    if (isCheckingSessionRef.current) {
      console.log("AuthProvider: Session check already in progress, skipping")
      return !!user
    }

    isCheckingSessionRef.current = true

    try {
      console.log("AuthProvider: Starting session check", {
        supabaseReady: !!supabase,
        supabaseInitializing,
        hasUser: !!user,
      })

      if (!supabase || supabaseInitializing) {
        console.log("AuthProvider: Supabase not ready for session check")
        return false
      }

      const session = getSessionFromCookie()

      if (!session || !session.user_id) {
        console.log("AuthProvider: No session cookie found")
        if (user !== null) {
          console.log("AuthProvider: Clearing user state due to missing session")
          setUser(null)
          setIsAdmin(false)
        }
        return false
      }

      // Check if session is expired
      if (new Date(session.expires_at) <= new Date()) {
        console.log("AuthProvider: Session expired, clearing cookies")
        clearAllAuthCookies()
        if (user !== null) {
          setUser(null)
          setIsAdmin(false)
        }
        return false
      }

      // If we already have the user and it matches the session, just refresh the cookie
      if (user && user.id === session.user_id) {
        console.log("AuthProvider: User already loaded, refreshing session cookie")
        saveSessionToCookie(user.id)
        return true
      }

      // Fetch user data
      console.log(`AuthProvider: Fetching user data for session: ${session.user_id}`)
      const userData = await fetchUserData(session.user_id)

      if (!userData) {
        console.log("AuthProvider: User data not found, clearing session")
        clearAllAuthCookies()
        if (user !== null) {
          setUser(null)
          setIsAdmin(false)
        }
        return false
      }

      // Update last access
      await updateLastAccess(userData.id)

      // Set user state
      console.log(`AuthProvider: Setting user state for: ${userData.username}`)
      setUser(userData)
      setIsAdmin(userData.ruolo === "admin")

      // Refresh session cookie
      saveSessionToCookie(userData.id)

      return true
    } catch (error) {
      console.error("AuthProvider: Error in session check:", error)
      if (user !== null) {
        setUser(null)
        setIsAdmin(false)
      }
      return false
    } finally {
      isCheckingSessionRef.current = false
    }
  }, [
    supabase,
    supabaseInitializing,
    user,
    getSessionFromCookie,
    fetchUserData,
    updateLastAccess,
    saveSessionToCookie,
    clearAllAuthCookies,
  ])

  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      console.log("AuthProvider: Starting login process")

      if (!supabase || supabaseInitializing) {
        console.error("AuthProvider: Supabase not ready for login")
        toast({
          title: "Errore di connessione",
          description: "Impossibile connettersi al database",
          variant: "destructive",
        })
        return false
      }

      if (isCheckingSessionRef.current || redirectingRef.current) {
        console.log("AuthProvider: Login blocked - session check or redirect in progress")
        return false
      }

      setIsLoading(true)
      isCheckingSessionRef.current = true

      try {
        const isEmail = usernameOrEmail.includes("@")
        let query = supabase.from("utenti").select("*")
        query = isEmail ? query.eq("email", usernameOrEmail) : query.eq("username", usernameOrEmail)

        console.log(`AuthProvider: Querying user by ${isEmail ? "email" : "username"}: ${usernameOrEmail}`)
        const { data, error } = await query.maybeSingle()

        if (error && !error.message.includes("multiple (or no) rows returned")) {
          console.error("AuthProvider: Database error during login:", error)
          toast({
            title: "Errore di sistema",
            description: "Errore durante il recupero dei dati utente.",
            variant: "destructive",
          })
          return false
        }

        if (!data) {
          console.log("AuthProvider: User not found")
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti.",
            variant: "destructive",
          })
          return false
        }

        const fetchedUser = data as AuthUser
        console.log(`AuthProvider: User found: ${fetchedUser.username}`)

        const isPasswordValid = await verifyPassword(password, fetchedUser.password)
        if (!isPasswordValid) {
          console.log("AuthProvider: Invalid password")
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti.",
            variant: "destructive",
          })
          return false
        }

        console.log("AuthProvider: Password verified successfully")

        // Update password to hashed version if it's still plain text
        if (fetchedUser.password === password) {
          console.log("AuthProvider: Updating password to hashed version")
          await updatePasswordToHashed(fetchedUser.id, password)
        }

        // Update last access
        await updateLastAccess(fetchedUser.id)

        // Save session
        saveSessionToCookie(fetchedUser.id)

        // Set user state
        setUser(fetchedUser)
        setIsAdmin(fetchedUser.ruolo === "admin")

        console.log(`AuthProvider: Login successful for user: ${fetchedUser.username}`)

        // Mark initialization as complete
        initializationCompleteRef.current = true

        // Redirect
        redirectingRef.current = true
        const destination = "/dashboard-utente"
        console.log(`AuthProvider: Redirecting to: ${destination}`)
        router.push(destination)

        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${fetchedUser.nome || fetchedUser.username}!`,
        })

        return true
      } catch (error: any) {
        console.error("AuthProvider: Login error:", error)
        toast({
          title: "Errore",
          description: error.message || "Si è verificato un errore durante il login.",
          variant: "destructive",
        })
        return false
      } finally {
        setIsLoading(false)
        isCheckingSessionRef.current = false
      }
    },
    [
      supabase,
      supabaseInitializing,
      router,
      verifyPassword,
      updatePasswordToHashed,
      updateLastAccess,
      saveSessionToCookie,
    ],
  )

  const logout = useCallback(async (): Promise<void> => {
    if (redirectingRef.current) return

    console.log("AuthProvider: Starting logout process")
    redirectingRef.current = true

    // Clear all auth data
    clearAllAuthCookies()
    setUser(null)
    setIsAdmin(false)
    setSessionChecked(false)
    initializationCompleteRef.current = false

    // Reset Supabase client if available
    if (resetClient) {
      try {
        await resetClient()
        console.log("AuthProvider: Supabase client reset successfully")
      } catch (e) {
        console.error("AuthProvider: Error resetting Supabase client:", e)
      }
    }

    // Redirect to login
    router.push("/")
    toast({
      title: "Logout effettuato",
      description: "Hai effettuato il logout con successo.",
    })

    // Force page reload to ensure clean state
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }, 100)
  }, [router, clearAllAuthCookies, resetClient])

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user?.id || !supabase) return

    console.log(`AuthProvider: Refreshing user data for: ${user.username}`)
    try {
      const userData = await fetchUserData(user.id)
      if (userData) {
        setUser(userData)
        setIsAdmin(userData.ruolo === "admin")
        console.log("AuthProvider: User data refreshed successfully")
      }
    } catch (error) {
      console.error("AuthProvider: Error refreshing user data:", error)
    }
  }, [user, supabase, fetchUserData])

  // Reset redirecting flag on pathname change
  useEffect(() => {
    console.log(`AuthProvider: Pathname changed to: ${pathname}`)
    redirectingRef.current = false
  }, [pathname])

  // Main initialization effect
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      console.log("AuthProvider: Starting initialization", {
        sessionChecked,
        isCheckingSession: isCheckingSessionRef.current,
        supabaseInitializing,
        supabaseConnected,
        hasSupabase: !!supabase,
      })

      // Wait for Supabase to be ready
      if (supabaseInitializing || !supabase) {
        console.log("AuthProvider: Waiting for Supabase to initialize")
        return
      }

      // Prevent multiple initializations
      if (sessionChecked || isCheckingSessionRef.current) {
        console.log("AuthProvider: Initialization already completed or in progress")
        return
      }

      setIsLoading(true)

      try {
        console.log("AuthProvider: Checking session on initialization")
        const hasValidSession = await checkSession()
        console.log(`AuthProvider: Session check result: ${hasValidSession}`)

        if (hasValidSession) {
          console.log("AuthProvider: Valid session found, user authenticated")
        } else {
          console.log("AuthProvider: No valid session, user not authenticated")
        }
      } catch (error) {
        console.error("AuthProvider: Error during initialization:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setSessionChecked(true)
          initializationCompleteRef.current = true
          console.log("AuthProvider: Initialization completed")
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [supabase, supabaseConnected, supabaseInitializing, sessionChecked, checkSession])

  // Periodic session validation
  useEffect(() => {
    if (!initializationCompleteRef.current || !user) return

    console.log("AuthProvider: Setting up periodic session validation")

    const intervalId = setInterval(
      async () => {
        if (isCheckingSessionRef.current) return

        console.log("AuthProvider: Performing periodic session check")
        try {
          const isValid = await checkSession()
          if (!isValid && !redirectingRef.current) {
            console.log("AuthProvider: Periodic check failed, logging out")
            await logout()
          }
        } catch (error) {
          console.error("AuthProvider: Error in periodic session check:", error)
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => {
      clearInterval(intervalId)
      console.log("AuthProvider: Cleared periodic session validation")
    }
  }, [user, checkSession, logout])

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || supabaseInitializing,
    isAdmin,
    login,
    logout,
    refreshUser,
    checkSession,
    hashPassword,
    verifyPassword,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.error("useAuth: AuthContext is undefined. Make sure AuthProvider is wrapping your component.")
    // Return a default context instead of throwing to prevent crashes
    return {
      user: null,
      isLoading: true,
      isAdmin: false,
      login: async () => false,
      logout: async () => {},
      refreshUser: async () => {},
      checkSession: async () => false,
      hashPassword: async () => "",
      verifyPassword: async () => false,
    }
  }
  return context
}
