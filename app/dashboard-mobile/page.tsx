"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { DailySummaryCard } from "@/components/daily-summary-card"
import { AgendaWidget } from "@/components/agenda-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DashboardMobile() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("summary")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="flex min-h-full w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-full w-full">
      <div className="container p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Dashboard Mobile</h1>
          <p className="text-sm text-muted-foreground">Benvenuto, {user.nome || user.username}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Riepilogo</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Riepilogo Giornaliero</CardTitle>
                <CardDescription>Le tue attività di oggi</CardDescription>
              </CardHeader>
              <CardContent>
                <DailySummaryCard />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="agenda" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Agenda</CardTitle>
                <CardDescription>I tuoi prossimi eventi</CardDescription>
              </CardHeader>
              <CardContent>
                <AgendaWidget />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
