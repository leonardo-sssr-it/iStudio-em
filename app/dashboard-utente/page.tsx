"use client"
import { useState } from "react"
import React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { UserSummary } from "./_components/user-summary"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgendaWidget } from "@/components/agenda-widget"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { KanbanWidget } from "@/components/kanban-widget"
import { GalleryManagerWidget } from "@/components/gallery-manager-widget"
import { FeedReaderWidget } from "@/components/feed-reader-widget"
import { TodoKanbanWidget } from "@/components/todo-kanban-widget"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const AVAILABLE_WIDGETS = [
  { id: "agenda", name: "Agenda", component: AgendaWidget },
  { id: "gantt", name: "Diagramma Gantt", component: GanttChartWidget },
  { id: "kanban", name: "Kanban Board Generico", component: KanbanWidget },
  { id: "todo_kanban", name: "Kanban Todolist", component: TodoKanbanWidget },
  { id: "gallery", name: "Gestione Galleria", component: GalleryManagerWidget },
  {
    id: "feed1",
    name: "Feed Notizie 1",
    component: () => <FeedReaderWidget configKey="feed1" title="Feed Notizie Principale" />,
  },
  {
    id: "feed2",
    name: "Feed Notizie 2",
    component: () => <FeedReaderWidget configKey="feed2" title="Feed Secondario" numberOfItems={3} />,
  },
]

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("todo_kanban")
  const [key, setKey] = useState(0)

  const selectedWidget = AVAILABLE_WIDGETS.find((widget) => widget.id === selectedWidgetId)

  const reloadWidget = () => {
    setKey((prev) => prev + 1)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-full w-full">
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ciao, {user?.nome || user?.username || "Utente"}!</h1>
            <p className="text-muted-foreground">Ecco una panoramica delle tue attività e impegni.</p>
          </div>

          <UserSummary />
          <Separator className="my-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">Widget Disponibili</h2>
              <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleziona widget" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_WIDGETS.map((widget) => (
                    <SelectItem key={widget.id} value={widget.id}>
                      {widget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={reloadWidget} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Ricarica Widget
            </Button>
          </div>

          <div className="widget-container mt-4">
            {selectedWidget ? (
              <div key={`${selectedWidget.id}-${key}`} className="w-full">
                {React.createElement(selectedWidget.component)}
              </div>
            ) : (
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Nessun widget selezionato</CardTitle>
                  <CardDescription>Seleziona un widget dal menu a tendina</CardDescription>
                </CardHeader>
                <CardContent className="dashboard-content">
                  <p>Usa il selettore qui sopra per visualizzare e testare i widget disponibili.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
