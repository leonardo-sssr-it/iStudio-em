"use client"
import { usePathname, useRouter } from "next/navigation"
import { Database, Loader2, X } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { getTableConfig } from "@/lib/table-config"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { useSupabaseTables } from "@/hooks/use-supabase-tables"

interface TableSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function TableSidebar({ isOpen, onToggle }: TableSidebarProps) {
  const { isConnected } = useSupabase()
  const { tables, isLoading, showRpcInstructions, fetchTables } = useSupabaseTables()
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Verifica se un elemento è attivo
  const isActive = (tableName: string) => {
    return pathname === `/show-list/${encodeURIComponent(tableName)}`
  }

  // Gestisce la navigazione a una tabella
  const handleTableClick = (tableName: string) => {
    router.push(`/show-list/${encodeURIComponent(tableName)}`)
    // Chiudi la sidebar su mobile dopo la navigazione
    if (isMobile) {
      onToggle()
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out",
        // Correzione: Rendere più esplicita la condizione per evitare stati ambigui
        isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        !isMobile && "relative",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Tabelle</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="md:hidden">
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
              {showRpcInstructions && (
                <div className="mt-4 text-xs">
                  <p className="mb-2">
                    Per ottenere l'elenco delle tabelle, crea questa funzione RPC nel tuo database Supabase:
                  </p>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-[10px]">
                    <code>{`CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
