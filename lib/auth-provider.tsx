"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "./supabase-provider"
import { toast } from "@/components/ui/use-toast"
import bcrypt from "bcryptjs" // Importiamo bcryptjs per l'hashing delle password

// Tipo per l'utente autenticato
export interface AuthUser {
  id: string
  email: string
  username: string
  nome?: string
  cognome?: string
  ruolo?: string
  ultimo_accesso?: string
  [key: string]: any
}

// Tipo per il contesto di autenticazione
interface AuthContextType {
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

// Creazione del contesto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Nome del cookie di sessione
const AUTH_COOKIE_NAME = "auth_session"
// Durata della sessione in giorni
const SESSION_DURATION_DAYS = 7
// Prefisso per le password hashate
const HASH_PREFIX = "hashed_"

// Provider di autenticazione
export function AuthProvider({ children }: { children: ReactNode }) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Utilizziamo un ref per evitare chiamate multiple
  const isCheckingSessionRef = useRef(false)
  const redirectingRef = useRef(false)

  // Funzione per l'hashing delle password
  const hashPassword = useCallback(async (password: string): Promise<string> => {
    try {
      return await bcrypt.hash(password, 10)
    } catch (error) {
      console.error("Errore nell'hashing della password:", error)
      throw new Error("Impossibile eseguire l'hashing della password")
    }
  }, [])

  // Funzione per verificare le password
  const verifyPassword = useCallback(async (password: string, hashedPassword: string): Promise<boolean> => {
    if (!password || !hashedPassword) return false

    try {
      // Gestione del caso speciale con prefisso "hashed_"
      if (hashedPassword.startsWith(HASH_PREFIX)) {
        // Rimuovi il prefisso per ottenere la vera hash bcrypt
        const actualHash = hashedPassword.substring(HASH_PREFIX.length)
        return await bcrypt.compare(password, actualHash)
      }

      // Verifica se la password è già hashata (inizia con $2a$, $2b$ o $2y$)
      const isHashed = hashedPassword.match(/^\$2[aby]\$\d+\$/) !== null

      if (isHashed) {
        return await bcrypt.compare(password, hashedPassword)
      } else {
        // Se la password non è hashata, confronta direttamente
        return password === hashedPassword
      }
    } catch (error) {
      console.error("Errore durante la verifica della password:", error)
      // Fallback al confronto diretto in caso di errore
      return password === hashedPassword
    }
  }, [])

  // Funzione per recuperare i dati dell'utente dal database
  const fetchUserData = useCallback(
    async (userId: string) => {
      if (!supabase || !userId) return null

      try {
        const { data, error } = await supabase.from("utenti").select("*").eq("id", userId).single()

        if (error) throw error
        return data
      } catch (error) {
        console.error("Errore nel recupero dei dati utente:", error)
        return null
      }
    },
    [supabase],
  )

  // Funzione per aggiornare l'ultimo accesso
  const updateLastAccess = useCallback(
    async (userId: string) => {
      if (!supabase || !userId) return

      try {
        const { error } = await supabase
          .from("utenti")
          .update({ ultimo_accesso: new Date().toISOString() })
          .eq("id", userId)

        if (error) {
          console.error("Errore nell'aggiornamento dell'ultimo accesso:", error)
        }
      } catch (error) {
        console.error("Errore nell'aggiornamento dell'ultimo accesso:", error)
      }
    },
    [supabase],
  )

  // Funzione per aggiornare la password di un utente a una versione hashata
  const updatePasswordToHashed = useCallback(
    async (userId: string, plainPassword: string) => {
      if (!supabase || !userId || !plainPassword) return

      try {
        // Hash della password
        const hashedPassword = await hashPassword(plainPassword)

        // Aggiornamento nel database
        const { error } = await supabase
          .from("utenti")
          .update({ password: HASH_PREFIX + hashedPassword })
          .eq("id", userId)

        if (error) {
          console.error("Errore nell'aggiornamento della password:", error)
        } else {
          console.log("Password aggiornata con successo alla versione hashata")
        }
      } catch (error) {
        console.error("Errore nell'aggiornamento della password:", error)
      }
    },
    [supabase, hashPassword],
  )

