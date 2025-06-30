"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { LogIn, LogOut, UserPlus, Eye, EyeOff } from "lucide-react"

export function AuthWidget() {
  const { user, signIn, signUp, signOut } = useAuth()
  const { supabase } = useSupabase()
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
      await signIn(email, password)
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto!",
      })
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
      await signUp(email, password)
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare l'account",
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
      await signOut()
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
          <CardDescription>Sei connesso come {user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm">{user.email}</div>
            </div>
            <div>
              <Label>ID Utente</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm font-mono">{user.id}</div>
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
        <CardDescription>Accedi o registrati per continuare</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="tua@email.com"
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
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="tua@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Almeno 6 caratteri"
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
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Conferma Password</Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ripeti la password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Registrazione..." : "Registrati"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
