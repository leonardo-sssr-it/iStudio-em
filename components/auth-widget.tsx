"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-provider"
import { useDebugConfig } from "@/hooks/use-debug-config"
import { LogIn, LogOut, User, Mail, Lock, AlertCircle, Loader2 } from "lucide-react"

export function AuthWidget() {
  const { user, login, logout, register, loading } = useAuth()
  const { isDebugEnabled } = useDebugConfig()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isDebugEnabled) {
      console.log("AuthWidget: user =", user)
      console.log("AuthWidget: loading =", loading)
    }
  }, [user, loading, isDebugEnabled])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Email e password sono obbligatori")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (isDebugEnabled) {
        console.log("AuthWidget: Tentativo di login per", email)
      }

      const result = await login(email, password)

      if (result?.error) {
        setError(result.error.message || "Errore durante il login")
        if (isDebugEnabled) {
          console.error("AuthWidget: Errore login:", result.error)
        }
      } else {
        if (isDebugEnabled) {
          console.log("AuthWidget: Login riuscito")
        }
        setEmail("")
        setPassword("")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Errore durante il login"
      setError(errorMessage)
      if (isDebugEnabled) {
        console.error("AuthWidget: Errore login catch:", err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      setError("Tutti i campi sono obbligatori")
      return
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono")
      return
    }

    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (isDebugEnabled) {
        console.log("AuthWidget: Tentativo di registrazione per", email)
      }

      const result = await register(email, password)

      if (result?.error) {
        setError(result.error.message || "Errore durante la registrazione")
        if (isDebugEnabled) {
          console.error("AuthWidget: Errore registrazione:", result.error)
        }
      } else {
        if (isDebugEnabled) {
          console.log("AuthWidget: Registrazione riuscita")
        }
        setEmail("")
        setPassword("")
        setConfirmPassword("")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Errore durante la registrazione"
      setError(errorMessage)
      if (isDebugEnabled) {
        console.error("AuthWidget: Errore registrazione catch:", err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      if (isDebugEnabled) {
        console.log("AuthWidget: Tentativo di logout")
      }

      await logout()

      if (isDebugEnabled) {
        console.log("AuthWidget: Logout riuscito")
      }
    } catch (err) {
      if (isDebugEnabled) {
        console.error("AuthWidget: Errore logout:", err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Se l'utente è autenticato, mostra il widget utente
  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full">
            <User className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Benvenuto!</CardTitle>
          <CardDescription>
            {user.email}
            {user.user_metadata?.full_name && (
              <div className="text-sm text-muted-foreground mt-1">{user.user_metadata.full_name}</div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <a
              href="/profile"
              className="auth-widget-secondary-button inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              <User />
              <span>Profilo</span>
            </a>
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="outline"
              className="auth-widget-button bg-transparent"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <LogOut />}
              <span>{isLoading ? "Disconnessione..." : "Logout"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se l'utente non è autenticato, mostra il form di login/registrazione
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Accesso</CardTitle>
        <CardDescription>Accedi al tuo account o registrati per iniziare</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="la-tua-email@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="La tua password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full auth-widget-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                <span>{isLoading ? "Accesso..." : "Accedi"}</span>
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="la-tua-email@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Almeno 6 caratteri"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Ripeti la password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full auth-widget-button" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <User />}
                <span>{isLoading ? "Registrazione..." : "Registrati"}</span>
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
