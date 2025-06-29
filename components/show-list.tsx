"use client"

import { useCallback, memo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Loader2, Plus, RefreshCw } from "lucide-react"
import { getTableConfig } from "@/lib/table-config"
import { useIsMobile } from "@/hooks/use-media-query"
import { SqlInstructions } from "@/components/sql-instructions"
import { useSupabaseTables } from "@/hooks/use-supabase-tables"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

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

// Componente per visualizzare i dati di una tabella specifica
const TableDataView = memo(({ tableName }: { tableName: string }) => {
  const { supabase } = useSupabase()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const config = getTableConfig(tableName)
  const { user } = useAuth()

  const loadData = useCallback(async () => {
    if (!supabase) return

    setLoading(true)
    setError(null)

    try {
      const { data: tableData, error: tableError } = await supabase.from(tableName).select("*").limit(50)

      if (tableError) {
        throw tableError
      }

      setData(tableData || [])
    } catch (err) {
      console.error(`Errore nel caricamento dati per ${tableName}:`, err)
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
      toast({
        title: "Errore",
        description: `Impossibile caricare i dati: ${err instanceof Error ? err.message : "Errore sconosciuto"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Caricamento dati...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Errore: {error}</p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{config.displayName}</CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            {user?.ruolo === "admin" && (
              <Link href={`/data-explorer/${tableName}/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nessun dato trovato</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Visualizzati {data.length} elementi (max 50)</p>
            <div className="grid gap-4">
              {data.map((item, index) => (
                <Card key={item.id || index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {config.fields.slice(0, 6).map((field) => (
                      <div key={field} className="flex flex-col">
                        <span className="font-medium text-muted-foreground">{field}:</span>
                        <span className="truncate">
                          {item[field] !== null && item[field] !== undefined
                            ? typeof item[field] === "object"
                              ? JSON.stringify(item[field])
                              : String(item[field])
                            : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {user?.ruolo === "admin" && item.id && (
                    <div className="mt-3 pt-3 border-t">
                      <Link href={`/data-explorer/${tableName}/${item.id}`}>
                        <Button variant="outline" size="sm">
                          Visualizza dettagli
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

TableDataView.displayName = "TableDataView"

// Componente principale
interface ShowListProps {
  tableName?: string
}

export function ShowList({ tableName }: ShowListProps) {
  const { tables, isLoading, showRpcInstructions, fetchTables } = useSupabaseTables()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Funzione per gestire la navigazione a una tabella specifica
  const handleTableSelect = useCallback(
    (selectedTableName: string) => {
      router.push(`/show-list/${encodeURIComponent(selectedTableName)}`)
    },
    [router],
  )

  // Se è specificata una tabella, mostra i suoi dati
  if (tableName) {
    return <TableDataView tableName={tableName} />
  }

  // Altrimenti mostra la lista delle tabelle
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleziona una tabella</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-muted-foreground">
          Seleziona una tabella dall'elenco qui sotto per visualizzare i suoi dati con campi predefiniti.
        </p>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <TableCard key={table} tableName={table} onClick={() => handleTableSelect(table)} />
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
  )
}
