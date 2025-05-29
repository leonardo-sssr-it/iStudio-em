"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { Calendar, CheckSquare, Clock, ListTodo, Briefcase, Users, FileText } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

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
    <div className="container px-4 py-6 mx-auto max-w-md">
      <h1 className="text-2xl font-bold mb-6">Dashboard Mobile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Esplora i tuoi dati</CardTitle>
          <CardDescription>Seleziona una tabella per visualizzare i dati</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tables.map((table) => (
              <Card key={table.name} className="overflow-hidden">
                <Link href={`/data-explorer?table=${table.name}`} className="block h-full">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <table.icon className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-medium text-center">{table.label}</h3>
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
