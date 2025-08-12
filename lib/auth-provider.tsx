"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useSupabase } from "./supabase-provider"
import bcrypt from "bcryptjs"

interface User {
  id: number
  nome: string
  username: string
  email: string
  ruolo?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (identifier: string, password: string) => Promise<boolean>
  logout: () => void
  checkSession: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Stato globale per prevenire reset durante unmount/remount
let globalAuthState = {
  user: null as User | null,
  isLoading: true,
  sessionChecked: false,
  lastSessionCheck: 0,
  sessionCache: new Map<string, User | null>(),
}

// Backup in sessionStorage
const SESSION_STORAGE_KEY = "istudio_auth_backup"
const SESSION_CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected, isInitializing } = useSupabase()
  const [user, setUser] = useState<User | null>(globalAuthState.user)
  const [isLoading, setIsLoading] = useState<boolean>(globalAuthState.isLoading)
  const renderCountRef = useRef(0)
  const initializingRef = useRef(false)

  // Incrementa render count
  renderCountRef.current++

  // Log ridotti - solo ogni 5 render
  if (renderCountRef.current % 5 === 1) {
    console.log(`AuthProvider: Render`, {
      user: !!user,
      isLoading,
      supabaseConnected: isConnected,
      supabaseInitializing: isInitializing,
      sessionChecked: globalAuthState.sessionChecked,
      renderCount: renderCountRef.current,
    })
  }

  // Calcola isAdmin
  const isAdmin = user?.ruolo === "admin" || user?.username === "admin"

  // Funzioni helper per sessionStorage
  const saveToSessionStorage = (userData: User | null) => {
    try {
      if (userData) {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }),
        )
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch (e) {
      console.warn("AuthProvider: Errore salvataggio sessionStorage:", e)
    }
  }

  const loadFromSessionStorage = (): User | null => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return null

      const { user: userData, timestamp } = JSON.parse(stored)

      // Verifica se il backup è ancora valido (5 minuti)
      if (Date.now() - timestamp > SESSION_CACHE_DURATION) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        return null
      }

      return userData
    } catch (e) {
      console.warn("AuthProvider: Errore caricamento sessionStorage:", e)
      return null
    }
  }

  // Funzione per verificare la sessione
  const checkSession = async (): Promise<User | null> => {
    if (!supabase || !isConnected) return null

    try {
      console.log("AuthProvider: Verifica sessione...")

      // Cache delle verifiche sessione per evitare chiamate ripetute
      const now = Date.now()
      const cacheKey = "session_check"

      if (now - globalAuthState.lastSessionCheck < 10000 && globalAuthState.sessionCache.has(cacheKey)) {
        const cachedUser = globalAuthState.sessionCache.get(cacheKey)
        console.log("AuthProvider: Usando sessione dalla cache")
        return cachedUser
      }

      // Verifica cookie di sessione
      const sessionCookie = document.cookie.split("; ").find((row) => row.startsWith("istudio_session="))

      if (!sessionCookie) {
        console.log("AuthProvider: Nessun cookie di sessione trovato")
        globalAuthState.sessionCache.set(cacheKey, null)
        globalAuthState.lastSessionCheck = now
        return null
      }

      const sessionData = sessionCookie.split("=")[1]
      if (!sessionData) {
        console.log("AuthProvider: Cookie di sessione vuoto")
        globalAuthState.sessionCache.set(cacheKey, null)
        globalAuthState.lastSessionCheck = now
        return null
      }

      // Decodifica i dati della sessione
      let userData: User
      try {
        userData = JSON.parse(decodeURIComponent(sessionData))
      } catch (e) {
        console.log("AuthProvider: Cookie di sessione non valido")
        globalAuthState.sessionCache.set(cacheKey, null)
        globalAuthState.lastSessionCheck = now
        return null
      }

      // Verifica che l'utente esista ancora nel database
      const { data: dbUser, error } = await supabase
        .from("utenti")
        .select("id, nome, username, email, ruolo")
        .eq("id", userData.id)
        .single()

      if (error || !dbUser) {
        console.log("AuthProvider: Utente non trovato nel database")
        // Rimuovi cookie non valido
        document.cookie = "istudio_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        globalAuthState.sessionCache.set(cacheKey, null)
        globalAuthState.lastSessionCheck = now
        return null
      }

      console.log("AuthProvider: Sessione valida per:", dbUser.username)
      globalAuthState.sessionCache.set(cacheKey, dbUser)
      globalAuthState.lastSessionCheck = now
      return dbUser
    } catch (error) {
      console.error("AuthProvider: Errore verifica sessione:", error)
      return null
    }
  }

  // Funzione di login
  const login = async (identifier: string, password: string): Promise<boolean> => {
    if (!supabase || !isConnected) {
      console.error("AuthProvider: Supabase non disponibile per login")
      return false
    }

    try {
      console.log(`AuthProvider: Tentativo di login per: ${identifier}`)

      // Cerca l'utente per username o email
      const { data: users, error } = await supabase
        .from("utenti")
        .select("id, nome, username, email, password, ruolo")
        .or(`username.eq.${identifier},email.eq.${identifier}`)

      if (error || !users || users.length === 0) {
        console.log("AuthProvider: Utente non trovato")
        return false
      }

      const user = users[0]

      // Verifica password
      let passwordValid = false

      if (user.password) {
        // Se la password inizia con $2, è già hashata con bcrypt
        if (user.password.startsWith("$2")) {
          passwordValid = await bcrypt.compare(password, user.password)
        } else {
          // Password in chiaro - verifica e poi aggiorna con hash
          passwordValid = user.password === password

          if (passwordValid) {
            // Aggiorna la password con hash
            const hashedPassword = await bcrypt.hash(password, 10)
            await supabase.from("utenti").update({ password: hashedPassword }).eq("id", user.id)
            console.log("AuthProvider: Password aggiornata con hash")
          }
        }
      }

      if (!passwordValid) {
        console.log("AuthProvider: Password non valida")
        return false
      }

      // Crea oggetto utente senza password
      const userData: User = {
        id: user.id,
        nome: user.nome,
        username: user.username,
        email: user.email,
        ruolo: user.ruolo,
      }

      // Salva cookie di sessione (scade in 24 ore)
      const sessionData = encodeURIComponent(JSON.stringify(userData))
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `istudio_session=${sessionData}; expires=${expires}; path=/; SameSite=Lax`

      // Aggiorna stato globale
      globalAuthState.user = userData
      globalAuthState.isLoading = false
      globalAuthState.sessionChecked = true

      // Aggiorna stato locale
      setUser(userData)
      setIsLoading(false)

      // Salva backup in sessionStorage
      saveToSessionStorage(userData)

      // Pulisci cache sessione per forzare ricaricamento
      globalAuthState.sessionCache.clear()

      console.log(`AuthProvider: Login riuscito per: ${userData.username}`)
      return true
    } catch (error) {
      console.error("AuthProvider: Errore login:", error)
      return false
    }
  }

  // Funzione di logout
  const logout = () => {
    console.log("AuthProvider: Logout")

    // Rimuovi cookie
    document.cookie = "istudio_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Reset stato globale
    globalAuthState.user = null
    globalAuthState.isLoading = false
    globalAuthState.sessionChecked = true
    globalAuthState.sessionCache.clear()

    // Reset stato locale
    setUser(null)
    setIsLoading(false)

    // Rimuovi backup
    saveToSessionStorage(null)
  }

  // Inizializzazione auth
  useEffect(() => {
    const initializeAuth = async () => {
      // Previeni inizializzazioni multiple
      if (initializingRef.current || globalAuthState.sessionChecked) {
        return
      }

      // Aspetta che Supabase sia pronto
      if (isInitializing || !isConnected) {
        return
      }

      initializingRef.current = true

      try {
        console.log("AuthProvider: Inizializzazione autenticazione...")

        // Prima prova a recuperare dallo stato globale
        if (globalAuthState.user && !globalAuthState.isLoading) {
          setUser(globalAuthState.user)
          setIsLoading(false)
          return
        }

        // Poi prova sessionStorage come backup
        const backupUser = loadFromSessionStorage()
        if (backupUser) {
          console.log("AuthProvider: Recupero utente da sessionStorage")
          globalAuthState.user = backupUser
          globalAuthState.isLoading = false
          globalAuthState.sessionChecked = true
          setUser(backupUser)
          setIsLoading(false)
          return
        }

        // Infine verifica la sessione dal cookie
        const sessionUser = await checkSession()

        globalAuthState.user = sessionUser
        globalAuthState.isLoading = false
        globalAuthState.sessionChecked = true

        setUser(sessionUser)
        setIsLoading(false)

        if (sessionUser) {
          saveToSessionStorage(sessionUser)
        }
      } catch (error) {
        console.error("AuthProvider: Errore inizializzazione:", error)
        globalAuthState.user = null
        globalAuthState.isLoading = false
        globalAuthState.sessionChecked = true
        setUser(null)
        setIsLoading(false)
      } finally {
        initializingRef.current = false
      }
    }

    initializeAuth()
  }, [supabase, isConnected, isInitializing])

  const value: AuthContextType = {
    user,
    isLoading,
    isAdmin,
    login,
    logout,
    checkSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
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
  globalAuthState = {
    user: null,
    isLoading: true,
    sessionChecked: false,
    lastSessionCheck: 0,
    sessionCache: new Map(),
  }
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (e) {
    // Ignora errori sessionStorage
  }
}
