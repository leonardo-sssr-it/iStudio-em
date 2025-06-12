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
  FolderKanban,
  FilePlus,
  FileText,
  Grid3X3,
  List,
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
      tag: "json",
      immagine: "string",
      pubblicato: "datetime",
      privato: "boolean",
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

  // Leggi il parametro 'table' dalla query string all'inizializzazione
  useEffect(() => {
    const tableParam = searchParams.get("table")
    if (tableParam && AVAILABLE_TABLES.some((t) => t.id === tableParam)) {
      setSelectedTable(tableParam)
    }
  }, [searchParams])

  // Carica i dati quando cambia la tabella selezionata
  useEffect(() => {
    if (selectedTable && user?.id) {
      loadTableData()
    }
  }, [selectedTable, user?.id])

  // Filtra i dati quando cambia il termine di ricerca
  useEffect(() => {
    if (data.length > 0) {
      filterData()
    }
  }, [searchTerm, data, sortField, sortDirection])

  // Carica i dati dalla tabella selezionata
  const loadTableData = async () => {
    if (!supabase || !selectedTable || !user?.id) return

    setLoading(true)
    try {
      // Ottieni i campi per la tabella selezionata
      const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
      const defaultSort = tableConfig?.defaultSort || "id"

      // Esegui la query
      const { data, error } = await supabase
        .from(selectedTable)
        .select("*")
        .eq("id_utente", user.id)
        .order(defaultSort, { ascending: true })

      if (error) {
        throw error
      }

      setData(data || [])
      setSortField(defaultSort)
      setSortDirection("asc")
    } catch (error: any) {
      console.error(`Errore nel caricamento dei dati da ${selectedTable}:`, error)
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
      const { error } = await supabase
        .from(selectedTable)
        .update({
          stato: "completato",
          modifica: new Date().toISOString(),
        })
        .eq("id", itemId)
        .eq("id_utente", user.id)

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

    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const types = tableConfig?.types || {}

    // Verifica se la tabella ha il campo stato
    if (!types.stato) return false

    // Verifica se lo stato attuale è diverso da "completato"
    return item.stato && item.stato !== "completato"
  }

  // Renderizza l'intestazione della tabella
  const renderTableHeader = () => {
    if (!selectedTable) return null

    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const fields = tableConfig?.listFields || []
    const hasStateField = tableConfig?.types?.stato

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
          {hasStateField && (
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
      return (
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={
                (TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]?.listFields.length || 0) +
                (TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]?.types?.stato ? 1 : 0)
              }
              className="text-center h-32"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <p className="text-gray-500">{searchTerm ? "Nessun risultato trovato" : "Nessun dato disponibile"}</p>
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

    return (
      <TableBody>
        {filteredData.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleRowClick(item.id)}
          >
            {fields.map((field) => (
              <TableCell key={field} className="p-2 text-xs sm:text-sm">
                {renderCellValue(item[field], types[field as keyof typeof types])}
              </TableCell>
            ))}
            {tableConfig?.types?.stato && (
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
            {searchTerm ? "Nessun risultato trovato" : "Nessun dato disponibile"}
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
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border/50 group relative"
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
            <div className="w-full lg:w-1/3">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
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

            {/* Controlli azioni */}
            <div className="w-full lg:w-2/3 flex flex-col sm:flex-row gap-2">
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
                    onClick={() => setSelectedTable(table.id)}
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
              {searchTerm && <span>Filtrato per: "{searchTerm}"</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
