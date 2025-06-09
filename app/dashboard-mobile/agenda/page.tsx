"use client"

import { AgendaWidget } from "@/components/agenda-widget"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

function MobileAgendaPageContent() {
  return (
    <div className="container px-2 py-4 mx-auto max-w-screen-lg">
      {" "}
      {/* Max width for larger mobile/tablet */}
      <div className="flex items-center mb-4">
        <Button variant="outline" size="icon" asChild className="mr-2">
          <Link href="/dashboard-mobile">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Torna alla Dashboard Mobile</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Agenda Mobile</h1>
      </div>
      <AgendaWidget mode="mobile" />
    </div>
  )
}

export default function MobileAgendaPage() {
  return (
    <ProtectedRoute>
      <MobileAgendaPageContent />
    </ProtectedRoute>
  )
}
