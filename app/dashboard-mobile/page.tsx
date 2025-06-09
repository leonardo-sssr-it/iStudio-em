"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { Calendar, CheckSquare, Clock, ListTodo, Briefcase, Users, FileText, LayoutGrid } from "lucide-react" // Added LayoutGrid
import { ProtectedRoute } from "@/components/protected-route"
import { DailySummaryCard } from "@/components/daily-summary-card" // Import DailySummaryCard

// Componente per il contenuto della dashboard mobile
function DashboardMobileContent() {
  const { user, isLoading } = useAuth()

  // Gestione stato di caricamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Data tables available
  const tables = [
    { name: "appuntamenti", label: "Appuntamenti", icon: Calendar },
    { name: "attivita", label: "Attività", icon: CheckSquare },
    { name: "scadenze", label: "Scadenze", icon: Clock },
    { name: "todolist", label: "To-Do List", icon: ListTodo },
    { name: "progetti", label: "Progetti", icon: Briefcase },
    { name: "clienti", label: "Clienti", icon: Users },
    { name: "pagine", label: "Pagine", icon: FileText },
  ]

  return (
    <div className="container px-4 py-6 mx-auto max-w-lg">
      {" "}
      {/* Increased max-width slightly */}
      <h1 className="text-2xl font-bold mb-6">Dashboard Mobile</h1>
      {/* Daily Summary Card */}
      <div className="mb-6">
        <DailySummaryCard />
      </div>
      {/* Link to Mobile Agenda */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Link
            href="/dashboard-mobile/agenda"
            className="flex items-center justify-between p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <div className="flex items-center">
              <LayoutGrid className="h-6 w-6 mr-3" />
              <span className="font-semibold">Vai all'Agenda Mobile</span>
            </div>
            <span>&rarr;</span>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Esplora i tuoi dati</CardTitle>
          <CardDescription>Seleziona una tabella per visualizzare i dati</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {" "}
            {/* Kept 2 cols for consistency */}
            {tables.map((table) => (
              <Card key={table.name} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <Link href={`/data-explorer?table=${table.name}`} className="block h-full">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <table.icon className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-medium text-sm">{table.label}</h3>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principale che applica la protezione
export default function DashboardMobile() {
  return (
    <ProtectedRoute>
      <DashboardMobileContent />
    </ProtectedRoute>
  )
}
