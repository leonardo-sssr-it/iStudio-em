"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-provider"
import { Loader2, LogIn, UserPlus, Settings, ChevronRight, User } from "lucide-react"

export function AuthWidget() {
  const { user, signIn, signUp, signOut, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("Errore durante il login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Le password non coincidono")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("Errore durante la registrazione")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (err) {
      setError("Errore durante il logout")
    }
  }

  if (loading) {
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
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Benvenuto!</CardTitle>
          <CardDescription>
            Sei connesso come <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin && (
            <Button onClick={() => router.push("/admin")} className="w-full h-10 text-sm" variant="default">
              <div className="flex items-center justify-center gap-2 whitespace-nowrap w-full">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-center">Vai alla Dashboard Admin</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </div>
            </Button>
          )}

          <div className="space-y-2">
            <Button onClick={() => router.push("/dashboard")} className="w-full h-9 text-sm" variant="outline">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Settings className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Dashboard</span>
              </div>
            </Button>

            <Button onClick={() => router.push("/profile")} className="w-full h-9 text-sm" variant="outline">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Profilo</span>
              </div>
            </Button>
          </div>

          <Button onClick={handleSignOut} variant="destructive" className="w-full h-9 text-sm">
            Logout
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">iStudio</CardTitle>
        <CardDescription>Accedi al tuo account o registrati</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Accedi</TabsTrigger>
            <TabsTrigger value="signup">Registrati</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="La tua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Scegli una password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Conferma la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Registrazione in corso...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
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
