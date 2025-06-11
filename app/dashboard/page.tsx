"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { DailySummaryCard } from "@/components/daily-summary-card"
import { AgendaWidget } from "@/components/agenda-widget"
import { KanbanWidget } from "@/components/kanban-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

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
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto, {user.nome || user.username}. Ecco il riepilogo delle tue attività.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Panoramica</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-full lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Riepilogo Giornaliero</CardTitle>
                  <CardDescription>Panoramica delle tue attività di oggi</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailySummaryCard />
                </CardContent>
              </Card>

              <Card className="lg:row-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Statistiche</CardTitle>
                  <CardDescription>Metriche e statistiche</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Attività completate</span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[65%] rounded-full bg-primary"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progetti attivi</span>
                        <span className="text-sm font-medium">4</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[40%] rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Scadenze imminenti</span>
                        <span className="text-sm font-medium">3</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[30%] rounded-full bg-yellow-500"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-full lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Agenda</CardTitle>
                  <CardDescription>I tuoi prossimi appuntamenti ed eventi</CardDescription>
                </CardHeader>
                <CardContent>
                  <AgendaWidget />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Agenda Completa</CardTitle>
                <CardDescription>Tutti i tuoi appuntamenti ed eventi</CardDescription>
              </CardHeader>
              <CardContent>
                <AgendaWidget />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kanban Board</CardTitle>
                <CardDescription>Gestisci le tue attività</CardDescription>
              </CardHeader>
              <CardContent>
                <KanbanWidget />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
