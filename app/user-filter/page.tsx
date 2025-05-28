"use client"

import { UserDataFilter } from "@/components/user-data-filter"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"

export default function UserFilterPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Filtro Dati Utente</h1>
          <Link href={user?.ruolo === "admin" ? "/admin" : "/dashboard"}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Torna alla Dashboard
            </Button>
          </Link>
        </div>
        <UserDataFilter />
      </div>
    </ProtectedRoute>
  )
}
