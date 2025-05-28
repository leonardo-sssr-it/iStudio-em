"use client"

import type React from "react"

import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogOut, LayoutDashboard, Settings, User, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { useCustomTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

// Componente ottimizzato con memo per evitare re-render inutili
export const AuthWidget = memo(function AuthWidget() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, user, isAdmin, logout } = useAuth()
  const { isDarkMode } = useCustomTheme()
  const router = useRouter()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!usernameOrEmail || !password) {
        toast({
          title: "Errore",
          description: "Username/email e password sono richiesti",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      try {
        const success = await login(usernameOrEmail, password)
        if (success) {
          toast({
            title: "Accesso effettuato",
            description: "Benvenuto!",
          })
        }
      } catch (error) {
        console.error("Errore durante il login:", error)
        toast({
          title: "Errore di accesso",
          description: "Credenziali non valide. Riprova.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [usernameOrEmail, password, login],
  )

  const handleLogout = useCallback(() => {
    logout()
    toast({
      title: "Logout effettuato",
      description: "Arrivederci!",
    })
  }, [logout])

  if (user) {
    return (
      <Card className="w-full shadow-md transition-all hover:shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bentornato!</CardTitle>
          <CardDescription className="text-lg">{user.nome || user.username}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Ruolo: {isAdmin ? "Amministratore" : "Utente"}</span>
            </div>
          </div>

          {/* Pulsante Dashboard prominente con classe semplificata */}
          <div className="space-y-3">
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="block">
              <button className={cn("w-full h-12 btn-contrast-primary rounded-md flex items-center justify-center")}>
                <LayoutDashboard className="mr-2 h-5 w-5" />
                {isAdmin ? "Vai alla Dashboard Admin" : "Vai alla Dashboard"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>

            {/* Altri pulsanti secondari */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/profile" className="block">
                <button className="w-full h-10 btn-contrast-secondary rounded-md flex items-center justify-center">
                  <Settings className="mr-1 h-4 w-4" />
                  Profilo
                </button>
              </Link>

              <button
                className="w-full h-10 btn-contrast-destructive rounded-md flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-1 h-4 w-4" />
                Esci
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-md transition-all hover:shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Accedi a iStudio</CardTitle>
        <CardDescription>Inserisci le tue credenziali per continuare</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usernameOrEmail">Username o Email</Label>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="mario.rossi o mario@esempio.it"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Pulsante Accedi con classe semplificata */}
          <button
            type="submit"
            className={cn("w-full h-12 btn-contrast-primary rounded-md flex items-center justify-center")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              <>
                Accedi
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-primary transition-colors">
              Problemi di accesso?
            </Link>
          </div>
        </CardContent>
      </form>
    </Card>
  )
})
