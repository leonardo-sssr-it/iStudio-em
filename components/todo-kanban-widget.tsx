"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CheckCircle, Clock, GripVertical, AlertTriangle } from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import type { AuthUser } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { format, isPast, isToday, isFuture, startOfDay, addDays, subDays } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"

// --- Tipi Definiti ---
interface TodoItem {
  id: string // DND ID: "todolist-123"
  dbId: number // ID effettivo nel database
  titolo: string
  scadenza: Date | null // Corretto: scadenza invece di data_scadenza
  priorita?: string | number | null
  completato: boolean
  id_utente?: string
  originalColumnId: KanbanColumnId
}

type KanbanColumnId = "scaduti" | "oggi" | "futuri" | "completati"

interface TodoKanbanColumn {
  id: KanbanColumnId
  title: string
  items: TodoItem[]
  icon: React.ElementType
  colorClass: string
}

const COLUMN_CONFIG: Record<KanbanColumnId, { title: string; icon: React.ElementType; colorClass: string }> = {
  scaduti: { title: "Scaduti", icon: AlertTriangle, colorClass: "bg-red-500 dark:bg-red-700 text-white" },
  oggi: { title: "Oggi", icon: CalendarDays, colorClass: "bg-blue-500 dark:bg-blue-700 text-white" },
  futuri: { title: "Futuri", icon: Clock, colorClass: "bg-yellow-500 dark:bg-yellow-600 text-black" },
  completati: { title: "Completati", icon: CheckCircle, colorClass: "bg-green-500 dark:bg-green-700 text-white" },
}

// Funzione per formattare la data o restituire un placeholder
const formatDateDisplay = (date: Date | null): string => {
  if (!date) return "N/D"
  try {
    return format(date, "dd MMM", { locale: it })
  } catch {
    return "Data errata"
  }
}

