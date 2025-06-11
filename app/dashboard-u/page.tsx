"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AgendaWidget } from "@/components/agenda-widget"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { LayoutDashboard } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Componente per il contenuto della dashboard utente
function DashboardUContent() {
  const { user, isLoading } = useAuth()

  // Gestione stato di caricamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 min-h-full content-inherit">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <LayoutDashboard className="h-6 w-6 mr-2" />
            Dashboard Utente
          </CardTitle>
          <CardDescription>
            Benvenuto, {user?.nome || user?.username || "Utente"}. Gestisci le tue attività, progetti e scadenze.
          </CardDescription>
        </CardHeader>
        <CardContent className="dashboard-content">
          <div className="space-y-6">
            <AgendaWidget />
            <GanttChartWidget />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principale che applica la protezione
export default function DashboardU() {
  return (
    <ProtectedRoute>
      <DashboardUContent />
    </ProtectedRoute>
  )
}
