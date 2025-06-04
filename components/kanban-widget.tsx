"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Definizione dei tipi
type KanbanItem = {
  id: string
  title: string
  description?: string
  priorita: string | { id: string; value: string } | null
  priorita_id?: string
  priorita_value?: string
  colore?: string
  data_inizio?: string | Date | null
  data_fine?: string | Date | null
  scadenza?: string | Date | null
  tabella: string
  record_id: number
  stato?: string
  avanzamento?: number
}

type KanbanColumn = {
  id: string
  title: string
  items: KanbanItem[]
  color?: string
}

type PrioritaConfig = {
  id: string
  value: string
  colore?: string
}

export function KanbanWidget() {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Funzione per caricare le priorità dalla configurazione
  const loadPriorities = useCallback(async () => {
    try {
      const { data: configData, error: configError } = await supabase.from("configurazione").select("priorita").single()

      if (configError) throw configError

      if (!configData?.priorita) {
        throw new Error("Configurazione priorità non trovata")
      }

      // Estrai le priorità dalla configurazione
      let priorities: PrioritaConfig[] = []

      if (Array.isArray(configData.priorita)) {
        priorities = configData.priorita
      } else if (typeof configData.priorita === "object") {
        // Gestisci il caso in cui priorita sia un oggetto con chiavi
        priorities = Object.values(configData.priorita)
      }

      // Crea una colonna per ogni priorità
      const priorityColumns: KanbanColumn[] = [
        {
          id: "no-priority",
          title: "Da assegnare",
          items: [],
          color: "bg-gray-200 dark:bg-gray-700",
        },
        ...priorities.map((p) => ({
          id: p.id || p.value,
          title: p.value,
          items: [],
          color: p.colore || "bg-blue-200 dark:bg-blue-800",
        })),
      ]

      return priorityColumns
    } catch (err: any) {
      console.error("Errore nel caricamento delle priorità:", err)
      setError(`Errore nel caricamento delle priorità: ${err.message}`)
      return [
        {
          id: "no-priority",
          title: "Da assegnare",
          items: [],
          color: "bg-gray-200 dark:bg-gray-700",
        },
      ]
    }
  }, [supabase])

  // Funzione per normalizzare il valore della priorità
  const normalizePriority = (item: any): { id: string; value: string } | null => {
    if (!item.priorita) return null

    // Se è già un oggetto con id e value
    if (typeof item.priorita === "object" && item.priorita !== null) {
      if (item.priorita.id && item.priorita.value) {
        return { id: item.priorita.id, value: item.priorita.value }
      }
      // Gestisci altri formati possibili
      if (item.priorita.id && item.priorita.nome) {
        return { id: item.priorita.id, value: item.priorita.nome }
      }
    }

    // Se è una stringa, prova a parsificarla come JSON
    if (typeof item.priorita === "string") {
      try {
        const parsed = JSON.parse(item.priorita)
        if (parsed && typeof parsed === "object") {
          if (parsed.id && parsed.value) {
            return { id: parsed.id, value: parsed.value }
          }
          if (parsed.id && parsed.nome) {
            return { id: parsed.id, value: parsed.nome }
          }
        }
      } catch (e) {
        // Non è JSON valido, potrebbe essere solo un ID
        return { id: item.priorita, value: item.priorita }
      }
    }

    // Se abbiamo priorita_id e priorita_value separati
    if (item.priorita_id && item.priorita_value) {
      return { id: item.priorita_id, value: item.priorita_value }
    }

    return null
  }

  // Funzione per caricare gli elementi dalle tabelle
  const loadItems = useCallback(
    async (columns: KanbanColumn[]) => {
      try {
        // Definisci le tabelle da cui caricare gli elementi
        const tables = ["attivita", "progetti", "todolist"]
        let allItems: KanbanItem[] = []

        // Carica gli elementi da ogni tabella
        for (const table of tables) {
          const { data, error } = await supabase.from(table).select("*")

          if (error) throw error

          if (data) {
            const tableItems: KanbanItem[] = data.map((item) => {
              const priority = normalizePriority(item)

              return {
                id: `${table}-${item.id}`,
                title: item.titolo || item.nome || item.descrizione || `${table} #${item.id}`,
                description: item.descrizione,
                priorita: priority,
                priorita_id: priority?.id,
                priorita_value: priority?.value,
                colore: item.colore,
                data_inizio: item.data_inizio,
                data_fine: item.data_fine,
                scadenza: item.scadenza,
                tabella: table,
                record_id: item.id,
                stato: item.stato,
                avanzamento: item.avanzamento,
              }
            })

            allItems = [...allItems, ...tableItems]
          }
        }

        // Distribuisci gli elementi nelle colonne appropriate
        const updatedColumns = columns.map((column) => {
          if (column.id === "no-priority") {
            // Elementi senza priorità
            column.items = allItems.filter((item) => !item.priorita_id && !item.priorita)
          } else {
            // Elementi con questa priorità
            column.items = allItems.filter((item) => {
              const priorityId =
                item.priorita_id || (item.priorita && typeof item.priorita === "object" ? item.priorita.id : null)
              return priorityId === column.id
            })
          }
          return column
        })

        return updatedColumns
      } catch (err: any) {
        console.error("Errore nel caricamento degli elementi:", err)
        setError(`Errore nel caricamento degli elementi: ${err.message}`)
        return columns
      }
    },
    [supabase],
  )

  // Carica i dati all'avvio
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const priorityColumns = await loadPriorities()
        const populatedColumns = await loadItems(priorityColumns)
        setColumns(populatedColumns)
      } catch (err: any) {
        setError(`Errore nel caricamento dei dati: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [loadPriorities, loadItems])

  // Gestione del drag and drop
  const handleDragEnd = async (result: any) => {
    setIsDragging(false)

    const { source, destination, draggableId } = result

    // Dropped outside the list or no movement
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return
    }

    // Find the item that was dragged
    const itemId = draggableId
    const sourceColumn = columns.find((col) => col.id === source.droppableId)
    const item = sourceColumn?.items.find((i) => i.id === itemId)

    if (!item) return

    // Create a copy of the columns
    const newColumns = [...columns]

    // Remove from source column
    const sourceColumnIndex = newColumns.findIndex((col) => col.id === source.droppableId)
    newColumns[sourceColumnIndex].items = newColumns[sourceColumnIndex].items.filter((i) => i.id !== itemId)

    // Add to destination column
    const destColumnIndex = newColumns.findIndex((col) => col.id === destination.droppableId)
    const destColumn = newColumns[destColumnIndex]

    // Update the item's priority
    const newPriorityId = destColumn.id === "no-priority" ? null : destColumn.id
    const newPriorityValue = destColumn.id === "no-priority" ? null : destColumn.title

    const updatedItem = {
      ...item,
      priorita_id: newPriorityId,
      priorita_value: newPriorityValue,
      priorita: newPriorityId ? { id: newPriorityId, value: newPriorityValue || "" } : null,
    }

    // Insert at the new position
    newColumns[destColumnIndex].items.splice(destination.index, 0, updatedItem)

    // Update state optimistically
    setColumns(newColumns)

    // Update in the database
    try {
      const { tabella, record_id } = item
      const now = new Date().toISOString()

      // Prepare the update data based on the table structure
      const updateData: any = { modifica: now }

      if (newPriorityId) {
        // Different tables might store priority differently
        if (tabella === "attivita" || tabella === "progetti") {
          updateData.priorita = { id: newPriorityId, value: newPriorityValue }
        } else if (tabella === "todolist") {
          updateData.priorita_id = newPriorityId
          updateData.priorita_value = newPriorityValue
        } else {
          // Default fallback
          updateData.priorita = { id: newPriorityId, value: newPriorityValue }
        }
      } else {
        // Clear priority
        if (tabella === "attivita" || tabella === "progetti") {
          updateData.priorita = null
        } else if (tabella === "todolist") {
          updateData.priorita_id = null
          updateData.priorita_value = null
        } else {
          updateData.priorita = null
        }
      }

      const { error } = await supabase.from(tabella).update(updateData).eq("id", record_id)

      if (error) throw error

      toast({
        title: "Priorità aggiornata",
        description: `La priorità di "${item.title}" è stata aggiornata con successo.`,
        variant: "success",
      })
    } catch (err: any) {
      console.error("Errore nell'aggiornamento della priorità:", err)

      toast({
        title: "Errore",
        description: `Impossibile aggiornare la priorità: ${err.message}`,
        variant: "destructive",
      })

      // Revert the state
      loadItems(await loadPriorities()).then(setColumns)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  // Funzione per formattare la data
  const formatDate = (date: string | Date | null) => {
    if (!date) return null
    try {
      return format(new Date(date), "dd MMM", { locale: it })
    } catch (e) {
      return null
    }
  }

  // Rendering dello stato di caricamento
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Caricamento Kanban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <Skeleton className="h-8 w-full mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Rendering dello stato di errore
  if (error) {
    return (
      <Card className="w-full bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Errore nel caricamento del Kanban</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true)
              loadItems(columns).then((cols) => {
                setColumns(cols)
                setIsLoading(false)
                setError(null)
              })
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Riprova
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kanban Board</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div className={cn("flex gap-4 overflow-x-auto p-4 min-h-[500px]", isDragging && "cursor-grabbing")}>
            {columns.map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-shrink-0 w-72 rounded-lg p-2",
                      snapshot.isDraggingOver ? "bg-muted/80" : "bg-muted/50",
                      column.color && !snapshot.isDraggingOver && column.color,
                    )}
                  >
                    <h3 className="font-medium text-sm mb-3 px-2 py-1 bg-background/80 rounded-md backdrop-blur-sm">
                      {column.title}
                      <Badge variant="outline" className="ml-2 bg-background/50">
                        {column.items.length}
                      </Badge>
                    </h3>

                    <div className="space-y-2">
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "p-3 rounded-md bg-card border shadow-sm",
                                snapshot.isDragging && "shadow-lg ring-2 ring-primary",
                                item.colore && `border-l-4 border-l-[${item.colore}]`,
                              )}
                              style={{
                                ...provided.draggableProps.style,
                                borderLeftColor: item.colore || undefined,
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-sm line-clamp-2" title={item.title}>
                                  {item.title}
                                </h4>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.tabella}
                                </Badge>
                              </div>

                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                              )}

                              <div className="flex flex-wrap gap-1 mt-2 text-xs">
                                {item.stato && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.stato}
                                  </Badge>
                                )}

                                {item.avanzamento !== undefined && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    {item.avanzamento}%
                                  </Badge>
                                )}

                                {(item.scadenza || item.data_fine) && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(item.scadenza || item.data_fine)}
                                  </Badge>
                                )}

                                {item.data_inizio && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(item.data_inizio)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {column.items.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground bg-background/50 rounded-md border border-dashed">
                          Nessun elemento
                        </div>
                      )}
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
