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
  signUp: (email: string, password: string, metadata: any) => Promise<void>
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
  signUp: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  checkSession: async () => false,
  hashPassword: async () => "",
  verifyPassword: async () => false,
})

const AUTH_COOKIE_NAME = "istudio_auth_session"
const SESSION_STORAGE_KEY = "istudio_auth_backup"
const SESSION_DURATION_DAYS = 7
const HASH_PREFIX = "hashed_"

// Stato persistente globale per prevenire reset durante unmount/remount
const persistentAuthState = {
  user: null as AuthUser | null,
  isAdmin: false,
  sessionChecked: false,
  lastSessionCheck: 0,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { supabase, isConnected: supabaseConnected, isInitializing: supabaseInitializing } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(persistentAuthState.user)
  const [isLoading, setIsLoading] = useState(!persistentAuthState.sessionChecked)
  const [isAdmin, setIsAdmin] = useState(persistentAuthState.isAdmin)
  const [sessionChecked, setSessionChecked] = useState(persistentAuthState.sessionChecked)
  const isCheckingSessionRef = useRef(false)
  const redirectingRef = useRef(false)
  const initializationRef = useRef(false)
  const renderCountRef = useRef(0)
  const lastStateRef = useRef<string>("")
  const mountedRef = useRef(true)

  // Debouncing per evitare render multipli - con riduzione log
  const currentState = JSON.stringify({
    user: !!user,
    isLoading,
    supabaseConnected,
    supabaseInitializing,
    sessionChecked,
  })

  if (currentState !== lastStateRef.current) {
    renderCountRef.current++
    lastStateRef.current = currentState

    // Log solo ogni 5 render per ridurre spam
    if (renderCountRef.current % 5 === 1) {
      console.log("AuthProvider: Render", {
        user: !!user,
        isLoading,
        supabaseConnected,
        supabaseInitializing,
        sessionChecked,
        renderCount: renderCountRef.current,
      })
    }
  }

  // Salva lo stato in sessionStorage come backup
  const saveStateToStorage = useCallback((userData: AuthUser | null, adminStatus: boolean) => {
    if (typeof window === "undefined") return
    try {
      const stateBackup = {
        user: userData,
        isAdmin: adminStatus,
        timestamp: Date.now(),
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateBackup))
    } catch (error) {
      console.error("AuthProvider: Errore nel salvataggio dello stato:", error)
    }
  }, [])

  // Recupera lo stato da sessionStorage
  const loadStateFromStorage = useCallback(() => {
    if (typeof window === "undefined") return null
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const stateBackup = JSON.parse(stored)
        // Verifica che il backup non sia troppo vecchio (max 1 ora)
        if (Date.now() - stateBackup.timestamp < 3600000) {
          return stateBackup
        }
      }
    } catch (error) {
      console.error("AuthProvider: Errore nel recupero dello stato:", error)
    }
    return null
  }, [])

  // Aggiorna lo stato persistente
  const updatePersistentState = useCallback(
    (userData: AuthUser | null, adminStatus: boolean, checked: boolean) => {
      persistentAuthState.user = userData
      persistentAuthState.isAdmin = adminStatus
      persistentAuthState.sessionChecked = checked
      persistentAuthState.lastSessionCheck = Date.now()

      // Salva anche in sessionStorage
      saveStateToStorage(userData, adminStatus)
    },
    [saveStateToStorage],
  )

  const hashPassword = useCallback(async (password: string): Promise<string> => {
    try {
      return await bcrypt.hash(password, 10)
    } catch (error) {
      console.error("AuthProvider: Errore nell'hashing della password:", error)
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
      console.error("AuthProvider: Errore durante la verifica della password:", error)
      return password === hashedPassword
    }
  }, [])

  const fetchUserData = useCallback(
    async (userId: string) => {
      if (!supabase || !userId) {
        return null
      }

      try {
        const { data, error } = await supabase.from("utenti").select("*").eq("id", userId).single()

        if (error) {
          console.error("AuthProvider: Errore nel recupero dei dati utente:", error)
          return null
        }

        return data as AuthUser
      } catch (error) {
        console.error("AuthProvider: Errore nel recupero dei dati utente:", error)
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
        if (error) console.error("AuthProvider: Errore nell'aggiornamento dell'ultimo accesso:", error)
      } catch (error) {
        console.error("AuthProvider: Errore nell'aggiornamento dell'ultimo accesso:", error)
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
        if (error) console.error("AuthProvider: Errore nell'aggiornamento della password:", error)
        else console.log("AuthProvider: Password aggiornata con successo alla versione hashata")
      } catch (error) {
        console.error("AuthProvider: Errore nell'aggiornamento della password:", error)
      }
    },
    [supabase, hashPassword],
  )

  const clearAllAuthCookies = useCallback(() => {
    if (typeof document === "undefined") return

    console.log("AuthProvider: Pulizia di tutti i cookie di autenticazione")

    // Lista di tutti i possibili cookie da pulire
    const cookiesToClear = [
      AUTH_COOKIE_NAME,
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "supabase.auth.token",
    ]

    cookiesToClear.forEach((cookieName) => {
      // Pulisci per il dominio corrente
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`

      // Pulisci per domini alternativi
      const domains = [location.hostname, `.${location.hostname}`]
      const paths = ["/", "/auth"]

      domains.forEach((domain) => {
        paths.forEach((path) => {
          document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        })
      })
    })

    // Pulisci anche localStorage e sessionStorage
    try {
      const keysToRemove = ["supabase.auth.token", "authToken", "authUser", "istudio_auth_session"]

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
      })

      // Rimuovi anche il backup dello stato
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch (e) {
      console.error("AuthProvider: Errore nella pulizia dello storage:", e)
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
      console.error("AuthProvider: Errore nel parsing del cookie di sessione:", error)
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
      console.error("AuthProvider: Errore nel salvataggio del cookie di sessione:", error)
    }
  }, [])

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (isCheckingSessionRef.current) {
      return !!user
    }

    // Usa cache per evitare controlli ripetuti
    const now = Date.now()
    if (persistentAuthState.sessionChecked && now - persistentAuthState.lastSessionCheck < 10000) {
      console.log("AuthProvider: Sessione già verificata di recente")
      return !!persistentAuthState.user
    }

    isCheckingSessionRef.current = true

    if (!supabase || supabaseInitializing) {
      isCheckingSessionRef.current = false
      return false
    }

    try {
      console.log("AuthProvider: Verifica sessione...")

      const session = getSessionFromCookie()
      if (!session || !session.user_id || new Date(session.expires_at) <= new Date()) {
        console.log("AuthProvider: Sessione non valida o scaduta")

        // Prova a recuperare dallo storage come fallback
        const storageBackup = loadStateFromStorage()
        if (storageBackup && storageBackup.user) {
          console.log("AuthProvider: Recupero stato da storage backup")
          if (mountedRef.current) {
            setUser(storageBackup.user)
            setIsAdmin(storageBackup.isAdmin)
            updatePersistentState(storageBackup.user, storageBackup.isAdmin, true)
          }
          isCheckingSessionRef.current = false
          return true
        }

        if (session && typeof document !== "undefined") {
          clearAllAuthCookies()
        }
        if (user !== null && mountedRef.current) {
          setUser(null)
          setIsAdmin(false)
          updatePersistentState(null, false, true)
        }
        isCheckingSessionRef.current = false
        return false
      }

      // Se abbiamo già l'utente con lo stesso ID, estendi solo la sessione
      if (user && user.id === session.user_id) {
        saveSessionToCookie(user.id)
        updatePersistentState(user, isAdmin, true)
        isCheckingSessionRef.current = false
        return true
      }

      // Recupera i dati utente dal database
      const userData = await fetchUserData(session.user_id)
      if (!userData) {
        console.log("AuthProvider: Dati utente non trovati")
        clearAllAuthCookies()
        if (user !== null && mountedRef.current) {
          setUser(null)
          setIsAdmin(false)
          updatePersistentState(null, false, true)
        }
        isCheckingSessionRef.current = false
        return false
      }

      console.log("AuthProvider: Sessione valida, utente autenticato:", userData.username)

      // Aggiorna ultimo accesso
      await updateLastAccess(userData.id)

      // Imposta lo stato dell'utente
      if (mountedRef.current) {
        setUser(userData)
        setIsAdmin(userData.ruolo === "admin")
        updatePersistentState(userData, userData.ruolo === "admin", true)
      }

      // Estendi la sessione
      saveSessionToCookie(userData.id)

      isCheckingSessionRef.current = false
      return true
    } catch (error) {
      console.error("AuthProvider: Errore nella verifica della sessione:", error)
      if (user !== null && mountedRef.current) {
        setUser(null)
        setIsAdmin(false)
        updatePersistentState(null, false, true)
      }
      isCheckingSessionRef.current = false
      return false
    }
  }, [
    supabase,
    supabaseInitializing,
    user,
    isAdmin,
    getSessionFromCookie,
    fetchUserData,
    updateLastAccess,
    saveSessionToCookie,
    clearAllAuthCookies,
    loadStateFromStorage,
    updatePersistentState,
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

      if (isCheckingSessionRef.current || redirectingRef.current) {
        return false
      }

      setIsLoading(true)
      isCheckingSessionRef.current = true

      try {
        console.log("AuthProvider: Tentativo di login per:", usernameOrEmail)

        const isEmail = usernameOrEmail.includes("@")
        let query = supabase.from("utenti").select("*")
        query = isEmail ? query.eq("email", usernameOrEmail) : query.eq("username", usernameOrEmail)
        const { data, error } = await query.maybeSingle()

        if (error && !error.message.includes("multiple (or no) rows returned")) {
          console.error("AuthProvider: Errore nella query utente:", error)
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

        console.log("AuthProvider: Login riuscito per:", fetchedUser.username)

        // Se la password è in chiaro, aggiornala
        if (fetchedUser.password === password) {
          await updatePasswordToHashed(fetchedUser.id, password)
        }

        // Aggiorna ultimo accesso
        await updateLastAccess(fetchedUser.id)

        // Salva la sessione
        saveSessionToCookie(fetchedUser.id)

        // Imposta lo stato dell'utente
        if (mountedRef.current) {
          setUser(fetchedUser)
          setIsAdmin(fetchedUser.ruolo === "admin")
          setIsLoading(false)
          updatePersistentState(fetchedUser, fetchedUser.ruolo === "admin", true)
        }

        // Redirect
        redirectingRef.current = true
        const destination = "/dashboard-utente"
        router.push(destination)

        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${fetchedUser.nome || fetchedUser.username}!`,
        })

        return true
      } catch (error: any) {
        console.error("AuthProvider: Errore durante il login:", error)
        toast({
          title: "Errore",
          description: error.message || "Si è verificato un errore durante il login.",
          variant: "destructive",
        })
        return false
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
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
      updatePersistentState,
    ],
  )

  const signUp = useCallback(
    async (email: string, password: string, metadata: any): Promise<void> => {
      if (!supabase || supabaseInitializing) {
        throw new Error("Database non disponibile")
      }

      try {
        console.log("AuthProvider: Tentativo di registrazione per:", email)

        // Verifica se l'utente esiste già
        const { data: existingUser } = await supabase
          .from("utenti")
          .select("id")
          .or(`email.eq.${email},username.eq.${metadata.username}`)
          .maybeSingle()

        if (existingUser) {
          throw new Error("Utente già esistente")
        }

        // Hash della password
        const hashedPassword = await hashPassword(password)

        // Inserisci il nuovo utente
        const { error } = await supabase.from("utenti").insert({
          email,
          username: metadata.username,
          nome: metadata.nome,
          cognome: metadata.cognome,
          password: HASH_PREFIX + hashedPassword,
          ruolo: "user",
          attivo: true,
          data_creazione: new Date().toISOString(),
        })

        if (error) {
          throw error
        }

        console.log("AuthProvider: Registrazione completata per:", email)
      } catch (error: any) {
        console.error("AuthProvider: Errore durante la registrazione:", error)
        throw error
      }
    },
    [supabase, supabaseInitializing, hashPassword],
  )

  const logout = useCallback(async (): Promise<void> => {
    if (redirectingRef.current) return

    console.log("AuthProvider: Logout in corso...")
    redirectingRef.current = true

    // Pulisci tutti i cookie e lo storage
    clearAllAuthCookies()

    // Reset dello stato locale e persistente
    if (mountedRef.current) {
      setUser(null)
      setIsAdmin(false)
      setSessionChecked(false)
    }
    updatePersistentState(null, false, false)

    // Redirect alla home
    router.push("/")

    toast({
      title: "Logout effettuato",
      description: "Hai effettuato il logout con successo.",
    })

    // Reset del flag dopo un breve delay
    setTimeout(() => {
      redirectingRef.current = false
    }, 1000)
  }, [router, clearAllAuthCookies, updatePersistentState])

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user?.id || !supabase) return
    try {
      const userData = await fetchUserData(user.id)
      if (userData && mountedRef.current) {
        setUser(userData)
        setIsAdmin(userData.ruolo === "admin")
        updatePersistentState(userData, userData.ruolo === "admin", true)
      }
    } catch (error) {
      console.error("AuthProvider: Errore nell'aggiornamento dei dati utente:", error)
    }
  }, [user, supabase, fetchUserData, updatePersistentState])

  // Reset del flag di redirect quando cambia il pathname
  useEffect(() => {
    if (redirectingRef.current) {
      redirectingRef.current = false
    }
  }, [pathname])

  // Inizializzazione con recupero dello stato persistente
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const initializeAuth = async () => {
      // Evita inizializzazioni multiple
      if (initializationRef.current || sessionChecked || isCheckingSessionRef.current) {
        return
      }

      if (supabaseInitializing || !supabase) {
        return
      }

      // Prova prima a recuperare lo stato persistente
      if (persistentAuthState.sessionChecked && persistentAuthState.user) {
        console.log("AuthProvider: Recupero stato persistente")
        if (isMounted) {
          setUser(persistentAuthState.user)
          setIsAdmin(persistentAuthState.isAdmin)
          setSessionChecked(true)
          setIsLoading(false)
        }
        return
      }

      initializationRef.current = true
      setIsLoading(true)

      try {
        console.log("AuthProvider: Inizializzazione autenticazione...")
        await checkSession()
      } catch (error) {
        console.error("AuthProvider: Errore nella verifica della sessione iniziale:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setSessionChecked(true)
          initializationRef.current = false
        }
      }
    }

    // Debouncing: aspetta 150ms prima di inizializzare
    if (supabase && supabaseConnected && !supabaseInitializing) {
      timeoutId = setTimeout(initializeAuth, 150)
    } else if (!supabaseInitializing && !supabaseConnected) {
      setIsLoading(false)
    }

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [supabase, supabaseConnected, supabaseInitializing, checkSession, sessionChecked])

  // Cleanup controllato
  useEffect(() => {
    return () => {
      mountedRef.current = false
      console.log("AuthProvider: Componente smontato")
      // NON resettiamo lo stato persistente qui per mantenerlo tra i remount
    }
  }, [])

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || supabaseInitializing,
    isAdmin,
    login,
    signUp,
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
      signUp: async () => {},
      logout: async () => {},
      refreshUser: async () => {},
      checkSession: async () => false,
      hashPassword: async () => "",
      verifyPassword: async () => false,
    }
  }
  return context
}
