"use client"

import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Database, List, Filter, LogOut } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard Amministratore</h1>
          <div className="flex space-x-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dashboard utente
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => logout()} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Benvenuto, {user?.nome || user?.username}!</CardTitle>
            <CardDescription>
              Accesso effettuato come amministratore. Hai accesso completo a tutte le funzionalità del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/table-explorer">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Database className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">Esploratore Tabelle</h3>
                    <p className="text-sm text-muted-foreground">
                      Esplora tabelle, colonne e dati. Crea backup del database.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/user-filter">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Filter className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">Filtro Dati Utente</h3>
                    <p className="text-sm text-muted-foreground">
                      Filtra i dati delle tabelle in base all'utente selezionato.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/show-list">
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <List className="h-12 w-12 mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">Visualizza Liste</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualizza liste di dati con campi predefiniti per ogni tabella.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
