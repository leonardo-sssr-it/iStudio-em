"use client"
import { useState } from "react"
import React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { UserSummary } from "./_components/user-summary"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgendaWidget } from "@/components/agenda-widget"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { KanbanWidget } from "@/components/kanban-widget"
import { GalleryManagerWidget } from "@/components/gallery-manager-widget"
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'

// Definizione dei widget disponibili
const AVAILABLE_WIDGETS = [
  { id: "agenda", name: "Agenda", component: AgendaWidget },
  { id: "gantt", name: "Diagramma Gantt", component: GanttChartWidget },
  { id: "kanban", name: "Kanban Board", component: KanbanWidget },
  { id: "gallery", name: "Gestione Galleria", component: GalleryManagerWidget },
]

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("kanban")
  const [key, setKey] = useState(0) // Chiave per forzare il re-render del widget

  // Trova il widget selezionato
  const selectedWidget = AVAILABLE_WIDGETS.find((widget) => widget.id === selectedWidgetId)

  // Funzione per ricaricare il widget corrente
  const reloadWidget = () => {
    setKey((prev) => prev + 1)
  }

  return (
    <ProtectedRoute>
      <ScrollArea className="h-[calc(100vh-var(--header-height,4rem))]">
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
              Ciao, {user?.nome || user?.username || "Utente"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Ecco una panoramica delle tue attività e impegni.</p>
          </div>

          {/* Riepilogo statistico (mantenuto come richiesto) */}
          <UserSummary />

          <Separator className="my-2" />

          {/* Selettore di widget */}
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

          {/* Visualizzazione del widget selezionato */}
          <div className="widget-container">
            {selectedWidget ? (
              <div key={`${selectedWidget.id}-${key}`}>
                <h2 className="text-xl font-semibold mb-4">{selectedWidget.name}</h2>
                {React.createElement(selectedWidget.component)}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Nessun widget selezionato</CardTitle>
                  <CardDescription>Seleziona un widget dal menu a tendina</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Usa il selettore qui sopra per visualizzare e testare i widget disponibili.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>
    </ProtectedRoute>
  )
}
