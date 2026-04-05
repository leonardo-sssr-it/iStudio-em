"use client"

import { ShowList } from "@/components/show-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"

export default function ShowListPage({ params }: { params: { tableName: string } }) {
  const tableName = decodeURIComponent(params.tableName)

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lista Elementi - {tableName}</h1>
          <Link href="/show-list">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Torna all'elenco
            </Button>
          </Link>
        </div>
        <ShowList tableName={tableName} />
      </div>
    </ProtectedRoute>
  )
}
