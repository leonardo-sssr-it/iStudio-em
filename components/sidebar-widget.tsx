"use client"

import { useCallback, memo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Database, Loader2, X } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { getTableConfig } from "@/lib/table-config"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { useSupabaseTables } from "@/hooks/use-supabase-tables"
import { useSidebar } from "@/contexts/sidebar-context"

interface SidebarWidgetProps {
  className?: string
}

export const SidebarWidget = memo(function SidebarWidget({ className }: SidebarWidgetProps) {
  const { isConnected } = useSupabase()
  const { tables, isLoading, fetchTables } = useSupabaseTables()
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar()

  // Verifica se un elemento è attivo
  const isActive = useCallback(
    (tableName: string) => {
      return pathname === `/show-list/${encodeURIComponent(tableName)}`
    },
    [pathname],
  )

  // Gestisce la navigazione a una tabella
  const handleTableClick = useCallback(
    (tableName: string) => {
      router.push(`/show-list/${encodeURIComponent(tableName)}`)
      // Chiudi la sidebar su mobile dopo la navigazione
      if (isMobile) {
        closeSidebar()
      }
    },
    [router, isMobile, closeSidebar],
  )

  return (
    <div className={cn("h-full", className)}>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out",
          isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tabelle</h2>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <X className="h-5 w-5" />
              <span className="sr-only">Chiudi sidebar</span>
            </Button>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tables.length > 0 ? (
              <div className="space-y-1">
                {tables.map((tableName) => {
                  const config = getTableConfig(tableName)
                  return (
                    <Button
                      key={tableName}
                      variant={isActive(tableName) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => handleTableClick(tableName)}
                    >
                      <Database className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{config.displayName}</span>
                    </Button>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                <p>Nessuna tabella trovata</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fetchTables}>
                  Riprova
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Overlay per chiudere la sidebar su mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className={cn("fixed inset-0 bg-black/50 z-40")}
          onClick={toggleSidebar}
          aria-hidden="true"
          role="presentation"
        />
      )}
    </div>
  )
})
