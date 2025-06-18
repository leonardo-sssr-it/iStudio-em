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
        const { data, error } = await supabase.from("utenti").select("*").eq("id", userId).single()
        if (error) throw error
        return data as AuthUser
      } catch (error) {
        console.error("Errore nel recupero dei dati utente:", error)
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

    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    document.cookie = `sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    document.cookie = `supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`

    const domains = [location.hostname, `.${location.hostname}`, ""]
    const paths = ["/", "/auth", ""]

    domains.forEach((domain) => {
      paths.forEach((path) => {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        document.cookie = `sb-access-token=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        document.cookie = `sb-refresh-token=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      })
    })

    try {
      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("authToken")
      localStorage.removeItem("authUser")
      sessionStorage.removeItem("supabase.auth.token")
      sessionStorage.removeItem("authToken")
      sessionStorage.removeItem("authUser")
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
        return JSON.parse(decodeURIComponent(sessionCookie.split("=")[1]))
      }
    } catch (error) {
      console.error("Errore nel parsing del cookie di sessione:", error)
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
    } catch (error) {
      console.error("Errore nel salvataggio del cookie di sessione:", error)
    }
  }, [])

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (isCheckingSessionRef.current) return !!user
    isCheckingSessionRef.current = true
    if (!supabase || supabaseInitializing) {
      isCheckingSessionRef.current = false
      return false
    }
    try {
      const session = getSessionFromCookie()
      if (!session || !session.user_id || new Date(session.expires_at) <= new Date()) {
        if (session && typeof document !== "undefined") {
          clearAllAuthCookies()
        }
        if (user !== null) setUser(null)
        isCheckingSessionRef.current = false
        return false
      }
      if (user && user.id === session.user_id) {
        saveSessionToCookie(user.id)
        isCheckingSessionRef.current = false
        return true
      }
      const userData = await fetchUserData(session.user_id)
      if (!userData) {
        clearAllAuthCookies()
        if (user !== null) setUser(null)
        isCheckingSessionRef.current = false
        return false
      }
      await updateLastAccess(userData.id)
      setUser(userData)
      setIsAdmin(userData.ruolo === "admin")
      saveSessionToCookie(userData.id)
      isCheckingSessionRef.current = false
      return true
    } catch (error) {
      console.error("AuthProvider: Errore nella verifica della sessione:", error)
      if (user !== null) setUser(null)
      isCheckingSessionRef.current = false
      return false
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
    setUser,
    setIsAdmin,
  ])

  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      if (!supabase || supabaseInitializing) {
        toast({
          title: "Errore di connessione",
          description: "Impossibile connettersi al database",
          variant: "destructive",
        })
        return false
      }
      if (isCheckingSessionRef.current || redirectingRef.current) return false
      setIsLoading(true)
      isCheckingSessionRef.current = true
      try {
        const isEmail = usernameOrEmail.includes("@")
        let query = supabase.from("utenti").select("*")
        query = isEmail ? query.eq("email", usernameOrEmail) : query.eq("username", usernameOrEmail)
        const { data, error } = await query.maybeSingle()

        if (error && !error.message.includes("multiple (or no) rows returned")) {
          toast({
            title: "Errore di sistema",
            description: "Errore durante il recupero dei dati utente.",
            variant: "destructive",
          })
          return false
        }
        if (!data) {
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti.",
            variant: "destructive",
          })
          return false
        }
        const fetchedUser = data as AuthUser
        const isPasswordValid = await verifyPassword(password, fetchedUser.password)
        if (!isPasswordValid) {
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti.",
            variant: "destructive",
          })
          return false
        }
        if (fetchedUser.password === password) {
          await updatePasswordToHashed(fetchedUser.id, password)
        }
        await updateLastAccess(fetchedUser.id)
        saveSessionToCookie(fetchedUser.id)
        setUser(fetchedUser)
        setIsAdmin(fetchedUser.ruolo === "admin")
        setIsLoading(false)
        redirectingRef.current = true
        const destination = "/dashboard-utente"
        router.push(destination)
        toast({ title: "Login effettuato", description: `Benvenuto, ${fetchedUser.nome || fetchedUser.username}!` })
        return true
      } catch (error: any) {
        console.error("Errore durante il login:", error)
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
      setUser,
      setIsAdmin,
    ],
  )

  const logout = useCallback(async (): Promise<void> => {
    if (redirectingRef.current) return
    redirectingRef.current = true

    clearAllAuthCookies()
    setUser(null)
    setIsAdmin(false)
    setSessionChecked(false)

    if (resetClient) {
      try {
        await resetClient()
      } catch (e) {
        console.error("Errore nel reset del client Supabase:", e)
      }
    }

    router.push("/")
    toast({ title: "Logout effettuato", description: "Hai effettuato il logout con successo." })

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }, 100)
  }, [router, setUser, setIsAdmin, clearAllAuthCookies, resetClient])

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user?.id || !supabase) return
    try {
      const userData = await fetchUserData(user.id)
      if (userData) {
        setUser(userData)
        setIsAdmin(userData.ruolo === "admin")
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dei dati utente:", error)
    }
  }, [user, supabase, fetchUserData, setUser, setIsAdmin])

  useEffect(() => {
    if (redirectingRef.current) {
      redirectingRef.current = false
    }
  }, [pathname])

  useEffect(() => {
    let isMounted = true
    const checkSessionOnLoad = async () => {
      if (sessionChecked || isCheckingSessionRef.current || supabaseInitializing) return
      setIsLoading(true)
      try {
        await checkSession()
      } catch (error) {
        console.error("AuthProvider: Errore nella verifica della sessione iniziale:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setSessionChecked(true)
        }
      }
    }
    if (supabase && supabaseConnected) {
      checkSessionOnLoad()
    } else if (!supabaseInitializing) {
      setIsLoading(false)
    }
    return () => {
      isMounted = false
    }
  }, [supabase, supabaseConnected, supabaseInitializing, checkSession, sessionChecked])

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
