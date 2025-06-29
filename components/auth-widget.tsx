"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, LogOut, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useDebugConfig } from "@/hooks/use-debug-config"
import Link from "next/link"

export function AuthWidget() {
  const { user, login, signUp, logout, isLoading } = useAuth()
  const { isDebugEnabled } = useDebugConfig()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debug condizionale
  useEffect(() => {
    if (isDebugEnabled) {
      console.log("AuthWidget: user =", user)
      console.log("AuthWidget: isLoading =", isLoading)
    }
  }, [user, isLoading, isDebugEnabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Le password non corrispondono")
          return
        }
        if (password.length < 6) {
          setError("La password deve essere di almeno 6 caratteri")
          return
        }
        await signUp(email, password)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message || "Si è verificato un errore")
      if (isDebugEnabled) {
        console.error("AuthWidget error:", err)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err: any) {
      setError(err.message || "Errore durante il logout")
      if (isDebugEnabled) {
        console.error("AuthWidget logout error:", err)
      }
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Caricamento...</span>
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
            Benvenuto
          </CardTitle>
          <CardDescription>Sei connesso come {user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <User className="h-4 w-4 mr-2" />
              Vai al Profilo
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignUp ? "Registrazione" : "Accesso"}</CardTitle>
        <CardDescription>
          {isSignUp
            ? "Crea un nuovo account per accedere all'applicazione"
            : "Inserisci le tue credenziali per accedere"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Registrati" : "Accedi"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError("")
              setEmail("")
              setPassword("")
              setConfirmPassword("")
            }}
            disabled={isSubmitting}
          >
            {isSignUp ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
