"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  SortAsc,
  SortDesc,
  Plus,
  RefreshCw,
  Calendar,
  CheckSquare,
  Clock,
  ListTodo,
  Briefcase,
  Users,
  FilePlus,
  FileText,
  Grid3X3,
  List,
  StickyNote,
  Filter,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: Calendar },
  { id: "attivita", label: "Attività", icon: CheckSquare },
  { id: "scadenze", label: "Scadenze", icon: Clock },
  { id: "todolist", label: "To-Do List", icon: ListTodo },
  { id: "progetti", label: "Progetti", icon: Briefcase },
  { id: "clienti", label: "Clienti", icon: Users },
  { id: "pagine", label: "Pagine", icon: FileText },
  { id: "note", label: "Note", icon: StickyNote },
]

// Definizione dei campi per ogni tabella (CORRETTA e CONSISTENTE)
const TABLE_FIELDS = {
  appuntamenti: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato", "luogo"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      modifica: "datetime",
      attivo: "boolean",
      id_utente: "number",
      titolo: "string",
      descrizione: "text",
      note: "text",
      luogo: "string",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "string",
      priorita: "string",
      id_pro: "number",
      id_att: "number",
      id_cli: "number",
      tags: "json",
      notifica: "datetime",
    },
  },
  attivita: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato", "priorita"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      modifica: "datetime",
      attivo: "boolean",
      id_utente: "number",
      titolo: "string",
      descrizione: "text",
      note: "text",
      luogo: "string",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "string",
      id_pro: "number",
      id_app: "number",
      id_cli: "number",
      tags: "json",
      priorita: "string",
      notifica: "datetime",
      completato: "boolean",
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "scadenza", "stato", "privato"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "scadenza",
    types: {
      id: "number",
      modifica: "datetime",
      id_utente: "number",
      id_pro: "number",
      scadenza: "date",
      titolo: "string",
      descrizione: "text",
      note: "text",
      stato: "string",
      privato: "boolean",
      notifica: "datetime",
      completato: "boolean",
    },
  },
  todolist: {
    listFields: ["id", "titolo", "descrizione", "scadenza", "completato"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "scadenza",
    types: {
      id: "number",
      id_utente: "number",
      descrizione: "text",
      modifica: "datetime",
      scadenza: "date",
      priorita: "string",
      notifica: "time",
      titolo: "string",
      completato: "boolean",
    },
  },
  progetti: {
    listFields: ["id", "titolo", "stato", "data_inizio", "data_fine", "avanzamento"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      modifica: "datetime",
      attivo: "boolean",
      id_utente: "number",
      id_cli: "array",
      id_att: "array",
      id_app: "array",
      id_sca: "array",
      stato: "string",
      avanzamento: "number",
      titolo: "string",
      descrizione: "text",
      note: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      gruppo: "string",
      colore: "string",
      notifica: "datetime",
      priorita: "string",
      allegati: "json",
    },
  },
  clienti: {
    listFields: ["id", "nome", "cognome", "email", "citta", "societa"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "cognome",
    types: {
      id: "number",
      id_utente: "number",
      modifica: "datetime",
      nome: "string",
      cognome: "string",
      indirizzo: "string",
      citta: "string",
      cap: "string",
      email: "string",
      rappresentante: "boolean",
      societa: "string",
      indirizzosocieta: "string",
      cittasocieta: "string",
      codicefiscale: "string",
      partitaiva: "string",
      recapiti: "text",
      note: "text",
      attivo: "boolean",
      qr: "string",
    },
  },
  pagine: {
    listFields: ["id", "titolo", "categoria", "pubblicato", "attivo"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "pubblicato",
    types: {
      id: "number",
      modifica: "datetime",
      id_utente: "number",
      attivo: "boolean",
      titolo: "string",
      estratto: "text",
      contenuto: "text",
      categoria: "string",
      tags: "json",
      immagine: "string",
      pubblicato: "datetime",
      privato: "boolean",
    },
  },
  note: {
    listFields: ["id", "titolo", "data_creazione", "modifica", "synced"],
    readOnlyFields: ["id", "data_creazione", "modifica", "id_utente"],
    defaultSort: "data_creazione",
    types: {
      id: "number",
      titolo: "string",
      contenuto: "text",
      data_creazione: "datetime",
      modifica: "datetime",
      tags: "array",
      priorita: "string",
      notifica: "datetime",
      notebook_id: "string",
      id_utente: "string",
      synced: "boolean",
      completato: "boolean",
    },
  },
}

// Funzione per formattare le date in italiano
function formatDateIT(date: string | null | undefined): string {
  if (!date) return ""
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (e) {
    return ""
  }
}

// Funzione per formattare solo la data
function formatDateOnly(date: string | null | undefined): string {
  if (!date) return ""
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (e) {
    return ""
  }
}

// Componente principale
export default function DataExplorerPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [view, setView] = useState<"list" | "grid">("list")
  const [activeTab, setActiveTab] = useState<"columns" | "filters">("columns")
  const [completedFilter, setCompletedFilter] = useState<"non-completati" | "completati" | "tutti">("non-completati")

  // CORREZIONE NAVIGAZIONE: Leggi il parametro 'table' dalla query string all'inizializzazione
  useEffect(() => {
    const tableParam = searchParams.get("table")
    console.log(`[DataExplorerPage] Parametro table dalla URL: ${tableParam}`)

    if (tableParam && AVAILABLE_TABLES.some((t) => t.id === tableParam)) {
      console.log(`[DataExplorerPage] Impostazione tabella selezionata: ${tableParam}`)
      setSelectedTable(tableParam)
    } else if (!selectedTable) {
      console.log(`[DataExplorerPage] Nessuna tabella valida trovata nei parametri URL`)
    }
  }, [searchParams, selectedTable])

  // Carica i dati quando cambia la tabella selezionata
  useEffect(() => {
    if (selectedTable && user?.id) {
      loadTableData()
    }
  }, [selectedTable, user?.id])

  // Filtra i dati quando cambia il termine di ricerca o il filtro completato
  useEffect(() => {
    if (data.length > 0) {
      filterData()
    }
  }, [searchTerm, data, sortField, sortDirection, completedFilter])

  // Reset del filtro completato quando cambia tabella
  useEffect(() => {
    if (selectedTable) {
      setCompletedFilter("non-completati")
    }
  }, [selectedTable])

  // Verifica se la tabella ha il campo "completato"
  const hasCompletedField = () => {
    if (!selectedTable) return false
    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    return tableConfig?.types?.completato === "boolean"
  }

  const loadTableData = async () => {
    if (!supabase || !selectedTable || !user?.id) return

    setLoading(true)
    try {
      // Ottieni i campi per la tabella selezionata
      const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
      const defaultSort = tableConfig?.defaultSort || "id"

      // Determina il tipo di id_utente per questa tabella
      const userIdType = tableConfig?.types?.id_utente
      const userId = userIdType === "string" ? String(user.id) : user.id

      console.log(`[DataExplorer] Caricamento dati da ${selectedTable} per utente ${userId} (tipo: ${userIdType})`)

      // Esegui la query
      const { data, error } = await supabase
        .from(selectedTable)
        .select("*")
        .eq("id_utente", userId)
        .order(defaultSort, { ascending: true })

      if (error) {
        throw error
      }

      console.log(`[DataExplorer] Caricati ${data?.length || 0} elementi da ${selectedTable}`)
      setData(data || [])
      setSortField(defaultSort)
      setSortDirection("asc")
    } catch (error: any) {
      console.error(`Errore nel caricamento dei dati da ${selectedTable}:`, error)

      // Non resettare selectedTable in caso di errore, mantieni la selezione
      setData([]) // Imposta array vuoto invece di undefined

      toast({
        title: "Errore",
        description: `Impossibile caricare i dati: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtra e ordina i dati
  const filterData = () => {
    let filtered = [...data]

    // Applica il filtro per il campo "completato" se esiste
    if (hasCompletedField()) {
      switch (completedFilter) {
        case "non-completati":
          filtered = filtered.filter((item) => !item.completato)
          break
        case "completati":
          filtered = filtered.filter((item) => item.completato === true)
          break
        case "tutti":
          // Non applicare filtro
          break
      }
    }

    // Applica la ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((item) => {
        return Object.values(item).some((value) => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(term)
        })
      })
    }

    // Applica l'ordinamento
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        // Gestisci valori null o undefined
        if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1
        if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1

        // Confronta date
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc" ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime()
        }

        // Confronta stringhe
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Confronta numeri e altri tipi
        return sortDirection === "asc" ? (aValue > bValue ? 1 : -1) : aValue > bValue ? -1 : 1
      })
    }

    setFilteredData(filtered)
  }

  // Gestisce il cambio di ordinamento
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Cambia direzione se il campo è già selezionato
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Imposta il nuovo campo e direzione asc
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Naviga alla pagina di dettaglio
  const handleRowClick = (id: number) => {
    if (selectedTable) {
      router.push(`/data-explorer/${selectedTable}/${id}`)
    }
  }

  // Crea un nuovo elemento
  const handleCreateNew = () => {
    if (selectedTable) {
      router.push(`/data-explorer/${selectedTable}/new`)
    }
  }

  // Funzione per completare rapidamente un elemento
  const handleMarkCompleted = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Previene il click sulla riga

    if (!supabase || !selectedTable || !user?.id) return

    try {
      const updateData: any = {
        modifica: new Date().toISOString(),
      }

      // Se la tabella ha il campo "completato", aggiornalo
      if (hasCompletedField()) {
        updateData.completato = true
      }

      // Se la tabella ha il campo "stato", aggiornalo
      const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
      if (tableConfig?.types?.stato) {
        updateData.stato = "completato"
      }

      const { error } = await supabase.from(selectedTable).update(updateData).eq("id", itemId).eq("id_utente", user.id)

      if (error) throw error

      toast({
        title: "Completato",
        description: "Elemento marcato come completato",
      })

      // Ricarica i dati per aggiornare la vista
      loadTableData()
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile aggiornare lo stato: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Funzione per verificare se mostrare il pulsante completato
  const shouldShowCompleteButton = (item: any) => {
    if (!selectedTable) return false

    // Se ha il campo "completato", verifica che non sia già completato
    if (hasCompletedField()) {
      return !item.completato
    }

    // Altrimenti verifica il campo "stato" come prima
    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const types = tableConfig?.types || {}

    if (!types.stato) return false
    return item.stato && item.stato !== "completato"
  }

  // Renderizza l'intestazione della tabella
  const renderTableHeader = () => {
    if (!selectedTable) return null

    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const fields = tableConfig?.listFields || []
    const hasStateField = tableConfig?.types?.stato
    const showCompleteButton = hasCompletedField() || hasStateField

    return (
      <TableHeader>
        <TableRow>
          {fields.map((field) => (
            <TableHead key={field} className="cursor-pointer" onClick={() => handleSort(field)}>
              <div className="flex items-center space-x-1">
                <span className="text-xs sm:text-sm font-medium">
                  {field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                </span>
                {sortField === field && (
                  <span>{sortDirection === "asc" ? <SortAsc size={12} /> : <SortDesc size={12} />}</span>
                )}
              </div>
            </TableHead>
          ))}
          {showCompleteButton && (
            <TableHead className="text-center w-24">
              <span className="text-xs sm:text-sm font-medium">Azioni</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
    )
  }

  // Renderizza il corpo della tabella
  const renderTableBody = () => {
    if (loading) {
      return (
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]?.listFields.length || 0)].map(
                (_, cellIndex) => (
                  <TableCell key={cellIndex} className="p-2">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      )
    }

    if (filteredData.length === 0) {
      const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
      const hasStateField = tableConfig?.types?.stato
      const showCompleteButton = hasCompletedField() || hasStateField

      return (
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={
                (TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]?.listFields.length || 0) +
                (showCompleteButton ? 1 : 0)
              }
              className="text-center h-32"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <p className="text-gray-500">
                  {searchTerm || (hasCompletedField() && completedFilter !== "tutti")
                    ? "Nessun risultato trovato"
                    : "Nessun dato disponibile"}
                </p>
                <Button variant="outline" onClick={handleCreateNew} size="sm">
                  <FilePlus className="h-4 w-4 mr-2" /> Crea nuovo
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      )
    }

    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const fields = tableConfig?.listFields || []
    const types = tableConfig?.types || {}
    const hasStateField = tableConfig?.types?.stato
    const showCompleteButton = hasCompletedField() || hasStateField

    return (
      <TableBody>
        {filteredData.map((item) => (
          <TableRow
            key={item.id}
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${
              hasCompletedField() && item.completato ? "opacity-60" : ""
            }`}
            onClick={() => handleRowClick(item.id)}
          >
            {fields.map((field) => (
              <TableCell key={field} className="p-2 text-xs sm:text-sm">
                {renderCellValue(item[field], types[field as keyof typeof types])}
              </TableCell>
            ))}
            {showCompleteButton && (
              <TableCell className="p-2 text-center">
                {shouldShowCompleteButton(item) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    onClick={(e) => handleMarkCompleted(item.id, e)}
                  >
                    ✓ Completato
                  </Button>
                )}
                {hasCompletedField() && item.completato && (
                  <span className="text-xs text-green-600 font-medium">✓ Completato</span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    )
  }

  // Renderizza il valore della cella in base al tipo
  const renderCellValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "-"

    switch (type) {
      case "datetime":
        return <span className="text-xs">{formatDateIT(value)}</span>
      case "date":
        return <span className="text-xs">{formatDateOnly(value)}</span>
      case "boolean":
        return <span className={value ? "text-green-600" : "text-red-600"}>{value ? "✓" : "✗"}</span>
      case "number":
        return (
          <span className="font-mono text-xs">{typeof value === "number" ? value.toLocaleString("it-IT") : value}</span>
        )
      case "text":
        return <span className="text-xs">{value.length > 30 ? value.substring(0, 30) + "..." : value}</span>
      case "json":
        return <span className="text-xs text-blue-600">{Array.isArray(value) ? `[${value.length}]` : "{...}"}</span>
      case "array":
        return <span className="text-xs text-blue-600">[{Array.isArray(value) ? value.length : 0}]</span>
      default:
        return (
          <span className="text-xs">{String(value).length > 30 ? String(value).substring(0, 30) + "..." : value}</span>
        )
    }
  }

  // Renderizza la vista griglia
  const renderGridView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      )
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchTerm || (hasCompletedField() && completedFilter !== "tutti")
              ? "Nessun risultato trovato"
              : "Nessun dato disponibile"}
          </p>
          <Button variant="outline" onClick={handleCreateNew}>
            <FilePlus className="h-4 w-4 mr-2" /> Crea nuovo
          </Button>
        </div>
      )
    }

    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const fields = tableConfig?.listFields || []
    const types = tableConfig?.types || {}

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              hasCompletedField() && item.completato ? "opacity-60" : ""
            }`}
            onClick={() => handleRowClick(item.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {fields.slice(0, 4).map((field) => (
                  <div key={field} className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 capitalize">{field.replace("_", " ")}:</span>
                    <span className="text-sm font-medium text-right">
                      {renderCellValue(item[field], types[field as keyof typeof types])}
                    </span>
                  </div>
                ))}
                {shouldShowCompleteButton(item) && (
                  <div className="pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                      onClick={(e) => handleMarkCompleted(item.id, e)}
                    >
                      ✓ Completato
                    </Button>
                  </div>
                )}
                {hasCompletedField() && item.completato && (
                  <div className="pt-2 border-t text-center">
                    <span className="text-xs text-green-600 font-medium">✓ Completato</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Ottieni informazioni sulla tabella selezionata
  const selectedTableInfo = AVAILABLE_TABLES.find((table) => table.id === selectedTable)
  const Icon = selectedTableInfo?.icon || Grid3X3

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Grid3X3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Data Explorer</h1>
        </div>
        <p className="text-gray-600">Esplora e gestisci i dati delle tue tabelle</p>
      </div>

      <div className="space-y-6">
        {/* Selezione tabella */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3X3 className="w-5 h-5" />
              <span>Seleziona Tabella</span>
            </CardTitle>
            <CardDescription>Scegli la tabella da esplorare</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona una tabella..." />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TABLES.map((table) => {
                  const TableIcon = table.icon
                  return (
                    <SelectItem key={table.id} value={table.id}>
                      <div className="flex items-center space-x-2">
                        <TableIcon className="w-4 h-4" />
                        <span>{table.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Contenuto principale */}
        {selectedTable && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <Icon className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle>{selectedTableInfo?.label}</CardTitle>
                    <CardDescription>
                      {loading
                        ? "Caricamento..."
                        : `${filteredData.length} di ${data.length} elementi${
                            searchTerm || (hasCompletedField() && completedFilter !== "tutti") ? " (filtrati)" : ""
                          }`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={loadTableData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Aggiorna
                  </Button>
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "columns" | "filters")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="columns">Colonne</TabsTrigger>
                  <TabsTrigger value="filters">Filtri</TabsTrigger>
                </TabsList>

                <TabsContent value="columns" className="space-y-4">
                  {/* Controlli di ricerca e vista */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Cerca in tutti i campi..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={view === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setView("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={view === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setView("grid")}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Contenuto tabella/griglia */}
                  <div className="border rounded-lg">
                    {view === "list" ? (
                      <Table>
                        {renderTableHeader()}
                        {renderTableBody()}
                      </Table>
                    ) : (
                      <div className="p-4">{renderGridView()}</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Filtri Avanzati</span>
                  </div>

                  {/* Filtro per completato (se disponibile) */}
                  {hasCompletedField() && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stato Completamento</label>
                      <Select value={completedFilter} onValueChange={setCompletedFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non-completati">Solo non completati</SelectItem>
                          <SelectItem value="completati">Solo completati</SelectItem>
                          <SelectItem value="tutti">Tutti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Informazioni sui filtri attivi */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Filtri attivi:</strong>
                    </p>
                    <ul className="text-sm text-blue-600 mt-1 space-y-1">
                      {searchTerm && <li>• Ricerca: "{searchTerm}"</li>}
                      {hasCompletedField() && completedFilter !== "tutti" && (
                        <li>
                          • Completamento:{" "}
                          {completedFilter === "completati" ? "Solo completati" : "Solo non completati"}
                        </li>
                      )}
                      {!searchTerm && (!hasCompletedField() || completedFilter === "tutti") && (
                        <li>• Nessun filtro attivo</li>
                      )}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
