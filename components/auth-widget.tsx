"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { User, LogOut, LayoutDashboard } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  username?: string
  email?: string
  nome?: string
  cognome?: string
  ruolo?: string
  ultimo_accesso?: string
}

export default function AuthWidget() {
  const { user, login, signUp, logout } = useAuth()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    username: "",
    nome: "",
    cognome: "",
  })

  // Carica il profilo utente da Supabase
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id || !supabase) return

      try {
        const { data, error } = await supabase
          .from("utenti")
          .select("id, username, email, nome, cognome, ruolo, ultimo_accesso")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Errore nel caricamento del profilo:", error)
          return
        }

        setUserProfile(data)
      } catch (error) {
        console.error("Errore nel caricamento del profilo:", error)
      }
    }

    if (user) {
      loadUserProfile()
    }
  }, [user, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(loginData.email, loginData.password)
      toast({
        title: "Login effettuato con successo!",
        description: "Benvenuto nell'applicazione",
      })
    } catch (error: any) {
      toast({
        title: "Errore di login",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signUp(signUpData.email, signUpData.password, {
        username: signUpData.username,
        nome: signUpData.nome,
        cognome: signUpData.cognome,
      })
      toast({
        title: "Registrazione completata!",
        description: "Controlla la tua email per confermare l'account",
      })
    } catch (error: any) {
      toast({
        title: "Errore di registrazione",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUserProfile(null)
      toast({
        title: "Logout effettuato",
        description: "Arrivederci!",
      })
    } catch (error: any) {
      toast({
        title: "Errore di logout",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      })
    }
  }

  const getDashboardUrl = () => {
    if (!userProfile?.ruolo) return "/dashboard"

    switch (userProfile.ruolo) {
      case "admin":
        return "/admin"
      case "user":
        return "/dashboard-utente"
      default:
        return "/dashboard"
    }
  }

  const getUserDisplayName = () => {
    if (userProfile?.nome && userProfile?.cognome) {
      return `${userProfile.nome} ${userProfile.cognome}`
    }
    if (userProfile?.username) {
      return userProfile.username
    }
    if (userProfile?.email) {
      return userProfile.email
    }
    return "Utente"
  }

  const getUserInitials = () => {
    if (userProfile?.nome && userProfile?.cognome) {
      return `${userProfile.nome.charAt(0)}${userProfile.cognome.charAt(0)}`.toUpperCase()
    }
    if (userProfile?.username) {
      return userProfile.username.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  // Se l'utente è loggato, mostra il profilo
  if (user) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getUserDisplayName()}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
            </div>
          </div>
          {userProfile?.ruolo && (
            <Badge variant="secondary" className="w-fit">
              {userProfile.ruolo === "admin" ? "Amministratore" : "Utente"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={getDashboardUrl()}>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <User className="w-4 h-4 mr-2" />
              Profilo
            </Button>
          </Link>
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start bg-transparent">
            <LogOut className="w-4 h-4 mr-2" />
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
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome</Label>
                  <Input
                    id="signup-nome"
                    value={signUpData.nome}
                    onChange={(e) => setSignUpData({ ...signUpData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cognome">Cognome</Label>
                  <Input
                    id="signup-cognome"
                    value={signUpData.cognome}
                    onChange={(e) => setSignUpData({ ...signUpData, cognome: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  value={signUpData.username}
                  onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registrazione in corso..." : "Registrati"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
