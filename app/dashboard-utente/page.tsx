"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { DailySummaryCard } from "@/components/daily-summary-card"
import { AgendaWidget } from "@/components/agenda-widget"
import { KanbanWidget } from "@/components/kanban-widget"
import { FeedReaderWidget } from "@/components/feed-reader-widget"
import { GalleryManagerWidget } from "@/components/gallery-manager-widget"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { TodoKanbanWidget } from "@/components/todo-kanban-widget"
import { SidebarWidget } from "@/components/sidebar-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { useUserDashboardSummary } from "@/hooks/use-user-dashboard-summary"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Definizione dei widget disponibili
export const AVAILABLE_WIDGETS = [
  {
    id: "daily-summary",
    name: "Riepilogo Giornaliero",
    description: "Mostra un riepilogo delle attività giornaliere",
    component: DailySummaryCard,
  },
  {
    id: "agenda",
    name: "Agenda",
    description: "Visualizza gli eventi in agenda",
    component: AgendaWidget,
  },
  {
    id: "kanban",
    name: "Kanban",
    description: "Gestisci le attività con un board Kanban",
    component: KanbanWidget,
  },
  {
    id: "feed-reader",
    name: "Feed Reader",
    description: "Leggi i feed RSS",
    component: FeedReaderWidget,
  },
  {
    id: "gallery-manager",
    name: "Galleria",
    description: "Gestisci la tua galleria di immagini",
    component: GalleryManagerWidget,
  },
  {
    id: "gantt-chart",
    name: "Gantt Chart",
    description: "Visualizza i progetti con un diagramma di Gantt",
    component: GanttChartWidget,
  },
  {
    id: "todo-kanban",
    name: "Todo Kanban",
    description: "Gestisci le tue attività todo con un board Kanban",
    component: TodoKanbanWidget,
  },
]

export default function DashboardUtente() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("overview")
  const { summary, isLoading: summaryLoading } = useUserDashboardSummary(user?.id)

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

  const isLoading = authLoading || summaryLoading

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
              <TabsTrigger value="widgets">Widget</TabsTrigger>
              <TabsTrigger value="settings">Impostazioni</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Riepilogo Giornaliero */}
              <Card className="col-span-full lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Riepilogo Giornaliero</CardTitle>
                  <CardDescription>Panoramica delle tue attività di oggi</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailySummaryCard />
                </CardContent>
              </Card>

              {/* Sidebar Widget */}
              <Card className="lg:row-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Navigazione Rapida</CardTitle>
                  <CardDescription>Accedi rapidamente alle funzionalità</CardDescription>
                </CardHeader>
                <CardContent>
                  <SidebarWidget />
                </CardContent>
              </Card>

              {/* Agenda Widget */}
              <Card className="col-span-full lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Agenda</CardTitle>
                  <CardDescription>I tuoi prossimi appuntamenti ed eventi</CardDescription>
                </CardHeader>
                <CardContent>
                  <AgendaWidget />
                </CardContent>
              </Card>

              {/* Todo Kanban Widget */}
              <Card className="col-span-full">
                <CardHeader className="pb-2">
                  <CardTitle>Todo Kanban</CardTitle>
                  <CardDescription>Gestisci le tue attività todo</CardDescription>
                </CardHeader>
                <CardContent>
                  <TodoKanbanWidget />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {AVAILABLE_WIDGETS.map((widget) => (
                <Card key={widget.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{widget.name}</CardTitle>
                    <CardDescription>{widget.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="h-40 rounded-md bg-muted"></div>
                  </CardContent>
                  <div className="p-4 pt-0">
                    <Button className="w-full">Aggiungi Widget</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Dashboard</CardTitle>
                <CardDescription>Personalizza la tua esperienza</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Layout</h3>
                    <Separator className="my-2" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Button variant="outline">Layout a Griglia</Button>
                      <Button variant="outline">Layout a Lista</Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Widget Visibili</h3>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      {AVAILABLE_WIDGETS.map((widget) => (
                        <div key={widget.id} className="flex items-center justify-between">
                          <span>{widget.name}</span>
                          <Button variant="ghost" size="sm">
                            Rimuovi
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
