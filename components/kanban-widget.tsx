"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Calendar, CheckCircle, Clock, GripVertical, Loader2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

// --- Tipi Definiti ---
type PrioritaConfigItem = {
  id: string // Identificatore unico testuale (es. "alta", "p1")
  value: string // Nome visualizzato (es. "Alta Priorità")
  colore?: string // Colore per l'intestazione della colonna (es. "bg-red-500", "#FF0000")
  livello?: number // Livello numerico della priorità
}

type KanbanItemBase = {
  id: string // ID unico per D&D (es. "attivita-123")
  title: string
  description?: string
  colore?: string // Colore specifico dell'item (diverso dal colore della tabella)
  data_inizio?: string | Date | null
  data_fine?: string | Date | null
  scadenza?: string | Date | null
  stato?: string
  avanzamento?: number
}

type KanbanItem = KanbanItemBase & {
  originalTable: "attivita" | "progetti" | "todolist"
  originalRecordId: number // ID del record nella tabella originale
  id_utente?: string
  // Valore grezzo della priorità dal DB per debug e logica di assegnazione iniziale
  dbPriorityValue: string | number | null | Record<string, any>
  // ID della PrioritaConfigItem a cui è assegnato, o 'uncategorized'
  assignedPriorityConfigId: string | null
}

type KanbanColumn = {
  id: string // Corrisponde a PrioritaConfigItem.id o "uncategorized"
  title: string
  headerColor?: string // Colore per l'intestazione della colonna
  items: KanbanItem[]
  isUncategorized?: boolean // Flag per la colonna speciale
}

// Mapping dei colori pastello per tipo di elemento
const PASTEL_COLORS: Record<KanbanItem["originalTable"], string> = {
  attivita: "bg-sky-100 border-sky-300 text-sky-800",
  progetti: "bg-purple-100 border-purple-300 text-purple-800",
  todolist: "bg-emerald-100 border-emerald-300 text-emerald-800",
}

const UNCATEGORIZED_COLUMN_ID = "uncategorized"

