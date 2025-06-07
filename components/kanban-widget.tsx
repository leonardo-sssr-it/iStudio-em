"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, Clock, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import type { AuthUser } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useJsonDecoder, type KanbanColumnConfig } from "@/hooks/use-json-decoder"

// --- Tipi Definiti ---
type KanbanItemBase = {
  id: string // Unique ID for DND (e.g., "attivita-123")
  title: string
  description?: string
  colore?: string
  data_inizio?: string | Date | null
  data_fine?: string | Date | null
  scadenza?: string | Date | null
  stato?: string
  avanzamento?: number
}

type KanbanItem = KanbanItemBase & {
  originalTable: "attivita" | "progetti" | "todolist"
  originalRecordId: number // Actual ID in the database table
  id_utente?: string
  dbPriorityValue: string | number | null | Record<string, any> // Raw priority value from DB
  assignedPriorityLevel: number | null // Matched priority level
}

type KanbanColumn = {
  id: string // Corresponds to KanbanColumnConfig.id or UNCATEGORIZED_COLUMN_ID
  title: string // From KanbanColumnConfig.title
  description?: string // From KanbanColumnConfig.description
  headerColor?: string
  items: KanbanItem[]
  level?: number // Priority level
  isUncategorized?: boolean
}

const PASTEL_COLORS: Record<KanbanItem["originalTable"], string> = {
  attivita: "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-200",
  progetti:
    "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-200",
  todolist:
    "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-200",
}

const UNCATEGORIZED_COLUMN_ID = "uncategorized"

// Priorità di default se la configurazione è vuota o non valida
const DEFAULT_PRIORITIES = [
  { livello: 1, nome: "Bassa", descrizione: "Priorità bassa", colore: "bg-green-200 dark:bg-green-800" },
  { livello: 2, nome: "Media", descrizione: "Priorità media", colore: "bg-yellow-200 dark:bg-yellow-800" },
  { livello: 3, nome: "Alta", descrizione: "Priorità alta", colore: "bg-orange-200 dark:bg-orange-800" },
  { livello: 4, nome: "Urgente", descrizione: "Priorità urgente", colore: "bg-red-200 dark:bg-red-800" },
]

