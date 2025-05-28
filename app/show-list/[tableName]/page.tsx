"use client"

import { ShowList } from "@/components/show-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Menu } from "lucide-react"
import Link from "next/link"
import { SidebarWidget } from "@/components/sidebar-widget"
import { useSidebar } from "@/contexts/sidebar-context"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"

export default function ShowListPage({ params }: { params: { tableName: string } }) {
  const tableName = decodeURIComponent(params.tableName)
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const isMobile = useIsMobile()
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        {/* Sidebar */}
        <SidebarWidget className="z-50" />

        {/* Contenuto principale */}
        <main className={cn("transition-all duration-300 ease-in-out", isSidebarOpen && !isMobile ? "ml-64" : "ml-0")}>
          {/* Pulsante per aprire la sidebar su mobile quando è chiusa */}
          {isMobile && !isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="fixed top-4 left-4 z-40 md:hidden"
              aria-label="Apri menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="container mx-auto p-4 md:p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Lista Elementi</h1>
                <Link href="/show-list">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Torna all'elenco
                  </Button>
                </Link>
              </div>
              <ShowList tableName={tableName} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
