"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, LogIn, UserPlus, User, Home, LogOut, AlertCircle } from "lucide-react"
import Link from "next/link"

export function AuthWidget() {
  // ✅ USO LE FUNZIONI CORRETTE: login, signUp, logout (non signIn, signOut)
  const { user, login, signUp, logout } = useAuth()
  const { supabase } = useSupabase()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [nome, setNome] = useState("")
  const [cognome, setCognome] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)

  // Carica il profilo utente quando l'utente è loggato
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && supabase) {
        try {
          const { data, error } = await supabase.from("utenti").select("*").eq("id", user.id).single()

          if (error) {
            console.error("Errore nel caricamento del profilo:", error)
          } else {
            setUserProfile(data)
          }
        } catch (err) {
          console.error("Errore nel caricamento del profilo:", err)
        }
      }
    }

    loadUserProfile()
  }, [user, supabase])

  // Funzione per determinare il link alla dashboard basato sul ruolo
  const getDashboardLink = () => {
    if (!userProfile) return "/dashboard"

    switch (userProfile.ruolo) {
      case "admin":
        return "/admin"
      case "user":
        return "/dashboard-utente"
      default:
        return "/dashboard"
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Email e password sono obbligatori")
      return
    }

    setLoading(true)
    setError("")

    try {
      // ✅ USO login (non signIn)
      await login(email, password)
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto!",
      })
      setEmail("")
      setPassword("")
    } catch (error: any) {
      setError(error.message || "Errore durante l'accesso")
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
    if (!email || !password || !username) {
      setError("Email, username e password sono obbligatori")
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

    setLoading(true)
    setError("")

    try {
      // ✅ USO signUp (questa dovrebbe essere corretta)
      await signUp(email, password, {
        username,
        nome,
        cognome,
      })
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare l'account",
      })
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setUsername("")
      setNome("")
      setCognome("")
    } catch (error: any) {
      setError(error.message || "Errore durante la registrazione")
      toast({
        title: "Errore di registrazione",
        description: error.message || "Impossibile creare l'account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // ✅ USO logout (non signOut)
      await logout()
      setUserProfile(null)
      toast({
        title: "Disconnesso",
        description: "Arrivederci!",
      })
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore durante la disconnessione",
        variant: "destructive",
      })
    }
  }

  // Se l'utente è loggato, mostra il profilo
  if (user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Benvenuto!
          </CardTitle>
          <CardDescription>
            {userProfile ? (
              <div>
                <div className="font-medium">{userProfile.username}</div>
                {userProfile.nome && userProfile.cognome && (
                  <div className="text-sm text-muted-foreground">
                    {userProfile.nome} {userProfile.cognome}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{user.email}</div>
                {userProfile.ruolo && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                    {userProfile.ruolo === "admin"
                      ? "Amministratore"
                      : userProfile.ruolo === "user"
                        ? "Utente"
                        : "Ospite"}
                  </div>
                )}
              </div>
            ) : (
              <div>{user.email}</div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href={getDashboardLink()}>
            <Button className="w-full" variant="default">
              <Home className="h-4 w-4 mr-2" />
              Vai alla Dashboard
            </Button>
          </Link>

          <Link href="/profile">
            <Button className="w-full bg-transparent" variant="outline">
              <User className="h-4 w-4 mr-2" />
              Profilo
            </Button>
          </Link>

          <Button onClick={handleLogout} variant="destructive" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Se l'utente non è loggato, mostra il form di login/registrazione
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Accesso</CardTitle>
        <CardDescription>Accedi al tuo account o registrati per iniziare</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="la-tua-email@esempio.com"
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accesso in corso...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Accedi
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome</Label>
                  <Input
                    id="signup-nome"
                    type="text"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cognome">Cognome</Label>
                  <Input
                    id="signup-cognome"
                    type="text"
                    placeholder="Cognome"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-username">Username *</Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="Username univoco"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="la-tua-email@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password *</Label>
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
                <Label htmlFor="signup-confirm-password">Conferma Password *</Label>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrazione in corso...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrati
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
