"use client"

import { useAuth } from "@/lib/auth-provider"
import { AuthWidget } from "@/components/auth-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Database, Users, Calendar } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user, isAdmin } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Benvenuto in iStudio</h1>
            <p className="text-xl text-gray-600 mb-8">La tua piattaforma di gestione dati integrata</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Gestione Dati</h3>
                    <p className="text-sm text-gray-600">Esplora e gestisci i tuoi dati</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">Calendario</h3>
                    <p className="text-sm text-gray-600">Organizza i tuoi appuntamenti</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold">Clienti</h3>
                    <p className="text-sm text-gray-600">Gestisci i tuoi clienti</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <LayoutDashboard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <h3 className="font-semibold">Dashboard</h3>
                    <p className="text-sm text-gray-600">Panoramica completa</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <AuthWidget />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ciao, {user.nome || user.username}!</h1>
          <p className="text-xl text-gray-600">Benvenuto nella tua dashboard iStudio</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-blue-600" />
                Dashboard Utente
              </CardTitle>
              <CardDescription>Panoramica delle tue attività e impegni</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard-utente">
                <Button className="w-full">Vai alla Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Esplora Dati
              </CardTitle>
              <CardDescription>Visualizza e gestisci i tuoi dati</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/data-explorer">
                <Button variant="outline" className="w-full">
                  Esplora
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Profilo
              </CardTitle>
              <CardDescription>Gestisci il tuo profilo utente</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile">
                <Button variant="outline" className="w-full">
                  Vai al Profilo
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-orange-600" />
                  Pannello Admin
                </CardTitle>
                <CardDescription>Gestione amministrativa del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                    Accedi come Admin
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
