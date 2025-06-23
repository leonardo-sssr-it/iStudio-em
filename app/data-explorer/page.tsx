"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
  FolderKanban,
  FilePlus,
  FileText,
  Grid3X3,
  List,
  StickyNote,
  Filter,
} from "lucide-react"
import { formatValue } from "@/lib/utils-db"
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

// Definizione dei campi per ogni tabella (CORRETTA in base alla struttura reale del DB)
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
      id_pro: "number",
      id_att: "number",
      id_cli: "number",
      tags: "json",
      notifica: "array",
      completato: "boolean", // Solo se questa tabella ha il campo
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
      completato: "boolean", // Solo se questa tabella ha il campo
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "scadenza", "stato", "id_pro"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "scadenza",
    types: {
      id: "number",
      modifica: "datetime",
      attivo: "boolean",
      id_utente: "number",
      id_pro: "number",
      scadenza: "date",
      titolo: "string",
      descrizione: "text",
      tag: "array",
      note: "text",
      stato: "string",
      privato: "boolean",
      notifica: "datetime",
      completato: "boolean", // Solo se questa tabella ha il campo
    },
  },
  todolist: {
    listFields: ["id", "titolo", "descrizione", "scadenza", "priorita"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "scadenza",
    types: {
      id: "number",
      id_utente: "number",
      descrizione: "text",
      modifica: "datetime",
      tag: "json",
      scadenza: "date",
      priorita: "string",
      notifica: "time",
      titolo: "string",
      completato: "boolean", // Solo se questa tabella ha il campo
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
      tag: "array",
      gruppo: "string",
      colore: "string",
      notifica: "datetime",
      priorita: "string",
      allegati: "json",
      // progetti non ha il campo completato
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
      // clienti non ha il campo completato
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
      tag: "json",
      immagine: "string",
      pubblicato: "datetime",
      privato: "boolean",
      // pagine non ha il campo completato
    },
  },
  note: {
    listFields: ["id", "titolo", "data_creazione", "modifica", "priorita"],
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
      completato: "boolean", // Solo se questa tabella ha il campo
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

  // Leggi il parametro 'table' dalla query string all'inizializzazione
  useEffect(() => {
    const tableParam = searchParams.get("table")
    if (tableParam && AVAILABLE_TABLES.some((t) => t.id === tableParam) && !selectedTable) {
      setSelectedTable(tableParam)
    }
  }, [searchParams])

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
        return (
          <span className="text-xs text-blue-600">{Array.isArray(value) ? `${value.length} elementi` : "JSON"}</span>
        )
      case "array":
        return (
          <span className="text-xs text-purple-600">{Array.isArray(value) ? `${value.length} elementi` : "-"}</span>
        )
      case "time":
        return <span className="text-xs font-mono">{value ? String(value).substring(0, 8) : "-"}</span>
      default:
        return <span className="text-xs">{formatValue(value)}</span>
    }
  }

  // Renderizza la vista a griglia
  const renderGridView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="h-48">
              <CardContent className="p-4 flex flex-col space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (filteredData.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <p className="text-gray-500 text-center">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredData.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border/50 group relative ${
              hasCompletedField() && item.completato ? "opacity-60" : ""
            }`}
            onClick={() => handleRowClick(item.id)}
          >
            <CardContent className="p-4">
              {/* Pulsante completato in alto a destra */}
              {shouldShowCompleteButton(item) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 h-6 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleMarkCompleted(item.id, e)}
                >
                  ✓
                </Button>
              )}

              {/* Indicatore completato */}
              {hasCompletedField() && item.completato && (
                <div className="absolute top-2 right-2 text-green-600 text-xs font-medium">✓ Completato</div>
              )}

              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-sm line-clamp-2 flex-1 pr-8">
                  {item.titolo || item.nome || item.descrizione || `ID: ${item.id}`}
                </h3>
              </div>

              <div className="space-y-2">
                {fields.slice(1, 4).map((field) => (
                  <div key={field} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium min-w-0 flex-shrink-0 mr-2">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}:
                    </span>
                    <span className="text-right min-w-0 flex-1 truncate">
                      {renderCellValue(item[field], types[field as keyof typeof types])}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">ID: {item.id}</span>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Clicca per dettagli →
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Ottieni l'icona per la tabella selezionata
  const getTableIcon = (tableId: string) => {
    const table = AVAILABLE_TABLES.find((t) => t.id === tableId)
    if (!table) return <FolderKanban className="h-5 w-5" />

    const Icon = table.icon
    return <Icon className="h-5 w-5" />
  }

  // Gestisce la selezione di una tabella
  const handleTableSelect = useCallback((tableName: string) => {
    console.log(`[DataExplorer] Selezione tabella: ${tableName}`)
    setSelectedTable(tableName)
    setActiveTab("columns")
  }, [])

  return (
    <div className="w-full max-w-none space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            {selectedTable && getTableIcon(selectedTable)}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl">
                {selectedTable
                  ? AVAILABLE_TABLES.find((t) => t.id === selectedTable)?.label || "Esploratore Dati"
                  : "Esploratore Dati"}
              </CardTitle>
              <CardDescription className="text-sm">Visualizza e gestisci i tuoi dati personali</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Controlli superiori */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            {/* Selezione tabella */}
            <div className="w-full lg:w-1/4">
              <Select
                value={selectedTable}
                onValueChange={(value) => {
                  console.log(`[DataExplorer] Select onChange: ${value}`)
                  setSelectedTable(value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona una tabella" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      <div className="flex items-center space-x-2">
                        <table.icon className="h-4 w-4" />
                        <span>{table.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro completato (solo se la tabella ha il campo) */}
            {selectedTable && hasCompletedField() && (
              <div className="w-full lg:w-1/4">
                <Select value={completedFilter} onValueChange={(value) => setCompletedFilter(value as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-completati">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span>Non completati</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completati">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="h-4 w-4" />
                        <span>Completati</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tutti">
                      <div className="flex items-center space-x-2">
                        <List className="h-4 w-4" />
                        <span>Tutti</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Controlli azioni */}
            <div className={`w-full flex flex-col sm:flex-row gap-2 ${hasCompletedField() ? "lg:flex-1" : "lg:w-3/4"}`}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setView(view === "list" ? "grid" : "list")}
                  className="shrink-0"
                >
                  {view === "list" ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={loadTableData} className="shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleCreateNew} disabled={!selectedTable} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuovo</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Contenuto principale */}
          {selectedTable ? (
            <div className="space-y-4">
              <Tabs value={view} onValueChange={(v) => setView(v as "list" | "grid")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
                  <TabsTrigger value="list" className="flex items-center space-x-2">
                    <List className="h-4 w-4" />
                    <span>Lista</span>
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="flex items-center space-x-2">
                    <Grid3X3 className="h-4 w-4" />
                    <span>Griglia</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-4">
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        {renderTableHeader()}
                        {renderTableBody()}
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="grid" className="mt-4">
                  {renderGridView()}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Seleziona una tabella</h3>
                <p className="text-muted-foreground">Scegli una tabella per visualizzare e gestire i tuoi dati</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-2xl">
                {AVAILABLE_TABLES.map((table) => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-muted/50 transition-colors"
                    onClick={() => handleTableSelect(table.id)}
                  >
                    <table.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{table.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Statistiche */}
          {selectedTable && filteredData.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-border/50 text-sm text-muted-foreground">
              <span>
                Visualizzazione di {filteredData.length} elementi su {data.length} totali
              </span>
              <div className="flex space-x-4">
                {searchTerm && <span>Filtrato per: "{searchTerm}"</span>}
                {hasCompletedField() && completedFilter !== "tutti" && (
                  <span>Filtro: {completedFilter === "completati" ? "Solo completati" : "Solo non completati"}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
