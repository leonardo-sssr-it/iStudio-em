"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Table2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, Save } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import { formatValue } from "@/lib/utils-db"
import { useTables } from "@/hooks/use-tables"
import { useColumns } from "@/hooks/use-columns"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { SqlInstructions } from "@/components/sql-instructions"
import { cn } from "@/lib/utils"

// Modifichiamo il componente TableExplorer per supportare il filtraggio per utente

// Aggiungiamo un nuovo parametro per specificare l'ID utente per il filtraggio
interface TableExplorerProps {
  filterByUserId?: string
}

// Modifica la firma della funzione per accettare il nuovo parametro
export function TableExplorer({ filterByUserId }: TableExplorerProps = {}) {
  const { supabase } = useSupabase()
  const isOnline = useOnlineStatus()
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tables")
  const [showRpcInstructions, setShowRpcInstructions] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Utilizziamo useRef per tenere traccia dei cambiamenti di selectedTable
  const previousTableRef = useRef<string | null>(null)

  // Utilizzo dei custom hooks
  const { tables, isLoading: isLoadingTables, repository, fetchTables } = useTables()
  const {
    columns,
    selectedColumns,
    isLoading: isLoadingColumns,
    handleColumnToggle,
    toggleAllColumns,
    getSelectedColumnsArray,
  } = useColumns(repository, selectedTable)

  // Inizializziamo lo stato dei dati della tabella
  const [tableData, setTableData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortConfig, setSortConfig] = useState<{ column: string | null; direction: "asc" | "desc" }>({
    column: null,
    direction: "asc",
  })

  // Funzione per recuperare i dati della tabella
  const fetchData = useCallback(
    async (page: number, size: number, sortColumn: string | null = null, sortDirection: "asc" | "desc" = "asc") => {
      if (!repository || !selectedTable) return

      try {
        setIsLoadingData(true)
        const result = await repository.getTableData(selectedTable, page, size, sortColumn, sortDirection)
        setTableData(result.data || [])
        setTotalRows(result.count || 0)
        setCurrentPage(page)
      } catch (error) {
        console.error("Errore nel recupero dei dati:", error)
        toast({
          title: "Errore",
          description: "Impossibile recuperare i dati della tabella",
          variant: "destructive",
        })
        // Inizializza tableData come array vuoto in caso di errore
        setTableData([])
        setTotalRows(0)
      } finally {
        setIsLoadingData(false)
      }
    },
    [repository, selectedTable],
  )

  // Gestione del cambio pagina
  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchData(newPage, pageSize, sortConfig.column, sortConfig.direction)
    },
    [fetchData, pageSize, sortConfig],
  )

  // Gestione dell'ordinamento
  const handleSort = useCallback(
    (column: string) => {
      const newDirection = sortConfig.column === column && sortConfig.direction === "asc" ? "desc" : "asc"
      setSortConfig({ column, direction: newDirection })
      fetchData(0, pageSize, column, newDirection)
    },
    [fetchData, pageSize, sortConfig],
  )

  // Gestione del cambio dimensione pagina
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize)
      fetchData(0, newSize, sortConfig.column, sortConfig.direction)
    },
    [fetchData, sortConfig],
  )

  // Fetch data when selectedTable changes
  useEffect(() => {
    // Verifichiamo se la tabella è effettivamente cambiata
    if (selectedTable !== previousTableRef.current && selectedTable && repository) {
      previousTableRef.current = selectedTable

      // Se filterByUserId è specificato, dobbiamo modificare la query per filtrare per utente
      if (filterByUserId) {
        // Prima dobbiamo verificare se la tabella ha un campo id_utente
        checkUserIdField(selectedTable).then((userIdField) => {
          if (userIdField) {
            // Fetch dei dati con filtro utente
            fetchDataWithUserFilter(selectedTable, userIdField, filterByUserId)
          } else {
            // Fetch normale senza filtro
            fetchData(0, pageSize, sortConfig.column, sortConfig.direction)
          }
        })
      } else {
        // Fetch normale senza filtro
        fetchData(0, pageSize, sortConfig.column, sortConfig.direction)
      }
    }
  }, [selectedTable, repository, pageSize, sortConfig, fetchData, filterByUserId])

  // Funzione per verificare se la tabella ha un campo id_utente
  const checkUserIdField = async (tableName: string): Promise<string | null> => {
    if (!supabase || !tableName) return null

    try {
      // Possibili nomi di campi per l'ID utente
      const possibleFields = ["id_utente", "user_id", "id_att", "id_app", "id_pro", "id_sca", "id_user", "user"]

      // Ottieni le colonne della tabella
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_schema", "public")
        .eq("table_name", tableName)

      if (error || !data) return null

      const columnNames = data.map((col) => col.column_name)

      // Verifica se la tabella ha uno dei possibili campi id_utente
      for (const field of possibleFields) {
        if (columnNames.includes(field)) {
          return field
        }
      }

      return null
    } catch (error) {
      console.error(`Errore nella verifica del campo id_utente per ${tableName}:`, error)
      return null
    }
  }

  // Funzione per recuperare i dati con filtro utente
  const fetchDataWithUserFilter = async (tableName: string, userIdField: string, userId: string) => {
    if (!supabase || !tableName || !userIdField || !userId) return

    try {
      setIsLoadingData(true)

      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .eq(userIdField, userId)
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)
        .order(sortConfig.column || "id", { ascending: sortConfig.direction === "asc" })

      if (error) throw error

      // Aggiorna i dati della tabella
      setTableData(data || [])
      setTotalRows(count || 0)
    } catch (error) {
      console.error(`Errore nel recupero dei dati filtrati per utente:`, error)
      toast({
        title: "Errore",
        description: "Impossibile recuperare i dati filtrati per utente",
        variant: "destructive",
      })
      // Inizializza tableData come array vuoto in caso di errore
      setTableData([])
      setTotalRows(0)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Stato per il backup del database
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupProgress, setBackupProgress] = useState({ current: 0, total: 0 })

  // Gestisce la selezione di una tabella
  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName)
    setActiveTab("columns")
  }, [])

  // Genera il codice per la query Supabase
  const generateQueryCode = useCallback(() => {
    if (!selectedTable) return ""

    const selectedColumnsArray = getSelectedColumnsArray()
    if (selectedColumnsArray.length === 0) return ""

    // Rimuoviamo " (storage bucket)" se presente
    const cleanTableName = selectedTable.replace(" (storage bucket)", "")

    if (selectedTable.includes("storage bucket")) {
      return `// Per i bucket di storage, usa l'API Storage
const { data, error } = await supabase
  .storage
  .from('${cleanTableName}')
  .list()
`
    } else {
      return `const { data, error } = await supabase
  .from('${cleanTableName}')
  .select('${selectedColumnsArray.join(", ")}')
`
    }
  }, [selectedTable, getSelectedColumnsArray])

  // Funzione per creare un backup del database
  const createDatabaseBackup = useCallback(async () => {
    if (!supabase || !repository) return

    setIsCreatingBackup(true)
    setBackupProgress({ current: 0, total: 0 })

    try {
      // Ottieni la data corrente formattata per il nome del file
      const now = new Date()
      const dateString = now.toISOString().replace(/[:.]/g, "-").replace("T", "_").split("Z")[0]
      const fileName = `backup_${dateString}.sql`

      // Ottieni l'elenco delle tabelle
      const tableList = await repository.getTables()
      const tableNames = tableList.map((table) => table.name.replace(" (storage bucket)", ""))

      setBackupProgress({ current: 0, total: tableNames.length })

      // Inizia a costruire il contenuto del backup
      let backupContent = `-- Database backup\n`
      backupContent += `-- Generated: ${now.toISOString()}\n\n`

      // Per ogni tabella, ottieni la struttura e i dati
      for (let i = 0; i < tableNames.length; i++) {
        const tableName = tableNames[i]
        setBackupProgress({ current: i + 1, total: tableNames.length })

        // Aggiungi intestazione della tabella
        backupContent += `-- Table: ${tableName}\n\n`

        // Ottieni le colonne della tabella
        const columns = await repository.getColumns(tableName)

        // Crea istruzione CREATE TABLE
        if (columns.length > 0) {
          backupContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`

          const columnDefinitions = columns.map((col) => {
            let def = `  "${col.name}" ${col.type}`
            if (!col.is_nullable) def += " NOT NULL"
            if (col.is_primary) def += " PRIMARY KEY"
            return def
          })

          backupContent += columnDefinitions.join(",\n")
          backupContent += "\n);\n\n"

          // Ottieni i dati della tabella (limitati a 1000 righe per evitare problemi di memoria)
          try {
            const { data } = await repository.getTableData(tableName, 0, 1000)

            if (data && data.length > 0) {
              // Crea istruzioni INSERT
              backupContent += `-- Data for table: ${tableName}\n`

              for (const row of data) {
                const columnNames = Object.keys(row)
                  .map((name) => `"${name}"`)
                  .join(", ")
                const values = Object.values(row)
                  .map((value) => {
                    if (value === null) return "NULL"
                    if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`
                    if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`
                    return value
                  })
                  .join(", ")

                backupContent += `INSERT INTO ${tableName} (${columnNames}) VALUES (${values});\n`
              }

              backupContent += "\n"
            }
          } catch (error) {
            console.log(`Impossibile ottenere i dati per la tabella ${tableName}`)
            // Continua con la tabella successiva
          }
        }
      }

      // Crea un blob dal contenuto del backup
      const blob = new Blob([backupContent], { type: "application/sql" })

      // Crea un URL per il download
      const url = window.URL.createObjectURL(blob)

      // Crea un elemento <a> per il download
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      // Pulisci
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Backup completato",
        description: `Il backup è stato creato con successo: ${fileName}`,
      })
    } catch (error) {
      console.error("Errore nel backup del database:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare il backup del database",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
      setBackupProgress({ current: 0, total: 0 })
    }
  }, [supabase, repository])

  // Verifica se ci sono tabelle e mostra istruzioni RPC se necessario
  useEffect(() => {
    if (!isLoadingTables && tables.length === 0) {
      setShowRpcInstructions(true)
    } else {
      setShowRpcInstructions(false)
    }
  }, [isLoadingTables, tables.length])

  // Avviso se offline
  if (!isOnline) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <h3 className="text-lg font-medium mb-2">Sei offline</h3>
        <p>La connessione a Internet non è disponibile. Alcune funzionalità potrebbero non funzionare correttamente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pulsante per il backup del database */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={createDatabaseBackup}
          disabled={isCreatingBackup || !repository}
          className="flex items-center gap-2"
        >
          {isCreatingBackup ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {backupProgress.total > 0
                ? `Backup in corso... (${backupProgress.current}/${backupProgress.total})`
                : "Creazione backup..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Backup Database
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">Tabelle</TabsTrigger>
          <TabsTrigger value="columns" disabled={!selectedTable}>
            Colonne
          </TabsTrigger>
          <TabsTrigger value="data" disabled={!selectedTable}>
            Dati
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingTables ? (
              Array(6)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : tables.length > 0 ? (
              tables.map((table) => (
                <Card
                  key={typeof table === "object" ? table.name : table}
                  className={`cursor-pointer transition-colors ${
                    selectedTable === (typeof table === "object" ? table.name : table) ? "border-primary" : ""
                  }`}
                  onClick={() => handleTableSelect(typeof table === "object" ? table.name : table)}
                >
                  <CardContent className="p-4 flex items-center space-x-2">
                    <Table2 className="h-5 w-5" />
                    <span>{typeof table === "object" ? table.name : table}</span>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">Nessuna tabella trovata</div>
            )}
          </div>

          {showRpcInstructions && (
            <div className="mt-4">
              <SqlInstructions />
            </div>
          )}
        </TabsContent>

        <TabsContent value="columns">
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle>Colonne della tabella: {selectedTable}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingColumns ? (
                  <div className="space-y-2">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                  </div>
                ) : columns.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allSelected = Object.values(selectedColumns).every((v) => v)
                            toggleAllColumns(!allSelected)
                          }}
                        >
                          {Object.values(selectedColumns).every((v) => v) ? "Deseleziona tutti" : "Seleziona tutti"}
                        </Button>
                      </div>

                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left">Seleziona</th>
                              <th className="p-2 text-left">Nome</th>
                              <th className="p-2 text-left">Tipo</th>
                              <th className="p-2 text-left">Proprietà</th>
                            </tr>
                          </thead>
                          <tbody>
                            {columns.map((column) => (
                              <tr key={column.name} className="border-b">
                                <td className="p-2">
                                  <Checkbox
                                    id={`checkbox-${column.name}`}
                                    checked={selectedColumns[column.name] || false}
                                    onCheckedChange={() => handleColumnToggle(column.name)}
                                  />
                                </td>
                                <td className="p-2">
                                  <Label htmlFor={`checkbox-${column.name}`} className="cursor-pointer">
                                    {column.name}
                                  </Label>
                                </td>
                                <td className="p-2">{column.type}</td>
                                <td className="p-2">
                                  {column.is_primary && (
                                    <span className="mr-2 px-1 bg-blue-100 text-blue-800 rounded text-xs">PK</span>
                                  )}
                                  {!column.is_nullable && (
                                    <span className="mr-2 px-1 bg-red-100 text-red-800 rounded text-xs">NOT NULL</span>
                                  )}
                                  {column.is_identity && (
                                    <span className="px-1 bg-green-100 text-green-800 rounded text-xs">IDENTITY</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Codice query generato:</h3>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code>{generateQueryCode()}</code>
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <p>Nessuna colonna trovata</p>
                    {showRpcInstructions && <SqlInstructions />}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scheda per visualizzare i dati */}
        <TabsContent value="data">
          {selectedTable && (
            <Card>
              <CardHeader>
                <CardTitle>Dati della tabella: {selectedTable}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="space-y-2">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                  </div>
                ) : tableData && tableData.length > 0 ? (
                  <>
                    <div className="border rounded-md overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            {Object.keys(tableData[0]).map((key) => (
                              <th key={key} className="p-2 text-left">
                                <button
                                  className="flex items-center space-x-1 hover:text-primary"
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
                          {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex} className={cn("border-b hover:bg-muted/30")}>
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className={cn("p-2 truncate max-w-xs")}>
                                  {formatValue(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginazione */}
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
                  </>
                ) : (
                  <div className="text-center py-10">
                    <p>Nessun dato trovato</p>
                    <Button
                      className="mt-4"
                      onClick={() => fetchData(0, pageSize, sortConfig.column, sortConfig.direction)}
                    >
                      Carica dati
                    </Button>
                    {showRpcInstructions && <SqlInstructions />}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
