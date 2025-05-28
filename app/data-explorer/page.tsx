"use client"

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
  Filter,
  SortAsc,
  SortDesc,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Calendar,
  CheckSquare,
  Clock,
  ListTodo,
  Briefcase,
  Users,
  FolderKanban,
} from "lucide-react"
import { formatValue } from "@/lib/utils-db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: Calendar },
  { id: "attivita", label: "Attività", icon: CheckSquare },
  { id: "scadenze", label: "Scadenze", icon: Clock },
  { id: "todolist", label: "To-Do List", icon: ListTodo },
  { id: "progetti", label: "Progetti", icon: Briefcase },
  { id: "clienti", label: "Clienti", icon: Users },
]

// Definizione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "string",
      priorita: "number",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
  },
  attivita: {
    listFields: ["id", "titolo", "data_inizio", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "string",
      priorita: "number",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "scadenza", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "scadenza",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "datetime",
      stato: "string",
      priorita: "number",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
  },
  todolist: {
    listFields: ["id", "titolo", "completato", "priorita", "data_scadenza"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "priorita",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "number",
      data_scadenza: "datetime",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
  },
  progetti: {
    listFields: ["id", "nome", "stato", "data_inizio", "data_fine", "budget"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      nome: "string",
      descrizione: "text",
      stato: "string",
      data_inizio: "datetime",
      data_fine: "datetime",
      budget: "number",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
  },
  clienti: {
    listFields: ["id", "nome", "cognome", "email", "telefono", "citta"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "cognome",
    types: {
      id: "number",
      nome: "string",
      cognome: "string",
      email: "string",
      telefono: "string",
      citta: "string",
      indirizzo: "string",
      cap: "string",
      piva: "string",
      codfisc: "string",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
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

  // Renderizza l'intestazione della tabella
  const renderTableHeader = () => {
    if (!selectedTable) return null

    const tableConfig = TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]
    const fields = tableConfig?.listFields || []

    return (
      <TableHeader>
        <TableRow>
          {fields.map((field) => (
            <TableHead key={field} className="cursor-pointer" onClick={() => handleSort(field)}>
              <div className="flex items-center space-x-1">
                <span>{field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}</span>
                {sortField === field && (
                  <span>{sortDirection === "asc" ? <SortAsc size={14} /> : <SortDesc size={14} />}</span>
                )}
              </div>
            </TableHead>
          ))}
          <TableHead className="text-right">Azioni</TableHead>
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
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ),
              )}
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
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
              colSpan={(TABLE_FIELDS[selectedTable as keyof typeof TABLE_FIELDS]?.listFields.length || 0) + 1}
              className="text-center h-32"
            >
              {searchTerm ? "Nessun risultato trovato" : "Nessun dato disponibile"}
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
          <TableRow key={item.id} className="cursor-pointer hover:bg-gray-100">
            {fields.map((field) => (
              <TableCell key={field} onClick={() => handleRowClick(item.id)}>
                {renderCellValue(item[field], types[field as keyof typeof types])}
              </TableCell>
            ))}
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRowClick(item.id)
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualizza</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/data-explorer/${selectedTable}/${item.id}?edit=true`)
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Modifica</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
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
        return formatDateIT(value)
      case "boolean":
        return value ? "✓" : "✗"
      case "number":
        return typeof value === "number" ? value.toLocaleString("it-IT") : value
      case "text":
        return value.length > 50 ? value.substring(0, 50) + "..." : value
      default:
        return formatValue(value)
    }
  }

  // Renderizza la vista a griglia
  const renderGridView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
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
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">{searchTerm ? "Nessun risultato trovato" : "Nessun dato disponibile"}</p>
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
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleRowClick(item.id)}
          >
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2">{item.titolo || item.nome || `ID: ${item.id}`}</h3>
              <div className="space-y-1">
                {fields.slice(1, 4).map((field) => (
                  <div key={field} className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}:
                    </span>
                    <span className="text-sm">{renderCellValue(item[field], types[field as keyof typeof types])}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" className="mr-2">
                  <Eye size={16} className="mr-1" /> Visualizza
                </Button>
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
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            {selectedTable && getTableIcon(selectedTable)}
            <div>
              <CardTitle>
                {selectedTable
                  ? AVAILABLE_TABLES.find((t) => t.id === selectedTable)?.label || "Esploratore Dati"
                  : "Esploratore Dati"}
              </CardTitle>
              <CardDescription>Visualizza e gestisci i tuoi dati personali</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
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
            <div className="w-full md:w-2/3 flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Cerca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setView(view === "list" ? "grid" : "list")}>
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={loadTableData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={handleCreateNew} disabled={!selectedTable}>
                <Plus className="h-4 w-4 mr-2" /> Nuovo
              </Button>
            </div>
          </div>

          {selectedTable ? (
            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "grid")}>
              <TabsList className="mb-4">
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="grid">Griglia</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <div className="rounded-md border">
                  <Table>
                    {renderTableHeader()}
                    {renderTableBody()}
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="grid">{renderGridView()}</TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h3 className="text-xl font-medium mb-2">Seleziona una tabella</h3>
              <p className="text-gray-500 mb-4">Scegli una tabella per visualizzare e gestire i tuoi dati</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {AVAILABLE_TABLES.map((table) => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => setSelectedTable(table.id)}
                  >
                    <table.icon className="h-6 w-6 mb-2" />
                    <span>{table.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedTable && filteredData.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Visualizzazione di {filteredData.length} elementi su {data.length} totali
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