export function KanbanWidget() {
  const { user: authUser, isLoading: authIsLoading } = useAuth()
  const { supabase, isInitializing: supabaseIsInitializing } = useSupabase()

  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [kanbanColumnsConfig, setKanbanColumnsConfig] = useState<KanbanColumnConfig[]>([])
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)

  const { decodePriorities, createKanbanColumns } = useJsonDecoder()

  const [debugInfo, setDebugInfo] = useState<{
    rawPriorityConfig: string
    decodedPriorities: any[]
    createdColumns: any[]
    finalColumns: any[]
    configLoadError: string | null
    usingDefaults: boolean
  } | null>(null)

  const loadConfigAndPriorities = useCallback(async () => {
    if (!supabase || supabaseIsInitializing) {
      return null
    }
    try {
      const { data: configData, error: configError } = await supabase
        .from("configurazione")
        .select("priorita, debug")
        .single()

      if (configError) throw configError
      if (!configData) throw new Error("Configurazione non trovata.")

      console.log("KanbanWidget: Raw configData:", configData)

      // Cattura info di debug - assicuriamoci che sia sempre una stringa
      const rawPriorityConfig =
        typeof configData.priorita === "string" ? configData.priorita : JSON.stringify(configData.priorita)

      // Parse del JSON delle priorità
      let parsedPriorities: any[] = []
      let usingDefaults = false

      console.log("KanbanWidget: Raw configData.priorita:", configData.priorita, "Type:", typeof configData.priorita)

      // Se il campo priorita è null, undefined o vuoto, usa le priorità di default
      if (!configData.priorita || configData.priorita === "" || configData.priorita === "null") {
        console.log("KanbanWidget: Campo priorita vuoto o null, usando priorità di default")
        parsedPriorities = DEFAULT_PRIORITIES
        usingDefaults = true
      } else {
        try {
          if (typeof configData.priorita === "string") {
            parsedPriorities = JSON.parse(configData.priorita)
            console.log("KanbanWidget: Parsed from string:", parsedPriorities)
          } else if (Array.isArray(configData.priorita)) {
            parsedPriorities = configData.priorita
            console.log("KanbanWidget: Already an array:", parsedPriorities)
          } else if (configData.priorita && typeof configData.priorita === "object") {
            // Potrebbe essere un oggetto invece di un array
            console.log("KanbanWidget: Found object instead of array:", configData.priorita)
            parsedPriorities = [configData.priorita]
          }
        } catch (parseError) {
          console.error("Errore nel parsing del JSON priorità:", parseError)
          console.log("KanbanWidget: Errore nel parsing, usando priorità di default")
          parsedPriorities = DEFAULT_PRIORITIES
          usingDefaults = true
        }
      }

      console.log("KanbanWidget: Parsed priorities before validation:", parsedPriorities)

      // Validazione e creazione delle colonne con logging dettagliato
      const validPriorities = parsedPriorities
        .map((item, index) => {
          console.log(`KanbanWidget: Validating item ${index}:`, item)

          if (typeof item !== "object" || item === null) {
            console.log(`KanbanWidget: Item ${index} is not an object:`, typeof item)
            return null
          }

          // Controlla diversi possibili nomi per il campo livello
          const level = item.livello ?? item.level ?? item.priority ?? item.priorita ?? null
          if (typeof level !== "number") {
            console.log(`KanbanWidget: Item ${index} has invalid level:`, level, typeof level)
            return null
          }

          // Controlla diversi possibili nomi per il campo nome
          const name = item.nome ?? item.name ?? item.title ?? item.titolo ?? null
          if (typeof name !== "string" || name.trim() === "") {
            console.log(`KanbanWidget: Item ${index} has invalid name:`, name, typeof name)
            return null
          }

          // Normalizza l'oggetto
          const normalizedItem = {
            livello: level,
            nome: name.trim(),
            descrizione: item.descrizione ?? item.description ?? `Priorità livello ${level}`,
            colore:
              item.colore ??
              item.color ??
              `bg-blue-${Math.min(900, 100 + level * 100)} dark:bg-blue-${Math.min(900, 800 - level * 100)}`,
          }

          console.log(`KanbanWidget: Item ${index} is valid:`, normalizedItem)
          return normalizedItem
        })
        .filter((item) => item !== null)
        .sort((a, b) => a.livello - b.livello) // Ordina per livello

      console.log("KanbanWidget: Valid priorities after filtering:", validPriorities)

      // Se non ci sono priorità valide, usa quelle di default
      if (validPriorities.length === 0) {
        console.log("KanbanWidget: Nessuna priorità valida trovata, usando priorità di default")
        validPriorities.push(...DEFAULT_PRIORITIES)
        usingDefaults = true
      }

      // Crea le colonne Kanban
      const columnsConfig: KanbanColumnConfig[] = validPriorities.map((priority) => ({
        id: String(priority.livello),
        title: priority.nome.trim(),
        description: priority.descrizione,
        headerColor: priority.colore,
        level: priority.livello,
        isEmpty: true, // Sarà aggiornato quando vengono caricati gli elementi
      }))

      // Aggiorna le informazioni di debug
      if (configData.debug === true) {
        setDebugInfo({
          rawPriorityConfig,
          decodedPriorities: validPriorities,
          createdColumns: columnsConfig,
          finalColumns: [], // Sarà aggiornato dopo
          configLoadError: null,
          usingDefaults,
        })
      }

      console.log("KanbanWidget: Colonne create:", columnsConfig)

      return { columnsConfig, isDebug: configData.debug === true }
    } catch (err: any) {
      console.error("KanbanWidget: Errore durante il caricamento della configurazione delle priorità:", err)

      // In caso di errore, usa le priorità di default
      console.log("KanbanWidget: Errore nel caricamento configurazione, usando priorità di default")
      const defaultColumnsConfig: KanbanColumnConfig[] = DEFAULT_PRIORITIES.map((priority) => ({
        id: String(priority.livello),
        title: priority.nome,
        description: priority.descrizione,
        headerColor: priority.colore,
        level: priority.livello,
        isEmpty: true,
      }))

      // Aggiorna debug con errore
      setDebugInfo((prev) => ({
        rawPriorityConfig: "ERROR",
        decodedPriorities: DEFAULT_PRIORITIES,
        createdColumns: defaultColumnsConfig,
        finalColumns: [],
        configLoadError: err.message,
        usingDefaults: true,
      }))

      return { columnsConfig: defaultColumnsConfig, isDebug: false }
    }
  }, [supabase, supabaseIsInitializing])

  const getPriorityLevelFromDbItem = useCallback(
    (
      itemData: any,
      localColumnsConfig: KanbanColumnConfig[],
    ): { assignedLevel: number | null; rawValue: string | number | null | Record<string, any> } => {
      // Cerca il campo priorità in diversi possibili nomi
      const rawPriority = itemData.priorita ?? itemData.priorita_id ?? itemData.priority ?? null

      console.log(`KanbanWidget: Analizzando priorità per item ${itemData.id}:`, {
        rawPriority,
        type: typeof rawPriority,
        availableColumns: localColumnsConfig.map((c) => ({ id: c.id, level: c.level, title: c.title })),
      })

      if (rawPriority === null || rawPriority === undefined) {
        return { assignedLevel: null, rawValue: null }
      }

      let matchingLevel: number | null = null

      // Prova a convertire in numero
      let numericPriority: number | null = null
      if (typeof rawPriority === "number") {
        numericPriority = rawPriority
      } else if (typeof rawPriority === "string") {
        const parsed = Number.parseInt(rawPriority, 10)
        if (!isNaN(parsed)) {
          numericPriority = parsed
        }
      }

      // Cerca una colonna corrispondente
      if (numericPriority !== null) {
        const matchingConfig = localColumnsConfig.find((config) => config.level === numericPriority)
        if (matchingConfig) {
          matchingLevel = numericPriority
          console.log(
            `KanbanWidget: Match trovato per priorità ${numericPriority} -> colonna "${matchingConfig.title}"`,
          )
        } else {
          console.log(`KanbanWidget: Nessun match trovato per priorità ${numericPriority}`)
        }
      }

      return {
        assignedLevel: matchingLevel,
        rawValue: rawPriority,
      }
    },
    [],
  )

  const loadItems = useCallback(
    async (userForQuery: AuthUser, currentColumnsConfig: KanbanColumnConfig[]) => {
      if (!supabase) return []
      if (!userForQuery) return []

      const tables: KanbanItem["originalTable"][] = ["attivita", "progetti", "todolist"]
      let allKanbanItems: KanbanItem[] = []

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").eq("id_utente", userForQuery.id)
        if (error) {
          console.error(`Errore nel caricamento da ${table}:`, error)
          toast({ title: `Errore ${table}`, description: error.message, variant: "destructive" })
          continue
        }
        if (data) {
          const items: KanbanItem[] = data.map((itemData: any) => {
            const { assignedLevel, rawValue } = getPriorityLevelFromDbItem(itemData, currentColumnsConfig)

            return {
              id: `${table}-${itemData.id}`,
              title: String(itemData.titolo || itemData.nome || itemData.descrizione || "Senza Titolo"),
              description: itemData.descrizione,
              colore: itemData.colore,
              data_inizio: itemData.data_inizio,
              data_fine: itemData.data_fine,
              scadenza: itemData.scadenza,
              stato: itemData.stato,
              avanzamento: itemData.avanzamento,
              originalTable: table,
              originalRecordId: itemData.id,
              id_utente: itemData.id_utente,
              dbPriorityValue: rawValue,
              assignedPriorityLevel: assignedLevel,
            }
          })
          allKanbanItems = [...allKanbanItems, ...items]
        }
      }
      return allKanbanItems
    },
    [supabase, toast, getPriorityLevelFromDbItem],
  )

  useEffect(() => {
    let isActive = true
    const fetchData = async () => {
      if (authIsLoading || supabaseIsInitializing) return
      if (!isActive) return

      if (!authUser) {
        if (isActive) {
          setError("Utente non autenticato per visualizzare il Kanban.")
          setCurrentUser(null)
          setColumns([])
          setIsLoading(false)
        }
        return
      }

      if (isActive) {
        setIsLoading(true)
        setError(null)
        setCurrentUser(authUser)
      }

      try {
        const configResult = await loadConfigAndPriorities()
        if (!isActive || !configResult) {
          if (isActive && !configResult) setError("Configurazione Kanban non caricata.")
          setIsLoading(false)
          return
        }

        const { columnsConfig, isDebug: fetchedIsDebug } = configResult

        console.log("KanbanWidget: Loaded Kanban columns configuration:", columnsConfig)

        if (isActive) {
          setKanbanColumnsConfig(columnsConfig)
          setIsDebugEnabled(fetchedIsDebug)
        }

        const allItems = await loadItems(authUser, columnsConfig)
        if (!isActive) return

        const newColumns: KanbanColumn[] = []

        // Uncategorized column first
        const uncategorizedItems = allItems.filter((item) => item.assignedPriorityLevel === null)
        newColumns.push({
          id: UNCATEGORIZED_COLUMN_ID,
          title: "Non Categorizzati",
          description: "Elementi senza priorità assegnata o con priorità non corrispondente alla configurazione.",
          headerColor: "bg-slate-200 dark:bg-slate-700",
          items: uncategorizedItems,
          isUncategorized: true,
        })

        console.log(`KanbanWidget: Colonna "Non Categorizzati" creata con ${uncategorizedItems.length} elementi`)

        // Then, columns from configuration, sorted by level
        columnsConfig.forEach((columnConfig) => {
          const columnItems = allItems.filter((item) => item.assignedPriorityLevel === columnConfig.level)
          newColumns.push({
            id: columnConfig.id,
            title: columnConfig.title,
            description: columnConfig.description,
            headerColor: columnConfig.headerColor,
            level: columnConfig.level,
            items: columnItems,
          })

          console.log(
            `KanbanWidget: Colonna "${columnConfig.title}" (livello ${columnConfig.level}) creata con ${columnItems.length} elementi`,
          )
        })

        console.log(
          "KanbanWidget: Tutte le colonne create:",
          newColumns.map((col) => ({
            id: col.id,
            title: col.title,
            level: col.level,
            itemCount: col.items.length,
          })),
        )

        if (isActive) setColumns(newColumns)
      } catch (err: any) {
        if (isActive) {
          console.error(`KanbanWidget: Errore catturato in fetchData: ${err.message}`, err.originalError || err)
          setError(err.message || "Errore durante il caricamento dei dati Kanban.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    fetchData()
    return () => {
      isActive = false
    }
  }, [authUser, authIsLoading, supabase, supabaseIsInitializing, loadConfigAndPriorities, loadItems])

  // Debug: aggiorna le colonne finali quando cambiano
  useEffect(() => {
    if (isDebugEnabled && debugInfo) {
      setDebugInfo((prev) =>
        prev
          ? {
              ...prev,
              finalColumns: columns,
            }
          : null,
      )
    }
  }, [columns, isDebugEnabled, debugInfo])

  const handleDragEnd = async (result: DropResult) => {
    if (!supabase) {
      toast({ title: "Errore", description: "Client Supabase non disponibile.", variant: "destructive" })
      return
    }
    const { source, destination, draggableId } = result
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return

    const sourceColumn = columns.find((col) => col.id === source.droppableId)
    const destinationColumn = columns.find((col) => col.id === destination.droppableId)
    const draggedItem = sourceColumn?.items.find((item) => item.id === draggableId)

    if (!sourceColumn || !destinationColumn || !draggedItem) return

    // Optimistic UI update
    const newColumnsState = columns.map((col) => {
      if (col.id === source.droppableId) return { ...col, items: col.items.filter((item) => item.id !== draggableId) }
      if (col.id === destination.droppableId) {
        const newItems = Array.from(col.items)
        const updatedDraggedItem = {
          ...draggedItem,
          assignedPriorityLevel:
            destinationColumn.id === UNCATEGORIZED_COLUMN_ID ? null : destinationColumn.level || null,
        }
        newItems.splice(destination.index, 0, updatedDraggedItem)
        return { ...col, items: newItems }
      }
      return col
    })
    setColumns(newColumnsState)

    // Determine the new priority value for the database
    let newDbPriorityValue: number | null = null
    if (destinationColumn.id === UNCATEGORIZED_COLUMN_ID) {
      newDbPriorityValue = null
    } else {
      newDbPriorityValue = destinationColumn.level || null
    }

    const priorityFieldName = "priorita" // Field name in your DB tables
    try {
      const { error: updateError } = await supabase
        .from(draggedItem.originalTable)
        .update({
          [priorityFieldName]: newDbPriorityValue,
          modifica: new Date().toISOString(), // Update 'modifica' timestamp
        })
        .eq("id", draggedItem.originalRecordId)

      if (updateError) throw updateError
      toast({
        title: "Priorità Aggiornata",
        description: `Priorità di "${draggedItem.title}" aggiornata con successo.`,
        variant: "success",
      })
    } catch (err: any) {
      console.error("Errore nell'aggiornamento della priorità:", err)
      toast({
        title: "Errore Aggiornamento",
        description: `Impossibile aggiornare la priorità: ${err.message}`,
        variant: "destructive",
      })
      // Revert UI on error by re-fetching
      if (currentUser) {
        loadItems(currentUser, kanbanColumnsConfig).then((allItems) => {
          const revertedCols: KanbanColumn[] = []
          revertedCols.push({
            id: UNCATEGORIZED_COLUMN_ID,
            title: "Non Categorizzati",
            description: "Elementi senza priorità assegnata o con priorità non corrispondente alla configurazione.",
            headerColor: "bg-slate-200 dark:bg-slate-700",
            items: allItems.filter((item) => item.assignedPriorityLevel === null),
            isUncategorized: true,
          })
          kanbanColumnsConfig.forEach((columnConfig) => {
            const columnItems = allItems.filter((item) => item.assignedPriorityLevel === columnConfig.level)
            revertedCols.push({
              id: columnConfig.id,
              title: columnConfig.title,
              description: columnConfig.description,
              headerColor: columnConfig.headerColor,
              level: columnConfig.level,
              items: columnItems,
            })
          })
          setColumns(revertedCols)
        })
      }
    }
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return null
    try {
      return format(new Date(date), "dd MMM", { locale: it })
    } catch (e) {
      return null
    }
  }

  // Funzione helper per convertire valori in stringhe sicure per il rendering
  const safeStringify = (value: any): string => {
    if (value === null || value === undefined) {
      return "null"
    }
    if (typeof value === "string") {
      return value
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value)
    }
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Caricamento Kanban...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-72 md:w-80 bg-muted/50 rounded-lg p-4">
                <div className="h-10 bg-muted rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-28 bg-muted rounded" />
                  <div className="h-28 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Errore Kanban</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentUser) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Accesso Richiesto</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Effettua l'accesso per visualizzare il Kanban.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Kanban Priorità</CardTitle>
      </CardHeader>

      {/* Sezione Debug */}
      {isDebugEnabled && debugInfo && (
        <div className="mx-4 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">🐛 Debug Configurazione Priorità</h4>

          {debugInfo.usingDefaults && (
            <div className="mb-3 p-2 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700 rounded">
              <strong className="text-orange-700 dark:text-orange-300">⚠️ Usando priorità di default</strong>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                La configurazione delle priorità non è valida o è vuota. Vengono utilizzate le priorità predefinite.
              </div>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-yellow-700 dark:text-yellow-300">Raw Priority Config:</strong>
              <pre className="mt-1 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs overflow-x-auto">
                {safeStringify(debugInfo.rawPriorityConfig)}
              </pre>
            </div>

            <div>
              <strong className="text-yellow-700 dark:text-yellow-300">
                Decoded Priorities ({debugInfo.decodedPriorities.length}):
              </strong>
              <pre className="mt-1 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs overflow-x-auto">
                {safeStringify(debugInfo.decodedPriorities)}
              </pre>
            </div>

            <div>
              <strong className="text-yellow-700 dark:text-yellow-300">
                Created Columns Config ({debugInfo.createdColumns.length}):
              </strong>
              <pre className="mt-1 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs overflow-x-auto">
                {safeStringify(debugInfo.createdColumns)}
              </pre>
            </div>

            <div>
              <strong className="text-yellow-700 dark:text-yellow-300">
                Final Rendered Columns ({debugInfo.finalColumns.length}):
              </strong>
              <pre className="mt-1 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs overflow-x-auto">
                {safeStringify(
                  debugInfo.finalColumns.map((col) => ({
                    id: col.id,
                    title: col.title,
                    level: col.level,
                    itemCount: col.items?.length || 0,
                    isUncategorized: col.isUncategorized,
                  })),
                )}
              </pre>
            </div>

            {debugInfo.configLoadError && (
              <div>
                <strong className="text-red-700 dark:text-red-300">Config Load Error:</strong>
                <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs overflow-x-auto">
                  {safeStringify(debugInfo.configLoadError)}
                </pre>
              </div>
            )}

            <div className="pt-2 border-t border-yellow-300 dark:border-yellow-700">
              <strong className="text-yellow-700 dark:text-yellow-300">Kanban Columns Config:</strong>
              <div className="mt-1 text-xs">
                <div>Configurazione: {kanbanColumnsConfig.length} colonne definite</div>
                <div className="mt-1">
                  Livelli configurati: {kanbanColumnsConfig.map((c) => `${c.level} (${c.title})`).join(", ")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 md:gap-4 overflow-x-auto p-3 md:p-4 min-h-[calc(100vh-250px)] md:min-h-[500px]">
            {columns.map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-shrink-0 w-72 md:w-80 rounded-lg p-1 flex flex-col",
                      snapshot.isDraggingOver ? "bg-primary/10 dark:bg-primary/20" : "bg-muted/50 dark:bg-muted/30",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 rounded-t-md mb-2 sticky top-0 z-10",
                        column.headerColor || "bg-gray-200 dark:bg-gray-800",
                        "text-sm font-semibold text-foreground",
                      )}
                      title={column.description}
                    >
                      <h3 className="truncate flex items-center justify-between">
                        {column.title}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {column.items.length}
                        </Badge>
                      </h3>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 px-2 pb-2 custom-scrollbar">
                      {column.items.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground bg-background/30 dark:bg-background/10 rounded-md border border-dashed mt-2">
                          Nessun elemento
                        </div>
                      )}
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(providedDraggable, snapshotDraggable) => (
                            <Link
                              href={`/data-explorer/${item.originalTable}/${item.originalRecordId}`}
                              passHref
                              legacyBehavior
                            >
                              <a
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                className={cn(
                                  "p-2.5 rounded-md border bg-card shadow-sm block cursor-pointer hover:shadow-md transition-shadow",
                                  PASTEL_COLORS[item.originalTable],
                                  snapshotDraggable.isDragging && "shadow-xl ring-2 ring-primary scale-105 opacity-95",
                                )}
                                onClick={(e) => {
                                  if (snapshotDraggable.isDragging) {
                                    e.preventDefault()
                                  }
                                }}
                              >
                                <div
                                  {...providedDraggable.dragHandleProps}
                                  className="flex items-start mb-1 cursor-grab active:cursor-grabbing"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="h-4 w-4 mr-1.5 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
                                  <h4
                                    className="font-medium text-sm leading-tight line-clamp-2 flex-grow"
                                    title={item.title}
                                  >
                                    {item.title}
                                  </h4>
                                </div>

                                {item.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 my-1.5 ml-5">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs ml-5">
                                  {item.stato && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0.5 px-1.5 bg-background/70 dark:bg-background/30"
                                    >
                                      {item.stato}
                                    </Badge>
                                  )}
                                  {item.avanzamento !== undefined && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0.5 px-1.5 bg-background/70 dark:bg-background/30 flex items-center gap-1"
                                    >
                                      <CheckCircle className="h-3 w-3" /> {item.avanzamento}%
                                    </Badge>
                                  )}
                                  {(item.scadenza || item.data_fine) && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0.5 px-1.5 bg-background/70 dark:bg-background/30 flex items-center gap-1"
                                    >
                                      <Calendar className="h-3 w-3" /> {formatDate(item.scadenza || item.data_fine)}
                                    </Badge>
                                  )}
                                  {item.data_inizio && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs py-0.5 px-1.5 bg-background/70 dark:bg-background/30 flex items-center gap-1"
                                    >
                                      <Clock className="h-3 w-3" /> {formatDate(item.data_inizio)}
                                    </Badge>
                                  )}
                                </div>
                                {isDebugEnabled &&
                                  item.dbPriorityValue !== null &&
                                  item.dbPriorityValue !== undefined && (
                                    <p className="text-xs text-muted-foreground/80 mt-1.5 pt-1 border-t border-dashed ml-5">
                                      Prio. DB: {safeStringify(item.dbPriorityValue)}
                                    </p>
                                  )}
                              </a>
                            </Link>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}
