"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, Download } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { formatValue } from "@/lib/utils-db"
import { sanitizeIdentifier } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useUsers, type UserType } from "@/hooks/use-users"
import { cn } from "@/lib/utils"

// Importa la funzione helper
import { createSupabaseQuery, executeRpc } from "@/lib/supabase-helpers"

// Tipo per le tabelle
interface TableInfo {
  name: string
  has_user_id: boolean
  user_id_field: string
}

// Aggiungi il parametro defaultUserId all'interfaccia SqlInstructionsProps
interface SqlInstructionsProps {
  onClose?: () => void
}

// Aggiungi il parametro defaultUserId all'interfaccia del componente
interface UserDataFilterProps {
  defaultUserId?: string
}

// Modifica la firma della funzione per accettare il nuovo parametro
export function UserDataFilter({ defaultUserId }: UserDataFilterProps = {}) {
  const { supabase, isConnected } = useSupabase()
  const isOnline = useOnlineStatus()
  const { users, isLoading: isLoadingUsers, error: usersError } = useUsers()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [selectedUserIdField, setSelectedUserIdField] = useState<string>("")
  const [results, setResults] = useState<any[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: "asc" | "desc" }>({
    column: null,
    direction: "asc",
  })

  // Imposta l'utente predefinito se specificato
  useEffect(() => {
    if (defaultUserId) {
      setSelectedUser(defaultUserId)
    }
  }, [defaultUserId])

  // Funzione per verificare quali campi utente sono presenti in una tabella
  const checkUserIdFields = useCallback(
    async (tableName: string): Promise<string[]> => {
      if (!supabase) return []

      const sanitizedTableName = sanitizeIdentifier(tableName)
      if (!sanitizedTableName) return []

      try {
        // Possibili nomi di campi per l'ID utente
        const possibleFields = ["id_utente", "user_id", "id_att", "id_app", "id_pro", "id_sca", "id_user", "user"]

        // Ottieni le colonne della tabella
        let columns: string[] = []

        try {
          // Prova a utilizzare la funzione RPC
          const { data, error } = await executeRpc(supabase, "get_columns", { table_name: sanitizedTableName })

          if (data && !error) {
            columns = data.map((col: any) => col.column_name)
          }
        } catch (error) {
          // Fallback: prova a ottenere una riga dalla tabella per vedere le colonne
          try {
            const { data, error } = await createSupabaseQuery(supabase, sanitizedTableName).limit(1)

            if (!error && data && data.length > 0) {
              columns = Object.keys(data[0])
            }
          } catch (innerError) {
            console.log(`Impossibile ottenere colonne per la tabella ${sanitizedTableName}`)
            return []
          }
        }

        // Verifica quali campi possibili esistono nella tabella
        return possibleFields.filter((field) => columns.includes(field))
      } catch (error) {
        console.error(`Errore nel controllo dei campi utente per ${sanitizedTableName}:`, error)
        return []
      }
    },
    [supabase],
  )

  // Funzione per recuperare le tabelle
  const fetchTables = useCallback(async () => {
    if (!supabase) return

    setIsLoadingTables(true)
    try {
      // Prova a utilizzare il servizio RPC centralizzato
      const tableList: TableInfo[] = []

      try {
        const { data, error } = await executeRpc(supabase, "get_tables")

        if (!error && data) {
          // Per ogni tabella, verifica se ha un campo id_utente
          for (const item of data) {
            const tableName = typeof item === "object" ? item.table_name : item
            // Usa la funzione utility condivisa
            const userIdFields = await checkUserIdFields(tableName)

            if (userIdFields.length > 0) {
              tableList.push({
                name: tableName,
                has_user_id: true,
                user_id_field: userIdFields[0], // Usa il primo campo trovato
              })
            }
          }
        }
      } catch (rpcError) {
        console.log("RPC non disponibile, utilizzo metodo alternativo")

        // Approccio 2: Prova a ottenere le tabelle direttamente da information_schema
        try {
          const { data: schemaData, error: schemaError } = await createSupabaseQuery(
            supabase,
            "information_schema.tables",
            "table_name",
          )
            .eq("table_schema", "public")
            .neq("table_type", "VIEW")
            .not("table_name", "like", "pg_%")
            .order("table_name")

          if (!schemaError && schemaData && schemaData.length > 0) {
            // Per ogni tabella, verifica se ha un campo id_utente
            for (const item of schemaData) {
              const tableName = item.table_name
              const userIdFields = await checkUserIdFields(tableName)

              if (userIdFields.length > 0) {
                tableList.push({
                  name: tableName,
                  has_user_id: true,
                  user_id_field: userIdFields[0], // Usa il primo campo trovato
                })
              }
            }
          }
        } catch (schemaError) {
          console.log("Accesso a information_schema fallito, utilizzo metodo alternativo")
        }
      }

      setTables(tableList.filter((t) => t.has_user_id))

      if (tableList.filter((t) => t.has_user_id).length === 0) {
        toast({
          title: "Attenzione",
          description: "Nessuna tabella con campo id_utente trovata.",
        })
      }
    } catch (error) {
      console.error("Errore nel recupero delle tabelle:", error)
      toast({
        title: "Errore",
        description: "Impossibile recuperare la lista delle tabelle",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTables(false)
    }
  }, [supabase, checkUserIdFields])

  // Funzione per recuperare i dati filtrati
  const fetchFilteredData = useCallback(async () => {
    if (!supabase || !selectedUser || !selectedTable || !selectedUserIdField) {
      toast({
        title: "Errore",
        description: "Seleziona un utente e una tabella prima di procedere",
        variant: "destructive",
      })
      return
    }

    // Sanitizza i parametri per prevenire SQL injection
    const sanitizedTableName = sanitizeIdentifier(selectedTable)
    const sanitizedUserIdField = sanitizeIdentifier(selectedUserIdField)

    // Limita la dimensione della pagina per evitare problemi di performance
    const safePageSize = Math.min(pageSize, 100)

    setIsLoadingResults(true)
    try {
      // Esegui la query filtrata con la funzione helper
      let query = createSupabaseQuery(supabase, sanitizedTableName, "*", { count: "exact" })
        .eq(sanitizedUserIdField, selectedUser)
        .range(currentPage * safePageSize, (currentPage + 1) * safePageSize - 1)

      // Aggiungi l'ordinamento alla query se necessario
      if (sortConfig.column) {
        const sortColumn = sanitizeIdentifier(sortConfig.column)
        const sortDirection = sortConfig.direction === "asc" ? true : false
        query = query.order(sortColumn, { ascending: sortDirection })
      }

      const { data, error, count } = await query

      if (error) throw error

      setResults(data || [])
      setTotalRows(count || 0)

      if (data.length === 0) {
        toast({
          title: "Informazione",
          description: `Nessun dato trovato per l'utente selezionato nella tabella ${selectedTable}`,
        })
      }
    } catch (error) {
      console.error("Errore nel recupero dei dati filtrati:", error)
      toast({
        title: "Errore",
        description: "Impossibile recuperare i dati filtrati",
        variant: "destructive",
      })
      setResults([])
      setTotalRows(0)
    } finally {
      setIsLoadingResults(false)
    }
  }, [supabase, selectedUser, selectedTable, selectedUserIdField, currentPage, pageSize, sortConfig])

  // Carica le tabelle quando il componente viene montato
  useEffect(() => {
    let isMounted = true

    if (supabase && isConnected) {
      fetchTables().then(() => {
        if (!isMounted) return
      })
    }

    return () => {
      isMounted = false
    }
  }, [supabase, isConnected, fetchTables])

  // Gestisce il cambio di pagina
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchFilteredData()
  }

  // Gestisce il cambio di ordinamento
  const handleSort = (column: string) => {
    const newDirection = sortConfig.column === column && sortConfig.direction === "asc" ? "desc" : "asc"
    setSortConfig({ column, direction: newDirection })
    fetchFilteredData()
  }

  // Funzione per esportare i risultati in CSV
  const exportToCSV = () => {
    if (results.length === 0) {
      toast({
        title: "Errore",
        description: "Nessun dato da esportare",
        variant: "destructive",
      })
      return
    }

    try {
      // Ottieni le intestazioni delle colonne
      const headers = Object.keys(results[0])

      // Crea le righe CSV
      const csvRows = [
        // Intestazioni
        headers.join(","),
        // Dati
        ...results.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              // Gestisci valori speciali
              if (value === null || value === undefined) return ""
              if (typeof value === "object") return JSON.stringify(value).replace(/"/g, '""')
              if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`
              return value
            })
            .join(","),
        ),
      ]

      // Unisci le righe con newline
      const csvString = csvRows.join("\n")

      // Crea un blob e un link per il download
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${selectedTable}_${new Date().toISOString()}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Successo",
        description: "Dati esportati con successo",
      })
    } catch (error) {
      console.error("Errore nell'esportazione CSV:", error)
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati in CSV",
        variant: "destructive",
      })
    }
  }

  // Avviso se offline
  if (!isOnline) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <h3 className="text-lg font-medium mb-2">Sei offline</h3>
        <p>La connessione a Internet non è disponibile. Alcune funzionalità potrebbero non funzionare correttamente.</p>
      </div>
    )
  }

  // Mostra errore se c'è un problema con gli utenti
  if (usersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Errore</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Si è verificato un errore nel recupero degli utenti: {usersError.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Riprova
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtro Dati Utente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selezione utente - mostra solo se defaultUserId non è specificato */}
            {!defaultUserId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleziona Utente</label>
                {isLoadingUsers ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un utente" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length > 0 ? (
                        users.map((user: UserType) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.cognome} {user.nome} {user.email ? `(${user.email})` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>
                          Nessun utente trovato
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Selezione tabella */}
            <div className={defaultUserId ? "col-span-2" : ""}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleziona Tabella</label>
                {isLoadingTables ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedTable}
                    onValueChange={(value) => {
                      setSelectedTable(value)
                      // Trova il campo id_utente corrispondente
                      const table = tables.find((t) => t.name === value)
                      if (table) {
                        setSelectedUserIdField(table.user_id_field)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una tabella" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.length > 0 ? (
                        tables.map((table) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name} ({table.user_id_field})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tables" disabled>
                          Nessuna tabella trovata
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Pulsante per filtrare */}
          <Button
            onClick={fetchFilteredData}
            disabled={isLoadingResults || !selectedUser || !selectedTable || !selectedUserIdField}
            className="w-full"
          >
            {isLoadingResults ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              "Filtra Dati"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Risultati */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Risultati</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Esporta CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className="p-2 text-left">
                        <button
                          className={cn("flex items-center space-x-1 hover:text-primary")}
                          onClick={() => handleSort(key)}
                        >
                          <span>{key}</span>
                          {sortConfig.column === key ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-muted/30">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="p-2 truncate max-w-xs">
                          {formatValue(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginazione */}
            {totalRows > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalRows)} di{" "}
                  {totalRows} righe
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Pagina precedente</span>
                  </Button>
                  <div className="text-sm">
                    Pagina {currentPage + 1} di {Math.max(1, Math.ceil(totalRows / pageSize))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={(currentPage + 1) * pageSize >= totalRows}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Pagina successiva</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Istruzioni per creare funzioni RPC */}
      {(users.length === 0 || tables.length === 0) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Istruzioni per funzioni RPC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Per ottenere l'elenco completo degli utenti, crea questa funzione RPC nel tuo database Supabase:
            </p>

            <div className="bg-muted p-4 rounded-md overflow-x-auto mb-4">
              <pre>
                <code>{`-- Funzione per ottenere gli utenti
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
  id uuid,
  nome text,
  cognome text,
  email text,
  username text,
  display_name text
) AS $$
BEGIN
  -- Prova prima con la tabella 'users'
  BEGIN
    RETURN QUERY
    SELECT 
      u.id,
      COALESCE(u.nome, u.name, u.first_name, '') as nome,
      COALESCE(u.cognome, u.last_name, '') as cognome,
      COALESCE(u.email, '') as email,
      COALESCE(u.username, u.user_name, '') as username,
      COALESCE(u.display_name, '') as display_name
    FROM users u
    ORDER BY u.cognome, u.nome;
  EXCEPTION
    WHEN undefined_table THEN
      -- Se la tabella 'users' non esiste, prova con 'auth.users'
      BEGIN
        RETURN QUERY
        SELECT 
          au.id,
          '' as nome,
          '' as cognome,
          au.email,
          '' as username,
          '' as display_name
        FROM auth.users au
        ORDER BY au.email;
      EXCEPTION
        WHEN undefined_table THEN
          -- Se anche 'auth.users' non esiste, restituisci un risultato vuoto
          RETURN;
      END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
