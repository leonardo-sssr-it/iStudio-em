"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"
import { Loader2 } from "lucide-react"

export function UserTablesTab() {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [userTables, setUserTables] = useState<Array<{ name: string; userIdField: string }>>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Utilizziamo ref per evitare loop infiniti
  const tablesLoadedRef = useRef(false)

  // Funzione per formattare i valori
  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) {
      return ""
    }

    // Formatta le date
    if (
      typeof value === "string" &&
      (key.includes("data") ||
        key.includes("date") ||
        key.includes("creazione") ||
        key.includes("modifica") ||
        key.includes("accesso"))
    ) {
      try {
        return new Date(value).toLocaleString("it-IT")
      } catch (e) {
        return value
      }
    }

    // Formatta i booleani
    if (typeof value === "boolean") {
      return value ? "Sì" : "No"
    }

    // Formatta gli oggetti JSON
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2)
      } catch (e) {
        return String(value)
      }
    }

    return String(value)
  }

  // Effetto per trovare le tabelle che contengono dati dell'utente
  useEffect(() => {
    const findUserTables = async () => {
      // Evita di eseguire più volte
      if (!supabase || !user || tablesLoadedRef.current) return

      setIsLoading(true)
      setError(null)

      try {
        // Possibili nomi di campi per l'ID utente
        const possibleFields = [
          "id_utente",
          "user_id",
          "id_att",
          "id_app",
          "id_pro",
          "id_sca",
          "id_user",
          "user",
          "utente_id",
        ]
        const foundTables: Array<{ name: string; userIdField: string }> = []

        // Ottieni l'elenco delle tabelle usando la funzione RPC
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc("get_tables")

          if (!rpcError && rpcData) {
            console.log("Tabelle ottenute tramite RPC:", rpcData)

            // Per ogni tabella, verifica se ha un campo id_utente
            for (const table of rpcData) {
              const tableName = table.table_name
              await checkTableForUserData(tableName, possibleFields, foundTables)
            }
          } else {
            throw new Error("RPC get_tables fallita: " + (rpcError?.message || "Errore sconosciuto"))
          }
        } catch (rpcError) {
          console.warn("RPC get_tables fallita, utilizzo metodo alternativo:", rpcError)

          // Metodo alternativo: query diretta a pg_tables
          const { data: pgTables, error: pgError } = await supabase
            .from("pg_tables")
            .select("tablename")
            .eq("schemaname", "public")
            .order("tablename")

          if (pgError) {
            console.error("Errore nel recupero delle tabelle da pg_tables:", pgError)
            throw pgError
          }

          if (pgTables && pgTables.length > 0) {
            console.log("Tabelle ottenute da pg_tables:", pgTables)

            // Per ogni tabella, verifica se ha un campo id_utente
            for (const table of pgTables) {
              const tableName = table.tablename
              await checkTableForUserData(tableName, possibleFields, foundTables)
            }
          } else {
            // Ultimo tentativo: prova con alcune tabelle comuni
            console.log("Nessuna tabella trovata, provo con tabelle comuni")
            const commonTables = ["users", "profiles", "utenti", "attivita", "progetti", "scadenze"]

            for (const tableName of commonTables) {
              await checkTableForUserData(tableName, possibleFields, foundTables)
            }
          }
        }

        console.log("Tabelle trovate con dati utente:", foundTables)
        setUserTables(foundTables)
        tablesLoadedRef.current = true

        // Se abbiamo trovato almeno una tabella, seleziona la prima
        if (foundTables.length > 0) {
          setSelectedTable(foundTables[0].name)
          loadTableData(foundTables[0].name, foundTables[0].userIdField)
        }
      } catch (error: any) {
        console.error("Errore nella ricerca delle tabelle:", error)
        setError(error.message || "Errore nel caricamento delle tabelle")
      } finally {
        setIsLoading(false)
      }
    }

    // Funzione per verificare se una tabella contiene dati dell'utente
    const checkTableForUserData = async (
      tableName: string,
      possibleFields: string[],
      foundTables: Array<{ name: string; userIdField: string }>,
    ) => {
      try {
        // Ottieni le colonne della tabella
        const { data: columns, error: columnsError } = await supabase.rpc("get_columns", { table_name: tableName })

        if (columnsError) {
          console.warn(`Errore nel recupero delle colonne per ${tableName} tramite RPC:`, columnsError)
          return
        }

        if (columns && columns.length > 0) {
          const columnNames = columns.map((col: any) => col.column_name)

          // Verifica se la tabella ha uno dei possibili campi id_utente
          for (const field of possibleFields) {
            if (columnNames.includes(field)) {
              // Verifica se ci sono dati per questo utente
              try {
                const { data: hasData, error: dataError } = await supabase
                  .from(tableName)
                  .select("id")
                  .eq(field, user.id)
                  .limit(1)

                if (!dataError && hasData && hasData.length > 0) {
                  foundTables.push({
                    name: tableName,
                    userIdField: field,
                  })
                  console.log(`Trovati dati per l'utente nella tabella ${tableName} con campo ${field}`)
                }
              } catch (e) {
                console.error(`Errore nella verifica dei dati per ${tableName}:`, e)
              }
              break // Passa alla tabella successiva dopo aver trovato un campo
            }
          }
        }
      } catch (e) {
        console.error(`Errore nell'analisi della tabella ${tableName}:`, e)
      }
    }

    findUserTables()

    // Pulizia quando il componente viene smontato
    return () => {
      tablesLoadedRef.current = false
    }
  }, [supabase, user])

  // Funzione per caricare i dati della tabella selezionata
  const loadTableData = async (tableName: string, userIdField: string) => {
    if (!supabase || !user || !tableName || !userIdField) return

    setIsLoadingData(true)
    setError(null)

    try {
      console.log(`Caricamento dati dalla tabella ${tableName} con filtro ${userIdField}=${user.id}`)

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq(userIdField, user.id)
        .order("id", { ascending: false })
        .limit(50)

      if (error) throw error

      setTableData(data || [])

      if (data && data.length === 0) {
        console.log(`Nessun dato trovato nella tabella ${tableName} per l'utente ${user.id}`)
      } else {
        console.log(`Trovati ${data?.length} record nella tabella ${tableName} per l'utente ${user.id}`)
      }
    } catch (error: any) {
      console.error(`Errore nel recupero dei dati dalla tabella ${tableName}:`, error)
      setError(error.message || `Errore nel caricamento dei dati dalla tabella ${tableName}`)
      setTableData([])
    } finally {
      setIsLoadingData(false)
    }
  }

  // Gestisce il cambio di tabella selezionata
  const handleTableChange = (value: string) => {
    setSelectedTable(value)
    const tableInfo = userTables.find((t) => t.name === value)
    if (tableInfo) {
      loadTableData(tableInfo.name, tableInfo.userIdField)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Caricamento tabelle...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Errore</CardTitle>
          <CardDescription>Si è verificato un errore durante il caricamento dei dati</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (userTables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mie Tabelle</CardTitle>
          <CardDescription>Non ci sono dati associati al tuo account in nessuna tabella.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mie Tabelle</CardTitle>
        <CardDescription>Visualizza i tuoi dati nelle tabelle del database.</CardDescription>

        <div className="mt-4">
          <Select value={selectedTable} onValueChange={handleTableChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una tabella" />
            </SelectTrigger>
            <SelectContent>
              {userTables.map((table) => (
                <SelectItem key={table.name} value={table.name}>
                  {table.name} ({table.userIdField})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingData ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Caricamento dati...</span>
          </div>
        ) : tableData && tableData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(tableData[0]).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Object.entries(row).map(([key, value], cellIndex) => (
                      <TableCell key={`${rowIndex}-${key}`}>{formatValue(value, key)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-4">Nessun dato trovato per questa tabella.</div>
        )}
      </CardContent>
    </Card>
  )
}
