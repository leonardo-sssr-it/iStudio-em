"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-provider"
import { useDebugConfig } from "@/hooks/use-debug-config"
import { Eye, EyeOff, LogIn, Settings, ArrowRight, User, LogOut } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function AuthWidget() {
  const { user, login, logout, isLoading } = useAuth()
  const { isDebugEnabled } = useDebugConfig()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMountedRef.current) return

    setIsSubmitting(true)
    setError("")

    if (isDebugEnabled) {
      console.log("AuthWidget: Tentativo di login per:", email)
    }

    try {
      const result = await login(email, password)

      if (!isMountedRef.current) return

      if (result.success) {
        if (isDebugEnabled) {
          console.log("AuthWidget: Login riuscito per:", email)
        }
        toast({
          title: "Login effettuato",
          description: "Accesso eseguito con successo",
        })
        setEmail("")
        setPassword("")
      } else {
        if (isDebugEnabled) {
          console.error("AuthWidget: Errore login:", result.error)
        }
        setError(result.error || "Errore durante il login")
      }
    } catch (err: any) {
      if (!isMountedRef.current) return

      if (isDebugEnabled) {
        console.error("AuthWidget: Errore imprevisto durante il login:", err)
      }
      setError("Errore imprevisto durante il login")
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const handleLogout = async () => {
    if (isDebugEnabled) {
      console.log("AuthWidget: Logout utente:", user?.email)
    }
    await logout()
    toast({
      title: "Logout effettuato",
      description: "Disconnessione eseguita con successo",
    })
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">Caricamento...</div>
        </CardContent>
      </Card>
    )
  }

  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Benvenuto, {user.nome || user.username}
          </CardTitle>
          <CardDescription>Sei autenticato come {user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.ruolo === "admin" && (
            <div className="space-y-2">
              <Button onClick={() => router.push("/admin")} className="auth-widget-button w-full" variant="default">
                <Settings />
                <span className="flex-1 text-center">Vai alla Dashboard Admin</span>
                <ArrowRight />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => router.push("/profile")}
              variant="outline"
              className="auth-widget-secondary-button w-full justify-start"
            >
              <User />
              <span>Visualizza Profilo</span>
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="auth-widget-secondary-button w-full justify-start bg-transparent"
            >
              <LogOut />
              <span>Logout</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Accedi
        </CardTitle>
        <CardDescription>Inserisci le tue credenziali per accedere</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Inserisci la tua email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci la tua password"
                required
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="auth-widget-button w-full" disabled={isSubmitting}>
            <LogIn />
            <span className="flex-1 text-center">{isSubmitting ? "Accesso in corso..." : "Accedi"}</span>
          </Button>
        </form>

        <Separator className="my-4" />

        <div className="text-center text-sm text-muted-foreground">Non hai un account? Contatta l'amministratore.</div>
      </CardContent>
    </Card>
  )
}
