"use client"

import { useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Database, Loader2, Menu } from "lucide-react"
import Link from "next/link"
import { getTableConfig } from "@/lib/table-config"
import { useIsMobile } from "@/hooks/use-media-query"
import { SqlInstructions } from "@/components/sql-instructions"
import { useSupabaseTables } from "@/hooks/use-supabase-tables"
import { SidebarWidget } from "@/components/sidebar-widget"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"

// Componente memoizzato per la card della tabella
const TableCard = memo(({ tableName, onClick }: { tableName: string; onClick: () => void }) => {
  const config = getTableConfig(tableName)

  return (
    <Card className="h-full hover:border-primary transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex items-center space-x-3">
        <Database className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="min-w-0">
          <h3 className="font-medium truncate">{config.displayName}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {config.fields.slice(0, 3).join(", ")}
            {config.fields.length > 3 ? "..." : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

TableCard.displayName = "TableCard"

export default function ShowListIndexPage() {
  const { tables, isLoading, showRpcInstructions, fetchTables } = useSupabaseTables()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const { user } = useAuth()

  // Funzione per gestire la navigazione a una tabella specifica
  const handleTableSelect = useCallback(
    (tableName: string) => {
      router.push(`/show-list/${encodeURIComponent(tableName)}`)
    },
    [router],
  )

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
                <h1 className="text-xl md:text-2xl font-bold">Visualizza Liste</h1>
                <Link href={user?.ruolo === "admin" ? "/admin" : "/dashboard"}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden md:inline">Torna alla Dashboard</span>
                  </Button>
                </Link>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Seleziona una tabella</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-6 text-muted-foreground">
                    {isMobile
                      ? "Seleziona una tabella dall'elenco per visualizzare i suoi dati."
                      : "Seleziona una tabella dalla sidebar o dall'elenco qui sotto per visualizzare i suoi dati con campi predefiniti."}
                  </p>

                  {isLoading ? (
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : tables.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tables.map((tableName) => (
                        <TableCard key={tableName} tableName={tableName} onClick={() => handleTableSelect(tableName)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nessuna tabella trovata</p>
                      <div className="flex justify-center mt-4">
                        <Button onClick={fetchTables}>Ricarica tabelle</Button>
                      </div>
                      {showRpcInstructions && (
                        <div className="mt-6">
                          <SqlInstructions />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
