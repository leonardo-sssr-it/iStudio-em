"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { LogIn, LogOut, Eye, EyeOff } from "lucide-react"

export function AuthWidget() {
  const { user, login, logout } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Errore",
        description: "Inserisci email e password",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const success = await login(email, password)
      if (success) {
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto!",
        })
      }
    } catch (error: any) {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non coincidono",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Per ora uso login dato che non abbiamo signUp nel auth-provider
      toast({
        title: "Registrazione non disponibile",
        description: "Contatta l'amministratore per creare un account",
        variant: "destructive",
      })
    } catch (error: any) {
      toast({
        title: "Errore di registrazione",
        description: error.message || "Impossibile creare l'account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await logout()
      toast({
        title: "Disconnesso",
        description: "Arrivederci!",
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile disconnettersi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Profilo Utente
          </CardTitle>
          <CardDescription>Sei connesso come {user.username || user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">{user.username}</div>
            </div>
            {user.email && (
              <div>
                <Label>Email</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">{user.email}</div>
              </div>
            )}
            <div>
              <Label>Ruolo</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">{user.ruolo}</div>
            </div>
            <Button onClick={handleSignOut} disabled={loading} className="w-full bg-transparent" variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? "Disconnessione..." : "Disconnetti"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Autenticazione
        </CardTitle>
        <CardDescription>Accedi per continuare</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Username o Email</Label>
            <Input
              id="signin-email"
              type="text"
              placeholder="username o email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <div className="relative">
              <Input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="La tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? "Accesso..." : "Accedi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
