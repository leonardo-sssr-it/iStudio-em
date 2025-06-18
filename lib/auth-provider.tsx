"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface AuthUser {
  id: string
  email?: string
  username?: string
  nome?: string
  cognome?: string
  ruolo?: string
}

interface AuthContextType {
  user: AuthUser | null
  isAdmin: boolean
  login: (usernameOrEmail: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Determina se l'utente è admin
  const isAdmin = user?.ruolo === "admin" || user?.ruolo === "amministratore"

  // Carica i dati utente dal database
  const loadUserData = useCallback(
    async (authUser: User) => {
      try {
        const { data, error } = await supabase
          .from("utenti")
          .select("id, username, nome, cognome, email, ruolo")
          .eq("id", authUser.id)
          .single()

        if (error) {
          console.error("Errore nel caricamento dati utente:", error)
          return null
        }

        return {
          id: data.id.toString(),
          email: data.email || authUser.email,
          username: data.username,
          nome: data.nome,
          cognome: data.cognome,
          ruolo: data.ruolo,
        }
      } catch (error) {
        console.error("Errore nel caricamento dati utente:", error)
        return null
      }
    },
    [supabase],
  )

  // Inizializza l'autenticazione
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user && mounted) {
          const userData = await loadUserData(session.user)
          if (userData && mounted) {
            setUser(userData)
          }
        }
      } catch (error) {
        console.error("Errore inizializzazione auth:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listener per cambi di stato auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === "SIGNED_IN" && session?.user) {
        const userData = await loadUserData(session.user)
        if (userData && mounted) {
          setUser(userData)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, loadUserData])

  // Funzione di login
  const login = useCallback(
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      try {
        setLoading(true)

        // Determina se è email o username
        const isEmail = usernameOrEmail.includes("@")

        let authResult
        if (isEmail) {
          authResult = await supabase.auth.signInWithPassword({
            email: usernameOrEmail,
            password,
          })
        } else {
          // Per username, prima trova l'email
          const { data: userData, error: userError } = await supabase
            .from("utenti")
            .select("email")
            .eq("username", usernameOrEmail)
            .single()

          if (userError || !userData?.email) {
            return false
          }

          authResult = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
          })
        }

        if (authResult.error) {
          console.error("Errore login:", authResult.error)
          return false
        }

        if (authResult.data.user) {
          const userData = await loadUserData(authResult.data.user)
          if (userData) {
            setUser(userData)
            return true
          }
        }

        return false
      } catch (error) {
        console.error("Errore durante il login:", error)
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase, loadUserData],
  )

  // Funzione di logout ottimizzata
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      // Logout da Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Errore durante il logout:", error)
        throw error
      }

      // Reset stato locale
      setUser(null)

      // Non fare redirect qui, lascia che sia il componente chiamante a gestirlo
    } catch (error) {
      console.error("Errore durante il logout:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
