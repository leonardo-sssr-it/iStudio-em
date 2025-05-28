"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { getTableConfig, formatDateValue } from "@/lib/table-config"
import { sanitizeIdentifier } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp, File, Folder, LucideLink, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SqlInstructions } from "@/components/sql-instructions"

// Importa la funzione helper
import { createSupabaseQuery, executeRpc } from "@/lib/supabase-helpers"

export function ShowList({ tableName }: { tableName: string }) {
  const { supabase } = useSupabase()
  const isOnline = useOnlineStatus()
  const router = useRouter()
  const [tableData, setTableData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [sortField, setSortField] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [showRpcInstructions, setShowRpcInstructions] = useState(false)
  const tableConfig = getTableConfig(tableName)

  useEffect(() => {
    setCurrentPage(0) // Reset page on table change
    checkTableExists()
    // Rimuoviamo sortDirection e sortField dalle dipendenze per evitare che l'effetto venga eseguito quando cambiano
  }, [supabase, tableName])

  // Verifica se la tabella esiste
  const checkTableExists = async () => {
    if (!supabase || !tableName) return

    setIsLoading(true)
    try {
      // Se è un bucket di storage, verifichiamo se esiste
      if (tableName.includes("storage bucket")) {
        const bucketName = tableName.replace(" (storage bucket)", "")
        try {
          const { data, error } = await supabase.storage.getBucket(bucketName)
          if (error) {
            setTableExists(false)
            setShowRpcInstructions(true)
            toast({
              title: "Errore",
              description: `Il bucket di storage "${bucketName}" non esiste.`,
              variant: "destructive",
            })
          } else {
            setTableExists(true)
            fetchTableData({
              supabase,
              tableName,
              tableConfig,
              sanitizeIdentifier,
              sortDirection,
              sortField,
              pageSize,
              currentPage,
              setIsLoading,
              setTableData,
              setTotalRows,
              toast,
            })
          }
        } catch (error) {
          setTableExists(false)
          setShowRpcInstructions(true)
          toast({
            title: "Errore",
            description: `Impossibile verificare l'esistenza del bucket "${bucketName}".`,
            variant: "destructive",
          })
        }
      } else {
        // Per le tabelle normali, proviamo a fare una query
        try {
          const { error } = await createSupabaseQuery(supabase, sanitizeIdentifier(tableName), "*", {
            count: "exact",
            head: true,
          }).limit(1)

          if (error) {
            // Prova con la funzione RPC
            try {
              const { error: rpcError } = await executeRpc(supabase, "get_table_data", {
                table_name: sanitizeIdentifier(tableName),
                page_number: 0,
                page_size: 1,
              })

              if (rpcError) {
                setTableExists(false)
                setShowRpcInstructions(true)
                toast({
                  title: "Errore",
                  description: `La tabella "${tableName}" non esiste o non è accessibile.`,
                  variant: "destructive",
                })
              } else {
                setTableExists(true)
                fetchTableData({
                  supabase,
                  tableName,
                  tableConfig,
                  sanitizeIdentifier,
                  sortDirection,
                  sortField,
                  pageSize,
                  currentPage,
                  setIsLoading,
                  setTableData,
                  setTotalRows,
                  toast,
                })
              }
            } catch (rpcError) {
              setTableExists(false)
              setShowRpcInstructions(true)
              toast({
                title: "Errore",
                description: `La tabella "${tableName}" non esiste o non è accessibile.`,
                variant: "destructive",
              })
            }
          } else {
            setTableExists(true)
            fetchTableData({
              supabase,
              tableName,
              tableConfig,
              sanitizeIdentifier,
              sortDirection,
              sortField,
              pageSize,
              currentPage,
              setIsLoading,
              setTableData,
              setTotalRows,
              toast,
            })
          }
        } catch (error) {
          setTableExists(false)
          setShowRpcInstructions(true)
          toast({
            title: "Errore",
            description: `Impossibile verificare l'esistenza della tabella "${tableName}".`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Errore nella verifica della tabella:", error)
      setTableExists(false)
      setShowRpcInstructions(true)
      toast({
        title: "Errore",
        description: `Impossibile verificare l'esistenza della tabella "${tableName}".`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Aggiorna la funzione fetchTableData per utilizzare le funzioni helper
  const fetchTableData = async ({
    supabase,
    tableName,
    tableConfig,
    sanitizeIdentifier,
    sortDirection,
    sortField,
    pageSize,
    currentPage,
    setIsLoading,
    setTableData,
    setTotalRows,
    toast,
  }: FetchTableDataParams) => {
    if (!supabase || !tableName || !tableConfig) return

    // Sanitizza i parametri per prevenire SQL injection
    const sanitizedTableName = sanitizeIdentifier(tableName.replace(" (storage bucket)", ""))
    const sanitizedSortDirection = sortDirection === "desc" ? "desc" : "asc"
    const sanitizedSortField = sortField ? sanitizeIdentifier(sortField) : null

    // Limita la dimensione della pagina per evitare problemi di performance
    const safePageSize = Math.min(pageSize, 100)

    setIsLoading(true)
    try {
      // Se è un bucket di storage, recuperiamo i file
      if (tableName.includes("storage bucket")) {
        const { data, error } = await supabase.storage.from(sanitizedTableName).list("", {
          limit: safePageSize,
          offset: currentPage * safePageSize,
          sortBy: { column: sanitizedSortField || "name", order: sanitizedSortDirection },
        })

        if (error) throw error

        // Otteniamo il conteggio totale
        const { data: countData, error: countError } = await supabase.storage.from(sanitizedTableName).list("", {
          limit: 1000, // Limite massimo per ottenere un conteggio approssimativo
        })

        if (countError) throw countError

        setTableData(data || [])
        setTotalRows(countData?.length || 0)
      } else {
        // Per le tabelle normali, utilizziamo la query standard
        // Seleziona solo i campi specificati nella configurazione
        const fieldsToSelect = tableConfig.fields.join(", ")

        try {
          // Utilizziamo la funzione helper
          let query = createSupabaseQuery(supabase, sanitizedTableName, fieldsToSelect, { count: "exact" })

          // Aggiungiamo ordinamento se specificato
          if (sanitizedSortField) {
            query = query.order(sanitizedSortField, { ascending: sanitizedSortDirection === "asc" })
          }

          // Aggiungiamo paginazione
          query = query.range(currentPage * safePageSize, (currentPage + 1) * safePageSize - 1)

          const { data, error, count } = await query

          if (error) {
            throw error
          }

          setTableData(data || [])
          setTotalRows(count || 0)
        } catch (error) {
          // Se fallisce, proviamo con una funzione RPC personalizzata
          try {
            const { data: rpcData, error: rpcError } = await executeRpc(supabase, "get_table_data", {
              table_name: sanitizedTableName,
              page_number: currentPage,
              page_size: safePageSize,
              sort_column: sanitizedSortField,
              sort_direction: sanitizedSortDirection,
            })

            if (rpcError) throw rpcError

            setTableData(rpcData.data || [])
            setTotalRows(rpcData.total_count || 0)
            return
          } catch (rpcError) {
            console.log("RPC non disponibile, impossibile recuperare i dati")
            throw error // Rilanciamo l'errore originale
          }
        }
      }
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error)
      toast({
        title: "Errore",
        description: "Impossibile recuperare i dati della tabella",
        variant: "destructive",
      })
      setTableData([])
      setTotalRows(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchTableData({
      supabase,
      tableName,
      tableConfig,
      sanitizeIdentifier,
      sortDirection,
      sortField,
      pageSize,
      currentPage: newPage,
      setIsLoading,
      setTableData,
      setTotalRows,
      toast,
    })
  }

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(newDirection)

    // Chiamare fetchTableData con i nuovi parametri di ordinamento
    fetchTableData({
      supabase,
      tableName,
      tableConfig,
      sanitizeIdentifier,
      sortDirection: newDirection,
      sortField: field,
      pageSize,
      currentPage,
      setIsLoading,
      setTableData,
      setTotalRows,
      toast,
    })
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0) // Reset to first page
  }

  const goBack = () => {
    router.push("/show-list")
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

  // Se la tabella non esiste, mostra un messaggio di errore
  if (!tableExists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tabella non trovata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            La tabella <strong>{tableName}</strong> non esiste o non è accessibile. Verifica che la tabella esista nel
            tuo database Supabase.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={goBack}>Torna all'elenco tabelle</Button>
            <Button variant="outline" onClick={checkTableExists}>
              Riprova
            </Button>
          </div>
          {showRpcInstructions && (
            <div className="mt-4">
              <SqlInstructions />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{tableConfig.displayName}</h2>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tableData.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>{tableConfig.displayName}</TableCaption>
              <TableHeader>
                <TableRow>
                  {tableConfig.fields.map((field) => (
                    <TableHead key={field} className="cursor-pointer" onClick={() => handleSort(field)}>
                      {field}
                      {sortField === field && (
                        <>
                          {sortDirection === "asc" ? (
                            <ArrowUp className="inline w-4 h-4 ml-1" />
                          ) : (
                            <ArrowDown className="inline w-4 h-4 ml-1" />
                          )}
                        </>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row: any, index: number) => (
                  <TableRow key={index}>
                    {tableConfig.fields.map((field) => {
                      let value = row[field]
                      if (tableName.includes("storage bucket")) {
                        if (field === "name") {
                          return (
                            <TableCell key={field}>
                              {row.type === "file" ? (
                                <File className="inline w-4 h-4 mr-1" />
                              ) : (
                                <Folder className="inline w-4 h-4 mr-1" />
                              )}
                              {row.name}
                            </TableCell>
                          )
                        }
                        if (field === "id") {
                          return (
                            <TableCell key={field}>
                              <LucideLink className="inline w-4 h-4 mr-1" />
                              <a
                                href={`https://bfxvczhilluhakebbwku.supabase.co/storage/v1/object/public/${tableName.replace(" (storage bucket)", "")}/${row.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Link
                              </a>
                            </TableCell>
                          )
                        }
                      }
                      if (tableConfig.dateFields?.includes(field)) {
                        value = formatDateValue(value)
                      }
                      return <TableCell key={field}>{value}</TableCell>
                    })}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={tableConfig.fields.length}>
                    <div className="flex items-center justify-between">
                      <div className="flex-shrink-0">
                        <Label htmlFor="page-size" className="mr-2">
                          Page Size:
                        </Label>
                        <Select
                          value={pageSize.toString()}
                          onValueChange={(value) => handlePageSizeChange(Number(value))}
                        >
                          <SelectTrigger className="w-[70px]">
                            <SelectValue placeholder={pageSize.toString()} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </Button>
                        <span>
                          Page {currentPage + 1} of {Math.ceil(totalRows / pageSize)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= Math.ceil(totalRows / pageSize) - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span>Next</span>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </>
      ) : (
        <div>No data available for this table.</div>
      )}
    </div>
  )
}

interface FetchTableDataParams {
  supabase: any
  tableName: string
  tableConfig: any
  sanitizeIdentifier: any
  sortDirection: "asc" | "desc"
  sortField: string | null
  pageSize: number
  currentPage: number
  setIsLoading: (isLoading: boolean) => void
  setTableData: (data: any[]) => void
  setTotalRows: (totalRows: number) => void
  toast: any
}
