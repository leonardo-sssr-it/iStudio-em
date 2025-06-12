"use client"

import { DebugDeadlines } from "@/components/debug-deadlines"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDebugConfig } from "@/hooks/use-debug-config"
import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function DebugScadenzePage() {
  const { isAdmin } = useAuth()
  const { isAdmin: isDebugAdmin } = useDebugConfig()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Breve timeout per assicurarsi che lo stato di autenticazione sia caricato
    const timer = setTimeout(() => {
      setIsLoading(false)
      setIsAuthorized(isAdmin)
    }, 500)

    return () => clearTimeout(timer)
  }, [isAdmin])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Accesso Negato</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Solo gli amministratori possono accedere a questa pagina.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Scadenze</h1>
      <DebugDeadlines />
    </div>
  )
}
