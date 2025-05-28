"use client"

import { DebugDeadlines } from "@/components/debug-deadlines"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDebugConfig } from "@/hooks/use-debug-config"
import { useAuth } from "@/lib/auth-provider"
import { redirect } from "next/navigation"

export default function DebugScadenzePage() {
  const { isAdmin } = useDebugConfig()
  const { user, isLoading } = useAuth()

  if (!isLoading && !user) {
    redirect("/login")
  }

  if (!isAdmin) {
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