  // Funzione per ottenere la sessione dai cookie
  const getSessionFromCookie = useCallback(() => {
    try {
      const cookies = document.cookie.split(";")
      const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`))

      if (sessionCookie) {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split("=")[1]))
        return sessionData
      }
    } catch (error) {
      console.error("Errore nel parsing del cookie di sessione:", error)
    }
    return null
  }, [])

  // Funzione per salvare la sessione nei cookie con sicurezza migliorata
  const saveSessionToCookie = useCallback((userId: string, expiresInDays = SESSION_DURATION_DAYS) => {
    try {
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      // Aggiungiamo un token casuale per aumentare la sicurezza
      const randomToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      const session = {
        user_id: userId,
        expires_at: expiresAt,
        token: randomToken, // Token casuale per evitare attacchi di replay
      }

      // Utilizziamo encodeURIComponent per gestire correttamente i caratteri speciali
      const cookieValue = encodeURIComponent(JSON.stringify(session))

      // Impostiamo il cookie con SameSite=Lax e Secure se in HTTPS
      const isSecure = window.location.protocol === "https:"
      document.cookie = `${AUTH_COOKIE_NAME}=${cookieValue}; path=/; max-age=${
        expiresInDays * 24 * 60 * 60
      }; SameSite=Lax${isSecure ? "; Secure" : ""}`
    } catch (error) {
      console.error("Errore nel salvataggio del cookie di sessione:", error)
    }
  }, [])

  // Funzione per verificare la validità della sessione
  const checkSession = useCallback(async (): Promise<boolean> => {
    // Evita chiamate multiple contemporanee
    if (isCheckingSessionRef.current) {
      console.log("AuthProvider: Verifica sessione già in corso")
      return !!user // Ritorna lo stato corrente dell'utente
    }

    isCheckingSessionRef.current = true

    // Non impostiamo isLoading qui per evitare flickering durante i check automatici
    // setIsLoading(true) - Rimuoviamo questa riga

    if (!supabase) {
      console.log("AuthProvider: Client Supabase non disponibile")
      isCheckingSessionRef.current = false
      return false
    }

    try {
      // Recupera la sessione dai cookie
      const session = getSessionFromCookie()

      if (!session || !session.user_id) {
        // Non cambiamo lo stato se l'utente è già null
        if (user !== null) {
          setUser(null)
        }
        isCheckingSessionRef.current = false
        return false
      }

      // Verifica se la sessione è scaduta
      if (new Date(session.expires_at) <= new Date()) {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        if (user !== null) {
          setUser(null)
        }
        isCheckingSessionRef.current = false
        return false
      }

      // Se l'utente è già caricato con lo stesso ID, evitiamo di ricaricarlo
      if (user && user.id === session.user_id) {
        // Rinnova solo la sessione
        saveSessionToCookie(user.id)
        isCheckingSessionRef.current = false
        return true
      }

      // Recupera i dati dell'utente
      const userData = await fetchUserData(session.user_id)

      if (!userData) {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
        if (user !== null) {
          setUser(null)
        }
        isCheckingSessionRef.current = false
        return false
      }

      // Aggiorna l'ultimo accesso
      await updateLastAccess(userData.id)

      // Imposta i dati utente in un'unica operazione
      setUser(userData)
      setIsAdmin(userData.ruolo === "admin")

      // Rinnova la sessione
      saveSessionToCookie(userData.id)

      isCheckingSessionRef.current = false
      return true
    } catch (error) {
      console.error("AuthProvider: Errore nella verifica della sessione:", error)
      if (user !== null) {
        setUser(null)
      }
      isCheckingSessionRef.current = false
      return false
    }
  }, [supabase, user, getSessionFromCookie, fetchUserData, updateLastAccess, saveSessionToCookie])

  // Funzione di login
  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      if (!supabase) {
        toast({
          title: "Errore di connessione",
          description: "Impossibile connettersi al database",
          variant: "destructive",
        })
        return false
      }

      // Evita login multipli
      if (isCheckingSessionRef.current || redirectingRef.current) {
        return false
      }

      setIsLoading(true)
      isCheckingSessionRef.current = true

      try {
        // Verifica se l'input è un'email o un username
        const isEmail = usernameOrEmail.includes("@")

        // Query per trovare l'utente
        let query = supabase.from("utenti").select("*")

        if (isEmail) {
          query = query.eq("email", usernameOrEmail)
        } else {
          query = query.eq("username", usernameOrEmail)
        }

        // Utilizziamo .maybeSingle() invece di .single() per evitare errori quando non viene trovato alcun utente
        const { data, error } = await query.maybeSingle()

        // Se c'è un errore che non è relativo a "nessun risultato trovato"
        if (error && !error.message.includes("multiple (or no) rows returned")) {
          toast({
            title: "Errore di sistema",
            description: "Si è verificato un errore durante il recupero dei dati utente",
            variant: "destructive",
          })
          return false
        }

        // Se non è stato trovato alcun utente
        if (!data) {
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti",
            variant: "destructive",
          })
          return false
        }

        // Verifica la password (supporta sia password in chiaro che hashate)
        const isPasswordValid = await verifyPassword(password, data.password)

        if (!isPasswordValid) {
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti",
            variant: "destructive",
          })
          return false
        }

        // Se la password è valida ma non è hashata, aggiorniamola alla versione hashata
        if (data.password === password) {
          await updatePasswordToHashed(data.id, password)
        }

        // Aggiorna l'ultimo accesso
        await updateLastAccess(data.id)

        // Salva la sessione nei cookie
        saveSessionToCookie(data.id)

        // Imposta i dati utente - Importante: facciamo questo in un'unica operazione
        // per evitare re-render multipli
        setUser(data)
        setIsAdmin(data.ruolo === "admin")

        // Imposta il flag di reindirizzamento prima del toast per evitare flickering
        redirectingRef.current = true

        // Mostriamo il toast solo dopo aver impostato tutti gli stati
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${data.nome || data.username}!`,
        })

        // Reindirizza l'utente in base al ruolo
        const destination = data.ruolo === "admin" ? "/admin" : "/dashboard"
        router.push(destination)

        return true
      } catch (error: any) {
        // Gestiamo l'errore "multiple (or no) rows returned" come un avviso
        if (error.message && error.message.includes("multiple (or no) rows returned")) {
          toast({
            title: "Credenziali non valide",
            description: "Username/email o password non corretti",
            variant: "destructive",
          })
        } else {
          console.error("Errore durante il login:", error)
          toast({
            title: "Errore",
            description: "Si è verificato un errore durante il login",
            variant: "destructive",
          })
        }
        return false
      } finally {
        // Impostiamo isLoading a false solo se non stiamo reindirizzando
        // per evitare flickering durante il cambio di pagina
        if (!redirectingRef.current) {
          setIsLoading(false)
        }
        isCheckingSessionRef.current = false
      }
    },
    [supabase, router, verifyPassword, updatePasswordToHashed, updateLastAccess, saveSessionToCookie],
  )

  // Funzione di logout
  const logout = useCallback(async (): Promise<void> => {
    // Evita logout multipli
    if (redirectingRef.current) {
      return
    }

    redirectingRef.current = true

    // Rimuovi il cookie di sessione
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`

    // Resetta lo stato
    setUser(null)
    setIsAdmin(false)
    setSessionChecked(false)

    // Reindirizza alla pagina di login
    router.push("/login")

    toast({
      title: "Logout effettuato",
      description: "Hai effettuato il logout con successo",
    })
  }, [router])

  // Funzione per aggiornare i dati dell'utente
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
  }, [user, supabase, fetchUserData])

  // Resetta il flag di reindirizzamento quando cambia il pathname
  useEffect(() => {
    redirectingRef.current = false
  }, [pathname])

  // Verifica la sessione all'avvio
  useEffect(() => {
    let isMounted = true

    const checkSessionOnLoad = async () => {
      if (sessionChecked || isCheckingSessionRef.current) {
        return
      }

      setIsLoading(true)

      try {
        await checkSession()
      } catch (error) {
        console.error("AuthProvider: Errore nella verifica della sessione:", error)
      } finally {
        // Verifichiamo che il componente sia ancora montato
        if (isMounted) {
          setIsLoading(false)
          setSessionChecked(true)
        }
      }
    }

    if (supabase) {
      checkSessionOnLoad()
    } else {
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [supabase, checkSession, sessionChecked])

  // Valore del contesto
  const contextValue: AuthContextType = {
    user,
    isLoading,
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

// Hook per utilizzare il contesto di autenticazione
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve essere utilizzato all'interno di un AuthProvider")
  }
  return context
}