export function TodoKanbanWidget() {
  const { user: authUser, isLoading: authIsLoading } = useAuth()
  const { supabase, isInitializing: supabaseIsInitializing } = useSupabase()
  const { toast } = useToast()

  const [columns, setColumns] = useState<TodoKanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  const initializeColumns = (): TodoKanbanColumn[] => {
    return (Object.keys(COLUMN_CONFIG) as KanbanColumnId[]).map((key) => ({
      id: key,
      title: COLUMN_CONFIG[key].title,
      icon: COLUMN_CONFIG[key].icon,
      colorClass: COLUMN_CONFIG[key].colorClass,
      items: [],
    }))
  }

  const categorizeItem = (item: any, today: Date): KanbanColumnId => {
    if (item.completato) {
      return "completati"
    }
    if (item.scadenza) {
      // Corretto: scadenza invece di data_scadenza
      const scadenza = startOfDay(new Date(item.scadenza))
      if (isPast(scadenza) && !isToday(scadenza)) return "scaduti"
      if (isToday(scadenza)) return "oggi"
      if (isFuture(scadenza)) return "futuri"
    }
    // Se non ha data di scadenza o la data non rientra, lo mettiamo in futuri per default
    return item.scadenza ? "futuri" : "futuri" // Corretto: scadenza invece di data_scadenza
  }

  const loadItems = useCallback(
    async (userForQuery: AuthUser) => {
      if (!supabase || !userForQuery) return
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: dbError } = await supabase
          .from("todolist")
          .select("id, titolo, scadenza, priorita, completato, id_utente") // Corretto: scadenza invece di data_scadenza
          .eq("id_utente", userForQuery.id)

        if (dbError) throw dbError

        const newColumns = initializeColumns()
        const today = startOfDay(new Date())

        if (data) {
          data.forEach((itemData: any) => {
            const columnId = categorizeItem(itemData, today)
            const todoItem: TodoItem = {
              id: `todolist-${itemData.id}`,
              dbId: itemData.id,
              titolo: itemData.titolo || "Senza Titolo",
              scadenza: itemData.scadenza ? new Date(itemData.scadenza) : null, // Corretto: scadenza invece di data_scadenza
              priorita: itemData.priorita,
              completato: itemData.completato,
              id_utente: itemData.id_utente,
              originalColumnId: columnId,
            }
            const columnIndex = newColumns.findIndex((col) => col.id === columnId)
            if (columnIndex !== -1) {
              newColumns[columnIndex].items.push(todoItem)
            }
          })
        }

        // Ordina gli item all'interno di ogni colonna (es. per data scadenza, poi priorità)
        newColumns.forEach((col) => {
          if (col.id !== "completati") {
            // Non ordinare i completati per scadenza
            col.items.sort((a, b) => {
              if (a.scadenza && b.scadenza) return a.scadenza.getTime() - b.scadenza.getTime() // Corretto: scadenza invece di data_scadenza
              if (a.scadenza) return -1 // a ha data, b no -> a prima
              if (b.scadenza) return 1 // b ha data, a no -> b prima
              return 0 // entrambi null
            })
          } else {
            // Potresti voler ordinare i completati per data di completamento se disponibile
          }
        })

        setColumns(newColumns)
      } catch (err: any) {
        console.error("Errore nel caricamento dei todolist:", err)
        setError(err.message || "Impossibile caricare i task.")
        toast({ title: "Errore Caricamento", description: err.message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    },
    [supabase, toast],
  )

  useEffect(() => {
    if (authIsLoading || supabaseIsInitializing) return
    if (!authUser) {
      setIsLoading(false)
      setError("Utente non autenticato.")
      setCurrentUser(null)
      setColumns(initializeColumns())
      return
    }
    setCurrentUser(authUser)
    loadItems(authUser)
  }, [authUser, authIsLoading, supabaseIsInitializing, loadItems])

  const handleDragEnd = async (result: DropResult) => {
    if (!supabase || !currentUser) return
    const { source, destination, draggableId } = result

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return
    }

    const sourceColId = source.droppableId as KanbanColumnId
    const destColId = destination.droppableId as KanbanColumnId

    const sourceColumn = columns.find((col) => col.id === sourceColId)
    const destColumn = columns.find((col) => col.id === destColId)
    const draggedItem = sourceColumn?.items.find((item) => item.id === draggableId)

    if (!sourceColumn || !destColumn || !draggedItem) return

    // Optimistic UI Update
    const newColumnsState = columns.map((col) => {
      if (col.id === sourceColId) {
        return { ...col, items: col.items.filter((item) => item.id !== draggableId) }
      }
      if (col.id === destColId) {
        const newItems = Array.from(col.items)
        // L'item viene aggiornato con la nuova data/stato *prima* di essere inserito
        // Questo è gestito dopo, prima dell'update a Supabase
        const tempMovedItem = { ...draggedItem, originalColumnId: destColId }
        newItems.splice(destination.index, 0, tempMovedItem)
        return { ...col, items: newItems }
      }
      return col
    })
    setColumns(newColumnsState)

    // Preparazione dell'aggiornamento per Supabase
    let updatePayload: Partial<any> = { modifica: new Date().toISOString() }
    const today = startOfDay(new Date())

    if (destColId === "completati") {
      updatePayload = { ...updatePayload, completato: true, data_completamento: new Date().toISOString() }
    } else {
      updatePayload = { ...updatePayload, completato: false, data_completamento: null }
      if (destColId === "oggi") {
        updatePayload.scadenza = today.toISOString() // Corretto: scadenza invece di data_scadenza
      } else if (destColId === "futuri") {
        // Se l'item aveva una data futura, la manteniamo, altrimenti impostiamo a domani
        // Se spostato da "scaduti" o "oggi" a "futuri", impostiamo a domani
        if (
          draggedItem.originalColumnId === "scaduti" ||
          draggedItem.originalColumnId === "oggi" ||
          !draggedItem.scadenza || // Corretto: scadenza invece di data_scadenza
          isPast(draggedItem.scadenza) || // Corretto: scadenza invece di data_scadenza
          isToday(draggedItem.scadenza) // Corretto: scadenza invece di data_scadenza
        ) {
          updatePayload.scadenza = addDays(today, 1).toISOString() // Corretto: scadenza invece di data_scadenza
        } else {
          // Mantiene la data futura esistente se già futura
          if (draggedItem.scadenza && isFuture(draggedItem.scadenza)) {
            // Corretto: scadenza invece di data_scadenza
            updatePayload.scadenza = draggedItem.scadenza.toISOString() // Corretto: scadenza invece di data_scadenza
          } else {
            updatePayload.scadenza = addDays(today, 1).toISOString() // Corretto: scadenza invece di data_scadenza
          }
        }
      } else if (destColId === "scaduti") {
        // Spostare un item in "scaduti" manualmente non dovrebbe cambiarne la data a una passata
        // ma se proviene da "completati", la sua data originale potrebbe essere passata.
        // Se non ha data o la data non è passata, impostiamola a ieri per coerenza con la colonna.
        if (
          !draggedItem.scadenza || // Corretto: scadenza invece di data_scadenza
          !isPast(startOfDay(draggedItem.scadenza)) || // Corretto: scadenza invece di data_scadenza
          isToday(startOfDay(draggedItem.scadenza)) // Corretto: scadenza invece di data_scadenza
        ) {
          updatePayload.scadenza = subDays(today, 1).toISOString() // Corretto: scadenza invece di data_scadenza
        } else {
          updatePayload.scadenza = draggedItem.scadenza?.toISOString() // Corretto: scadenza invece di data_scadenza
        }
      }
    }

    try {
      const { error: updateError } = await supabase
        .from("todolist")
        .update(updatePayload)
        .eq("id", draggedItem.dbId)
        .eq("id_utente", currentUser.id)

      if (updateError) throw updateError

      toast({
        title: "Task Aggiornato",
        description: `"${draggedItem.titolo}" aggiornato con successo.`,
        variant: "success",
      })
      // Ricarica i dati per riflettere lo stato corretto dal DB, inclusi ordinamenti
      await loadItems(currentUser)
    } catch (err: any) {
      console.error("Errore nell'aggiornamento del task:", err)
      toast({
        title: "Errore Aggiornamento",
        description: `Impossibile aggiornare il task: ${err.message}`,
        variant: "destructive",
      })
      // Revert UI ricaricando i dati originali
      await loadItems(currentUser)
    }
  }

  if (authIsLoading || supabaseIsInitializing || (isLoading && columns.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Caricamento Todolist Kanban...</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-60 sm:w-64 md:w-72 bg-muted/50 rounded-lg p-4">
              <div className="h-10 bg-muted rounded mb-4" />
              <div className="space-y-3">
                <div className="h-20 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Errore</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }
  if (!currentUser && !isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Accesso Richiesto</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Effettua l'accesso per visualizzare il Kanban dei todolist.</p>
        </CardContent>
      </Card>
    )
  }

  const baseColWidth = 240 // Corrisponde a w-60
  const responsiveGap = window.innerWidth < 768 ? 12 : 16 // gap-3 o gap-4 (md)
  const containerMinWidth = `${columns.length * (baseColWidth + responsiveGap) - responsiveGap}px`

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Todolist Kanban per Scadenza</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className="flex gap-3 md:gap-4 overflow-x-auto p-3 md:p-4 min-h-[calc(100vh-250px)] md:min-h-[500px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
            style={{ minWidth: containerMinWidth }}
          >
            {columns.map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-shrink-0 rounded-lg p-1 flex flex-col",
                      "w-60 sm:w-64 md:w-72", // Larghezze responsive
                      snapshot.isDraggingOver ? "bg-primary/10 dark:bg-primary/20" : "bg-muted/50 dark:bg-muted/30",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 rounded-t-md mb-2 sticky top-0 z-10 flex items-center justify-between",
                        column.colorClass,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <column.icon className="h-5 w-5" />
                        <h3 className="font-semibold text-sm truncate">{column.title}</h3>
                      </div>
                      <Badge variant="secondary" className="ml-2 text-xs bg-white/20 text-inherit">
                        {column.items.length}
                      </Badge>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 px-2 pb-2 custom-scrollbar">
                      {column.items.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground bg-background/30 dark:bg-background/10 rounded-md border border-dashed mt-2">
                          Nessun task
                        </div>
                      )}
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(providedDraggable, snapshotDraggable) => (
                            <Link href={`/data-explorer/todolist/${item.dbId}`} passHref legacyBehavior>
                              <a
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                className={cn(
                                  "p-2.5 rounded-md border bg-card shadow-sm block cursor-pointer hover:shadow-md transition-shadow",
                                  snapshotDraggable.isDragging && "shadow-xl ring-2 ring-primary scale-105 opacity-95",
                                )}
                                onClick={(e) => {
                                  if (snapshotDraggable.isDragging) e.preventDefault()
                                }}
                              >
                                <div
                                  {...providedDraggable.dragHandleProps}
                                  className="flex items-start mb-1.5 cursor-grab active:cursor-grabbing"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="h-4 w-4 mr-1.5 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
                                  <h4
                                    className="font-medium text-sm leading-tight line-clamp-2 flex-grow"
                                    title={item.titolo}
                                  >
                                    {item.titolo}
                                  </h4>
                                </div>
                                <div className="ml-[calc(1rem+0.375rem)] text-xs space-y-1">
                                  {" "}
                                  {/* ml-5.5 approx */}
                                  {item.scadenza &&
                                    column.id !== "completati" && ( // Corretto: scadenza invece di data_scadenza
                                      <Badge variant="outline" className="text-xs py-0.5 px-1.5 font-normal">
                                        <CalendarDays className="h-3 w-3 mr-1" />
                                        {formatDateDisplay(item.scadenza)}{" "}
                                        {/* Corretto: scadenza invece di data_scadenza */}
                                      </Badge>
                                    )}
                                  {item.priorita && (
                                    <Badge variant="secondary" className="text-xs py-0.5 px-1.5 font-normal">
                                      Priorità: {item.priorita}
                                    </Badge>
                                  )}
                                </div>
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
          {columns.reduce((acc, col) => acc + col.items.length, 0) > 0 &&
            columns.length * (baseColWidth + responsiveGap) >
              (typeof window !== "undefined" ? window.innerWidth : 1024) && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md pointer-events-none opacity-75">
                ← Scorri →
              </div>
            )}
        </DragDropContext>
      </CardContent>
    </Card>
  )
}
