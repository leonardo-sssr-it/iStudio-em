"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
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
    // Evita verifiche multiple
    if (authCheckCompletedRef.current) return

    // Funzione per gestire l'autorizzazione
    const checkAuthorization = async () => {
      console.log("ProtectedRoute: Inizio verifica autorizzazione", { isLoading, user: !!user })

      // Se stiamo ancora caricando, non facciamo nulla
      if (isLoading) {
        console.log("ProtectedRoute: Ancora in caricamento, aspetto...")
        return
      }

      // Verifichiamo se l'utente è autenticato
      if (!user) {
        // Prima di reindirizzare, proviamo a verificare la sessione una volta
        console.log("ProtectedRoute: Utente non trovato, verifico la sessione...")

        try {
          const sessionValid = await checkSession()
          if (sessionValid) {
            console.log("ProtectedRoute: Sessione valida trovata, aspetto aggiornamento utente...")
            return // Aspetta che l'utente venga aggiornato
          }
        } catch (error) {
          console.error("ProtectedRoute: Errore nella verifica della sessione:", error)
        }

        // L'utente non è autenticato, reindirizza al login
        console.log("ProtectedRoute: Utente non autenticato, reindirizzamento al login")
        if (!redirectingRef.current) {
          redirectingRef.current = true
          router.push("/login")
        }
        return
      }

      // Se adminOnly è true, verifichiamo se l'utente è admin
      if (adminOnly && !isAdmin) {
        console.log("ProtectedRoute: Accesso riservato agli admin, reindirizzamento alla dashboard")
        if (!redirectingRef.current) {
          redirectingRef.current = true
          router.push("/dashboard")
        }
        return
      }

      // Se è specificato un permesso richiesto, verifichiamo se l'utente lo ha
      if (requiredPermission) {
        const userHasPermission = hasPermission(user.ruolo, requiredPermission)
        console.log(
          `ProtectedRoute: Verifica permesso ${requiredPermission} per ruolo ${user.ruolo}: ${userHasPermission}`,
        )

        if (!userHasPermission) {
          console.log(
            `ProtectedRoute: Utente non autorizzato per ${requiredPermission}, reindirizzamento alla dashboard`,
          )
          if (!redirectingRef.current) {
            redirectingRef.current = true
            router.push("/dashboard")
          }
          return
        }
      }

      // L'utente è autorizzato
      console.log(`ProtectedRoute: Utente autorizzato per ${pathname}`)
      setIsAuthorized(true)
      authCheckCompletedRef.current = true
    }

    checkAuthorization()

    // Pulizia quando il componente viene smontato
    return () => {
      redirectingRef.current = false
    }
  }, [user, isLoading, isAdmin, router, adminOnly, pathname, requiredPermission, checkSession])

  // Aggiungi questo useEffect dopo quello esistente
  useEffect(() => {
    // Timeout di sicurezza per evitare attese infinite
    const timeoutId = setTimeout(() => {
      if (isLoading && !authCheckCompletedRef.current) {
        console.log("ProtectedRoute: Timeout raggiunto, forzo il controllo dell'autorizzazione")
        if (!user && !redirectingRef.current) {
          console.log("ProtectedRoute: Timeout - utente non trovato, reindirizzamento al login")
          redirectingRef.current = true
          router.push("/login")
        }
      }
    }, 10000) // 10 secondi di timeout

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isLoading, user, router])

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
            router.push("/login")
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Mostriamo i figli solo se l'utente è autorizzato
  return isAuthorized ? <>{children}</> : null
}
