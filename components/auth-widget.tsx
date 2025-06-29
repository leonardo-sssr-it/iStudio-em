"use client"

import { useState, useEffect, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, UserIcon, Settings } from "lucide-react"
import Link from "next/link"
import { useDebugConfig } from "@/hooks/use-debug-config"
import { toast } from "@/components/ui/use-toast"
import type { User } from "@supabase/supabase-js"

export function AuthWidget() {
  const { user, session, loading, signOut } = useAuth()
  const { isDebug, log } = useDebugConfig()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isDebug) {
      log("AuthWidget: Initializing", { user, session, loading })
    }
  }, [user, session, loading, isDebug, log])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    if (isDebug) log("AuthWidget: Attempting login", { email })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (isDebug) log("AuthWidget: Login error", error)
      setError(error.message)
      toast({
        title: "Errore di accesso",
        description: error.message,
        variant: "destructive",
      })
    } else {
      if (isDebug) log("AuthWidget: Login successful")
      toast({
        title: "Accesso effettuato",
        description: "Bentornato!",
      })
      // The auth state will be updated by the onAuthStateChange listener in AuthProvider
    }
    setIsSubmitting(false)
  }

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    if (isDebug) log("AuthWidget: Attempting sign up", { email })

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      if (isDebug) log("AuthWidget: Sign up error", error)
      setError(error.message)
      toast({
        title: "Errore di registrazione",
        description: error.message,
        variant: "destructive",
      })
    } else {
      if (isDebug) log("AuthWidget: Sign up successful, confirmation email sent")
      toast({
        title: "Registrazione quasi completata",
        description: "Controlla la tua email per confermare la registrazione.",
      })
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Caricamento...</div>
  }

  if (user) {
    return <AuthenticatedWidget user={user} onSignOut={signOut} />
  }

  return (
    <div className="p-2">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Accedi</TabsTrigger>
          <TabsTrigger value="register">Registrati</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <Card>
              <CardHeader>
                <CardTitle>Accedi</CardTitle>
                <CardDescription>Accedi al tuo account per continuare.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch">
                {error && <p className="text-destructive text-sm mb-4">{error}</p>}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Accesso in corso..." : "Accedi"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        <TabsContent value="register">
          <form onSubmit={handleSignUp}>
            <Card>
              <CardHeader>
                <CardTitle>Registrati</CardTitle>
                <CardDescription>Crea un nuovo account per iniziare.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch">
                {error && <p className="text-destructive text-sm mb-4">{error}</p>}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registrazione..." : "Registrati"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AuthenticatedWidget({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const getInitials = (email: string) => {
    const name = email.split("@")[0]
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email} />
          <AvatarFallback>{getInitials(user.email || "U")}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <div className="space-y-1">
        <Link href="/profile" passHref>
          <a className="flex items-center gap-2 w-full text-left text-sm p-2 rounded-md hover:bg-accent">
            <UserIcon className="h-4 w-4" />
            <span>Profilo</span>
          </a>
        </Link>
        <Link href="/admin" passHref>
          <a className="flex items-center gap-2 w-full text-left text-sm p-2 rounded-md hover:bg-accent">
            <Settings className="h-4 w-4" />
            <span>Impostazioni</span>
          </a>
        </Link>
      </div>
      <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full justify-start">
        <LogOut className="mr-2 h-4 w-4" />
        Esci
      </Button>
    </div>
  )
}
