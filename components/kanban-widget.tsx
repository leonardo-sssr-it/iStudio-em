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

      // Use the JSON decoder hook to parse priorities
      const decodedPriorities = decodePriorities(configData.priorita)

      // Create Kanban columns configuration
      const columnsConfig = createKanbanColumns(decodedPriorities)

      if (columnsConfig.length === 0) {
        console.warn("KanbanWidget: Nessuna colonna di priorità valida trovata nella configurazione.")
      }

      return { columnsConfig, isDebug: configData.debug === true }
    } catch (err: any) {
      console.error("KanbanWidget: Errore durante il caricamento della configurazione delle priorità:", err)
      const specificError = new Error(`Errore caricamento configurazione priorità: ${err.message}`)
      ;(specificError as any).originalError = err
      throw specificError
    }
  }, [supabase, supabaseIsInitializing, decodePriorities, createKanbanColumns])

  const getPriorityLevelFromDbItem = useCallback(
    (
      itemData: any,
      localColumnsConfig: KanbanColumnConfig[],
    ): { assignedLevel: number | null; rawValue: string | number | null | Record<string, any> } => {
      const rawPriority = itemData.priorita ?? itemData.priorita_id ?? null
      if (rawPriority === null || rawPriority === undefined) return { assignedLevel: null, rawValue: null }

      let matchingLevel: number | null = null

      if (typeof rawPriority === "number") {
        const matchingConfig = localColumnsConfig.find((config) => config.level === rawPriority)
        matchingLevel = matchingConfig ? rawPriority : null
      } else if (typeof rawPriority === "string") {
        const numericValue = Number.parseInt(rawPriority, 10)
        if (!isNaN(numericValue)) {
          const matchingConfig = localColumnsConfig.find((config) => config.level === numericValue)
          matchingLevel = matchingConfig ? numericValue : null
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
        newColumns.push({
          id: UNCATEGORIZED_COLUMN_ID,
          title: "Non Categorizzati",
          description: "Elementi senza priorità assegnata o con priorità non corrispondente alla configurazione.",
          headerColor: "bg-slate-200 dark:bg-slate-700",
          items: allItems.filter((item) => item.assignedPriorityLevel === null),
          isUncategorized: true,
        })

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
        })

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
                                      Prio. DB:{" "}
                                      {typeof item.dbPriorityValue === "object"
                                        ? JSON.stringify(item.dbPriorityValue)
                                        : String(item.dbPriorityValue)}
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