export function KanbanWidget() {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [prioritiesConfig, setPrioritiesConfig] = useState<PrioritaConfigItem[]>([])
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)

  // Funzione per caricare utente, configurazione e priorità
  const loadInitialData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Fetch authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error(userError?.message || "Utente non autenticato.")
      }
      setCurrentUser(user)

      // 2. Fetch configurazione (priorita e debug)
      const { data: configData, error: configError } = await supabase
        .from("configurazione")
        .select("priorita, debug")
        .single()

      if (configError) throw configError
      if (!configData) throw new Error("Configurazione non trovata.")

      setIsDebugEnabled(configData.debug === true)

      // 3. Parse configurazione.priorita
      let parsedPriorities: PrioritaConfigItem[] = []
      if (Array.isArray(configData.priorita)) {
        parsedPriorities = configData.priorita.map((p: any, index: number) => ({
          id: String(p.id || p.value || `p-${index}`),
          value: String(p.value || p.nome || "N/D"),
          colore: p.colore,
          livello: typeof p.livello === "number" ? p.livello : p.id && !isNaN(Number(p.id)) ? Number(p.id) : undefined,
        }))
      } else if (typeof configData.priorita === "object" && configData.priorita !== null) {
        parsedPriorities = Object.entries(configData.priorita).map(([key, p]: [string, any]) => ({
          id: String(p.id || key),
          value: String(p.value || p.nome || "N/D"),
          colore: p.colore,
          livello: typeof p.livello === "number" ? p.livello : p.id && !isNaN(Number(p.id)) ? Number(p.id) : undefined,
        }))
      }
      if (parsedPriorities.length === 0) {
        console.warn(
          "Nessuna priorità trovata nella configurazione. Sarà presente solo la colonna 'Non Categorizzati'.",
        )
      }
      setPrioritiesConfig(parsedPriorities)
      return { user, parsedPriorities, isDebug: configData.debug === true }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati iniziali:", err)
      setError(`Errore dati iniziali: ${err.message}`)
      setIsLoading(false) // Assicurati che isLoading sia false in caso di errore qui
      return null
    }
  }, [supabase])

  // Funzione per normalizzare il campo priorita di un item del DB
  const getPriorityIdentifierFromDbItem = (
    itemData: any,
    parsedPriorities: PrioritaConfigItem[],
  ): { assignedId: string | null; rawValue: string | number | null | Record<string, any> } => {
    const rawPriority =
      itemData.priorita ?? // Questo potrebbe essere 'priorita_id' per todolist, o 'priorita' per altri
      itemData.priorita_id ?? // Specifico per todolist se 'priorita' non c'è
      null

    if (rawPriority === null || rawPriority === undefined) {
      return { assignedId: null, rawValue: null }
    }

    // Caso 1: rawPriority è un numero (probabilmente un 'livello')
    if (typeof rawPriority === "number") {
      const matchingPriority = parsedPriorities.find((p) => p.livello === rawPriority)
      return { assignedId: matchingPriority ? matchingPriority.id : null, rawValue: rawPriority }
    }

    // Caso 2: rawPriority è una stringa (potrebbe essere un ID di priorità o un livello come stringa)
    if (typeof rawPriority === "string") {
      // Prova a matchare con id
      let matchingPriority = parsedPriorities.find((p) => p.id === rawPriority)
      if (matchingPriority) {
        return { assignedId: matchingPriority.id, rawValue: rawPriority }
      }
      // Prova a matchare con livello (se la stringa è numerica)
      const numericValue = Number.parseInt(rawPriority, 10)
      if (!isNaN(numericValue)) {
        matchingPriority = parsedPriorities.find((p) => p.livello === numericValue)
        if (matchingPriority) {
          return { assignedId: matchingPriority.id, rawValue: rawPriority }
        }
      }
      return { assignedId: null, rawValue: rawPriority } // Non corrisponde a nulla, ma ha un valore
    }

    // Caso 3: rawPriority è un oggetto (es. {id: "p1", value: "Alta"})
    if (typeof rawPriority === "object" && rawPriority !== null) {
      const priorityObjectId = String(rawPriority.id || rawPriority.value || "")
      const matchingPriority = parsedPriorities.find((p) => p.id === priorityObjectId)
      return { assignedId: matchingPriority ? matchingPriority.id : null, rawValue: rawPriority }
    }

    return { assignedId: null, rawValue: rawPriority } // Default se non riconosciuto
  }

  // Funzione per caricare gli elementi dalle tabelle
  const loadItems = useCallback(
    async (user: User, parsedPriorities: PrioritaConfigItem[]) => {
      if (!user) return [] // Non caricare item se l'utente non è definito

      const tables: KanbanItem["originalTable"][] = ["attivita", "progetti", "todolist"]
      let allKanbanItems: KanbanItem[] = []
      const validLivellos = parsedPriorities.map((p) => p.livello).filter((l) => typeof l === "number") as number[]

      for (const table of tables) {
        // Assicurati che la tabella abbia id_utente prima di filtrare
        // Questo controllo andrebbe fatto sulla base dello schema reale o configurazione
        // Per ora, assumiamo che tutte e tre le tabelle abbiano id_utente come richiesto
        const { data, error } = await supabase.from(table).select("*").eq("id_utente", user.id)

        if (error) {
          console.error(`Errore nel caricamento da ${table}:`, error)
          // Continua con le altre tabelle invece di bloccare tutto
          toast({ title: `Errore ${table}`, description: error.message, variant: "destructive" })
          continue
        }

        if (data) {
          const items: KanbanItem[] = data.map((itemData: any) => {
            const { assignedId, rawValue } = getPriorityIdentifierFromDbItem(itemData, parsedPriorities)

            let finalAssignedId = assignedId
            // Logica per la colonna "Non Categorizzati"
            if (assignedId === null) {
              // Se non c'è un match diretto con le priorità configurate
              if (rawValue === null || rawValue === undefined) {
                // Priorità non impostata
                finalAssignedId = null // Va in non categorizzati
              } else if (typeof rawValue === "number" && !validLivellos.includes(rawValue)) {
                // Priorità numerica ma non corrisponde a nessun livello valido
                finalAssignedId = null // Va in non categorizzati
              } else {
                // Ha un valore di priorità ma non mappato (es. stringa non riconosciuta)
                // Potrebbe comunque andare in non categorizzati o una colonna "errori"
                finalAssignedId = null
              }
            }

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
              assignedPriorityConfigId: finalAssignedId,
            }
          })
          allKanbanItems = [...allKanbanItems, ...items]
        }
      }
      return allKanbanItems
    },
    [supabase, toast],
  )

  // Effetto principale per caricare tutto e costruire le colonne
  useEffect(() => {
    loadInitialData().then((initialDataResults) => {
      if (!initialDataResults) {
        // Errore gestito in loadInitialData, isLoading è già false
        return
      }
      const { user, parsedPriorities } = initialDataResults

      loadItems(user, parsedPriorities)
        .then((allItems) => {
          // Costruisci le colonne
          const newColumns: KanbanColumn[] = []

          // Colonna "Non Categorizzati / Priorità Disallineata"
          newColumns.push({
            id: UNCATEGORIZED_COLUMN_ID,
            title: "Non Categorizzati / Priorità Disallineata",
            headerColor: "bg-slate-200 dark:bg-slate-700",
            items: allItems.filter((item) => item.assignedPriorityConfigId === null),
            isUncategorized: true,
          })

          // Colonne per ogni priorità configurata
          parsedPriorities.forEach((pConfig) => {
            newColumns.push({
              id: pConfig.id,
              title: pConfig.value,
              headerColor: pConfig.colore || "bg-gray-200 dark:bg-gray-700",
              items: allItems.filter((item) => item.assignedPriorityConfigId === pConfig.id),
            })
          })

          setColumns(newColumns)
          setIsLoading(false)
        })
        .catch((itemError) => {
          console.error("Errore nel caricamento degli items:", itemError)
          setError(`Errore items: ${itemError.message}`)
          setIsLoading(false)
        })
    })
  }, [loadInitialData, loadItems]) // Aggiunto loadItems alle dipendenze

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId)
    const destinationColumn = columns.find((col) => col.id === destination.droppableId)
    const draggedItem = sourceColumn?.items.find((item) => item.id === draggableId)

    if (!sourceColumn || !destinationColumn || !draggedItem) {
      console.error("Item o colonna non trovata durante D&D", { sourceColumn, destinationColumn, draggedItem })
      return
    }

    // Aggiornamento ottimistico dell'UI
    const newColumnsState = columns.map((col) => {
      if (col.id === source.droppableId) {
        return { ...col, items: col.items.filter((item) => item.id !== draggableId) }
      }
      if (col.id === destination.droppableId) {
        const newItems = Array.from(col.items)
        // Aggiorna l'assignedPriorityConfigId dell'item spostato
        const updatedDraggedItem = {
          ...draggedItem,
          assignedPriorityConfigId: destinationColumn.id === UNCATEGORIZED_COLUMN_ID ? null : destinationColumn.id,
        }
        newItems.splice(destination.index, 0, updatedDraggedItem)
        return { ...col, items: newItems }
      }
      return col
    })
    setColumns(newColumnsState)

    // Preparazione aggiornamento DB
    let newDbPriorityValue: number | string | null | Record<string, any> = null
    const targetPriorityConfig = prioritiesConfig.find((p) => p.id === destinationColumn.id)

    if (destinationColumn.id === UNCATEGORIZED_COLUMN_ID) {
      newDbPriorityValue = null
    } else if (targetPriorityConfig) {
      // Privilegia 'livello' se numerico, altrimenti 'id' se la tabella lo accetta, o l'oggetto intero
      // Questa logica deve corrispondere a come la tabella 'draggedItem.originalTable' si aspetta la priorità
      if (typeof targetPriorityConfig.livello === "number") {
        newDbPriorityValue = targetPriorityConfig.livello
      } else {
        // Se la tabella si aspetta un oggetto JSON per la priorità:
        // newDbPriorityValue = { id: targetPriorityConfig.id, value: targetPriorityConfig.value };
        // Se la tabella si aspetta l'ID stringa:
        newDbPriorityValue = targetPriorityConfig.id
        // Per ora, assumiamo che la tabella accetti il 'livello' o l'ID stringa.
        // Se la tabella 'todolist' ha campi separati priorita_id, priorita_value, la logica qui deve cambiare.
        // La richiesta originale implicava che attivita.priorita, todolist.priorita, progetti.priorita fossero i campi diretti.
      }
    } else {
      console.warn(`Configurazione priorità non trovata per destinazione ${destinationColumn.id}`)
      // Potrebbe essere necessario revertire l'UI se non si sa cosa salvare
      // Per ora, si procede con null se la config non è trovata (simile a non categorizzato)
      newDbPriorityValue = null
    }

    // Determina il nome corretto del campo priorità per la tabella specifica
    const priorityFieldName = "priorita" // Default
    // if (draggedItem.originalTable === 'todolist') {
    //   // Se todolist usa priorita_id e priorita_value, la logica di update è più complessa
    //   // Per ora, si assume un campo 'priorita' unificato come da richiesta
    // }

    try {
      const { error: updateError } = await supabase
        .from(draggedItem.originalTable)
        .update({
          [priorityFieldName]: newDbPriorityValue,
          modifica: new Date().toISOString(),
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
        description: `Impossibile aggiornare: ${err.message}`,
        variant: "destructive",
      })
      // Revert UI (ricaricando i dati)
      loadInitialData().then((initialDataResults) => {
        if (!initialDataResults) return
        loadItems(initialDataResults.user, initialDataResults.parsedPriorities).then((allItems) => {
          const revertedColumns: KanbanColumn[] = []
          revertedColumns.push({
            id: UNCATEGORIZED_COLUMN_ID,
            title: "Non Categorizzati / Priorità Disallineata",
            headerColor: "bg-slate-200 dark:bg-slate-700",
            items: allItems.filter((item) => item.assignedPriorityConfigId === null),
            isUncategorized: true,
          })
          prioritiesConfig.forEach((pConfig) => {
            revertedColumns.push({
              id: pConfig.id,
              title: pConfig.value,
              headerColor: pConfig.colore || "bg-gray-200 dark:bg-gray-700",
              items: allItems.filter((item) => item.assignedPriorityConfigId === pConfig.id),
            })
          })
          setColumns(revertedColumns)
        })
      })
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
          <CardTitle className="flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Caricamento Kanban...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-72 md:w-80">
                <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
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
      <Card className="w-full bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Errore Kanban</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true) // Set loading true before retrying
              loadInitialData().then((initialDataResults) => {
                if (!initialDataResults) {
                  setIsLoading(false)
                  return
                } // Error handled in loadInitialData
                loadItems(initialDataResults.user, initialDataResults.parsedPriorities)
                  .then((allItems) => {
                    const newCols: KanbanColumn[] = []
                    newCols.push({
                      id: UNCATEGORIZED_COLUMN_ID,
                      title: "Non Categorizzati / Priorità Disallineata",
                      headerColor: "bg-slate-200 dark:bg-slate-700",
                      items: allItems.filter((item) => item.assignedPriorityConfigId === null),
                      isUncategorized: true,
                    })
                    prioritiesConfig.forEach((pConfig) => {
                      newCols.push({
                        id: pConfig.id,
                        title: pConfig.value,
                        headerColor: pConfig.colore || "bg-gray-200 dark:bg-gray-700",
                        items: allItems.filter((item) => item.assignedPriorityConfigId === pConfig.id),
                      })
                    })
                    setColumns(newCols)
                    setError(null) // Clear error on successful retry
                  })
                  .catch((itemErr) => setError(`Errore ricaricando items: ${itemErr.message}`))
                  .finally(() => setIsLoading(false))
              })
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            Riprova Caricamento
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!currentUser) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Kanban Priorità</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Per favore, effettua il login per visualizzare il Kanban.</p>
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
                      "flex-shrink-0 w-72 md:w-80 rounded-lg p-1 flex flex-col", // p-1 for tighter packing
                      snapshot.isDraggingOver ? "bg-primary/10" : "bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 rounded-t-md mb-2 sticky top-0 z-10",
                        column.headerColor || "bg-gray-200 dark:bg-gray-800",
                      )}
                    >
                      <h3 className="font-semibold text-sm text-foreground truncate flex items-center justify-between">
                        {column.title}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {column.items.length}
                        </Badge>
                      </h3>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-2 px-2 pb-2 custom-scrollbar">
                      {column.items.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground bg-background/30 rounded-md border border-dashed mt-2">
                          Nessun elemento
                        </div>
                      )}
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(providedDraggable, snapshotDraggable) => (
                            <div
                              ref={providedDraggable.innerRef}
                              {...providedDraggable.draggableProps}
                              className={cn(
                                "p-2.5 rounded-md border bg-card shadow-sm",
                                PASTEL_COLORS[item.originalTable],
                                snapshotDraggable.isDragging && "shadow-xl ring-2 ring-primary scale-105",
                              )}
                            >
                              <div
                                {...providedDraggable.dragHandleProps}
                                className="flex items-center mb-1 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 mr-1.5 text-muted-foreground/70" />
                                <h4
                                  className="font-medium text-sm leading-tight line-clamp-2 flex-grow"
                                  title={item.title}
                                >
                                  {item.title}
                                </h4>
                              </div>

                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 my-1.5">{item.description}</p>
                              )}

                              <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs">
                                {item.stato && (
                                  <Badge variant="outline" className="text-xs py-0.5 px-1.5 bg-background/70">
                                    {item.stato}
                                  </Badge>
                                )}
                                {item.avanzamento !== undefined && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0.5 px-1.5 bg-background/70 flex items-center gap-1"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    {item.avanzamento}%
                                  </Badge>
                                )}
                                {(item.scadenza || item.data_fine) && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0.5 px-1.5 bg-background/70 flex items-center gap-1"
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(item.scadenza || item.data_fine)}
                                  </Badge>
                                )}
                                {item.data_inizio && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0.5 px-1.5 bg-background/70 flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {formatDate(item.data_inizio)}
                                  </Badge>
                                )}
                              </div>
                              {isDebugEnabled &&
                                item.dbPriorityValue !== null &&
                                item.dbPriorityValue !== undefined && (
                                  <p className="text-xs text-muted-foreground/80 mt-1.5 pt-1 border-t border-dashed">
                                    Prio. DB:{" "}
                                    {typeof item.dbPriorityValue === "object"
                                      ? JSON.stringify(item.dbPriorityValue)
                                      : String(item.dbPriorityValue)}
                                  </p>
                                )}
                            </div>
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
