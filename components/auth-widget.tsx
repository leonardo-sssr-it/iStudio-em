"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LogIn, Settings, ArrowRight, User } from "lucide-react"

export function AuthWidget() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { user, signIn, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Email e password sono obbligatori")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("🔐 Tentativo di login per:", email)
      const result = await signIn(email, password)

      if (!isMountedRef.current) return

      if (result.error) {
        console.error("❌ Errore login:", result.error)
        setError(result.error.message || "Errore durante il login")
      } else {
        console.log("✅ Login riuscito:", result.data?.user?.email)
        toast({
          title: "Login effettuato",
          description: "Benvenuto in iStudio!",
        })
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("❌ Errore imprevisto durante il login:", err)
      if (isMountedRef.current) {
        setError("Errore imprevisto durante il login")
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  if (user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Benvenuto
          </CardTitle>
          <CardDescription>Sei connesso come {user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => router.push("/dashboard")} className="auth-widget-button w-full">
            <ArrowRight />
            <span>Vai alla Dashboard</span>
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              className="auth-widget-secondary-button w-full"
            >
              <Settings />
              <span>Vai alla Dashboard Admin</span>
              <ArrowRight />
            </Button>
          )}
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
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tua@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
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
              disabled={isLoading}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Accedi
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
