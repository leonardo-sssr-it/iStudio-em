"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"
import { Loader2 } from "lucide-react"

// Definizione dei ruoli e delle autorizzazioni
type Role = "admin" | "editor" | "user" | "guest"
type Permission = "read" | "write" | "delete" | "admin"

// Mappa delle autorizzazioni per ruolo
const rolePermissions: Record<string, Permission[]> = {
  admin: ["read", "write", "delete", "admin"],
  editor: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"],
  // Valore di default per ruoli non riconosciuti
  default: ["read"],
}

// Mappa delle autorizzazioni richieste per percorso
const pathPermissions: Record<string, Permission> = {
  "/admin": "admin",
  "/profile": "read",
  "/dashboard": "read",
  "/dashboard-u": "read", // Aggiungi autorizzazione per dashboard-u
  "/dashboard-mobile": "read", // Aggiungi autorizzazione per dashboard-mobile
  // Aggiungi altri percorsi secondo necessità
}

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
  requiredPermission?: Permission
}

export function ProtectedRoute({ children, adminOnly = false, requiredPermission }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, checkSession } = useAuth()
  const { isInitializing: supabaseInitializing } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const redirectingRef = useRef(false)
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  const authCheckCompletedRef = useRef(false)

  // Funzione per verificare se l'utente ha una determinata autorizzazione
  const hasPermission = (userRole: string | undefined, permission: Permission): boolean => {
    if (!userRole) return false

    // Normalizza il ruolo (converti in minuscolo)
    const normalizedRole = userRole.toLowerCase()

    // Ottieni i permessi per questo ruolo, o usa i permessi di default se il ruolo non è riconosciuto
    const permissions = rolePermissions[normalizedRole] || rolePermissions.default

    // Verifica se l'utente ha il permesso richiesto
    return permissions.includes(permission)
  }

  // Utilizziamo un effetto per verificare l'autorizzazione una sola volta
  useEffect(() => {
    const checkAuthorizationLogic = async () => {
      console.log("ProtectedRoute: Evaluating authorization...", {
        pathname,
        isLoading,
        supabaseInitializing,
        user: !!user,
        isAdmin,
      })

      // Aspetta che Supabase sia inizializzato
      if (supabaseInitializing) {
        console.log("ProtectedRoute: Supabase is initializing, waiting...")
        return
      }

      if (isLoading) {
        console.log("ProtectedRoute: Auth state is loading. Current isAuthorized:", isAuthorized)
        return
      }

      // Scenario 1: No user object
      if (!user) {
        setIsAuthorized(false)
        console.log("ProtectedRoute: No user. Attempting session recovery or redirecting to login.")
        try {
          const sessionIsValid = await checkSession() // checkSession from useAuth
          if (sessionIsValid) {
            // AuthProvider will update user, this effect will re-run.
            console.log("ProtectedRoute: Session recovery successful, awaiting user state update.")
            return // Wait for re-run with user object
          }
        } catch (error) {
          console.error("ProtectedRoute: Error during session recovery:", error)
          // Fall through to redirect if session recovery fails
        }

        console.log("ProtectedRoute: No user and no valid session. Redirecting to /.")
        if (!redirectingRef.current) {
          redirectingRef.current = true
          router.push("/")
        }
        return
      }

      // Scenario 2: User object exists, check permissions
      if (adminOnly && !isAdmin) {
        setIsAuthorized(false)
        console.log("ProtectedRoute: Admin access required, user is not admin. Redirecting to /dashboard.")
        if (!redirectingRef.current) {
          redirectingRef.current = true
          router.push("/dashboard")
        }
        return
      }

      // Check for specific permission if adminOnly is not the primary guard
      if (requiredPermission) {
        const userHasRequiredPermission = hasPermission(user.ruolo, requiredPermission)
        if (!userHasRequiredPermission) {
          setIsAuthorized(false)
          console.log(`ProtectedRoute: Permission '${requiredPermission}' denied for user. Redirecting to /dashboard.`)
          if (!redirectingRef.current) {
            redirectingRef.current = true
            router.push("/dashboard")
          }
          return
        }
      }

      // All checks passed: User is authorized for this route
      console.log(`ProtectedRoute: User '${user.id}' is authorized for ${pathname}.`)
      setIsAuthorized(true)
    }

    checkAuthorizationLogic()
  }, [user, isLoading, isAdmin, adminOnly, requiredPermission, pathname, router, checkSession, supabaseInitializing])

  // Add or ensure this effect is present to reset redirectingRef on path changes
  useEffect(() => {
    console.log("ProtectedRoute: Pathname changed, resetting redirectingRef.", pathname)
    redirectingRef.current = false
  }, [pathname])

  // Aggiungi questo useEffect dopo quello esistente
  useEffect(() => {
    // Timeout di sicurezza per evitare attese infinite
    const timeoutId = setTimeout(() => {
      if ((isLoading || supabaseInitializing) && !authCheckCompletedRef.current) {
        console.log("ProtectedRoute: Timeout raggiunto, forzo il controllo dell'autorizzazione")
        if (!user && !redirectingRef.current) {
          console.log("ProtectedRoute: Timeout - utente non trovato, reindirizzamento al login")
          redirectingRef.current = true
          router.push("/")
        }
      }
    }, 10000) // 10 secondi di timeout

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isLoading, supabaseInitializing, user, router])

  // Verifica periodica della sessione
  useEffect(() => {
    // Evita verifiche multiple
    if (!isAuthorized) return

    // Verifica periodica della sessione ogni 5 minuti
    const intervalId = setInterval(
      async () => {
        if (isCheckingSession) return

        setIsCheckingSession(true)
        try {
          const isValid = await checkSession()
          if (!isValid && !redirectingRef.current) {
            console.log("Sessione non valida, reindirizzamento al login...")
            redirectingRef.current = true
            router.push("/")
          }
        } catch (error) {
          console.error("Errore nella verifica della sessione:", error)
        } finally {
          setIsCheckingSession(false)
        }
      },
      5 * 60 * 1000,
    ) // 5 minuti

    return () => {
      clearInterval(intervalId)
    }
  }, [isAuthorized, checkSession, router])

  if (isLoading || supabaseInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Mostriamo i figli solo se l'utente è autorizzato
  return isAuthorized ? <>{children}</> : null
}
