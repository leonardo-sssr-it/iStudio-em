"use client"

import type React from "react"

import { useState, useCallback, memo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  Settings,
  User,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Database,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { useCustomTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

// Regex per validazione email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Componente ottimizzato con memo per evitare re-render inutili
export const AuthWidget = memo(function AuthWidget() {
  // Stati
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    usernameOrEmail?: string
    password?: string
    general?: string
  }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)

  // Refs
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isMountedRef = useRef(true)

  // Hooks
  const { login, user, isAdmin, logout } = useAuth()
  const { isDarkMode } = useCustomTheme()
  const router = useRouter()

  // Focus sull'input username al caricamento
  useEffect(() => {
    if (!user && usernameInputRef.current) {
      usernameInputRef.current.focus()
    }
  }, [user])

  // Aggiungere nell'useEffect di cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Validazione input
  const validateInputs = useCallback(() => {
    const newErrors: {
      usernameOrEmail?: string
      password?: string
    } = {}

    // Validazione username/email
    if (!usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = "Username o email richiesti"
    } else if (usernameOrEmail.includes("@") && !EMAIL_REGEX.test(usernameOrEmail)) {
      newErrors.usernameOrEmail = "Formato email non valido"
    }

    // Validazione password
    if (!password) {
      newErrors.password = "Password richiesta"
    } else if (password.length < 6) {
      newErrors.password = "Password troppo corta"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [usernameOrEmail, password])

  // Gestione submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validazione
      if (!validateInputs()) {
        return
      }

      // Evita doppi submit
      if (isSubmitting) {
        return
      }

      setIsSubmitting(true)
      setErrors({})

      try {
        // Utilizziamo una variabile locale per evitare race conditions
        const loginSuccess = await login(usernameOrEmail, password)

        // Solo se il componente è ancora montato, aggiorniamo lo stato
        if (loginSuccess) {
          // Non resettiamo i campi qui, lasciamo che sia il redirect a gestire il cambio di vista
          setLoginAttempts(0)
        } else {
          // Incrementa tentativi falliti
          setLoginAttempts((prev) => prev + 1)
          setErrors({
            general: "Credenziali non valide. Riprova.",
          })
          toast({
            title: "Errore di accesso",
            description: "Credenziali non valide. Riprova.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Errore durante il login:", error)
        setErrors({
          general: "Si è verificato un errore durante l'accesso.",
        })
        toast({
          title: "Errore di accesso",
          description: "Si è verificato un errore. Riprova più tardi.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [usernameOrEmail, password, login, validateInputs, isSubmitting],
  )

  // Gestione logout
  const handleLogout = useCallback(() => {
    logout()
    toast({
      title: "Logout effettuato",
      description: "Arrivederci!",
    })
  }, [logout])

  // Gestione tasto invio
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isSubmitting && formRef.current) {
        formRef.current.requestSubmit()
      }
    },
    [isSubmitting],
  )

  // Componente per utente autenticato
  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        key={user ? "logged-in" : "logged-out"} // Aggiungere una key per forzare l'animazione corretta
      >
        <Card className="w-full shadow-md transition-all hover:shadow-lg border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Bentornato!</CardTitle>
            <CardDescription className="text-lg font-medium">{user.nome || user.username}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="text-center p-4 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Ruolo: {isAdmin ? "Amministratore" : "Utente"}</span>
              </div>
            </div>

            {/* Pulsanti principali */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-2" asChild>
                <Link href={isAdmin ? "/admin" : "/dashboard"}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>{isAdmin ? "Vai alla Dashboard Admin" : "Vai alla Dashboard"}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>

              {/* Altri pulsanti secondari */}
              <div className="grid grid-cols-2 gap-2">
                <Link href="/profile" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-10 flex items-center justify-center gap-1 border-primary/30 hover:bg-primary/10"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profilo</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full h-10 flex items-center justify-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Esci</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 text-center text-xs text-muted-foreground">
            <p className="w-full">Ultimo accesso: {new Date().toLocaleDateString()}</p>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // Componente per utente non autenticato
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key={user ? "logged-in" : "logged-out"} // Aggiungere una key per forzare l'animazione corretta
    >
      <Card className="w-full shadow-md transition-all hover:shadow-lg border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Accedi a iStudio</CardTitle>
          </div>
          <CardDescription className="mt-1">Inserisci le tue credenziali per continuare</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} ref={formRef}>
          <CardContent className="space-y-4 pt-2">
            {/* Errore generale */}
            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Campo username/email */}
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span>Username o Email</span>
              </Label>
              <div className="relative">
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="mario.rossi o mario@esempio.it"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value)
                    if (errors.usernameOrEmail) {
                      setErrors((prev) => ({ ...prev, usernameOrEmail: undefined }))
                    }
                  }}
                  required
                  disabled={isSubmitting}
                  className={cn(
                    "pl-9 focus:ring-2 focus:ring-primary",
                    errors.usernameOrEmail && "border-destructive focus:ring-destructive",
                  )}
                  aria-invalid={!!errors.usernameOrEmail}
                  aria-describedby={errors.usernameOrEmail ? "usernameOrEmail-error" : undefined}
                  ref={usernameInputRef}
                  onKeyDown={handleKeyDown}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.usernameOrEmail && (
                <p id="usernameOrEmail-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.usernameOrEmail}
                </p>
              )}
            </div>

            {/* Campo password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                <span>Password</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }))
                    }
                  }}
                  required
                  disabled={isSubmitting}
                  className={cn(
                    "pl-9 focus:ring-2 focus:ring-primary",
                    errors.password && "border-destructive focus:ring-destructive",
                  )}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  onKeyDown={handleKeyDown}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Nascondi" : "Mostra"}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Pulsante Accedi */}
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Accesso in corso...</span>
                </>
              ) : (
                <>
                  <span>Accedi</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </motion.div>
  )
})
