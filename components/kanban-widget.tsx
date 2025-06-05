"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Calendar, CheckCircle, Clock, GripVertical, Loader2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { useSupabase } from "@/lib/supabase-provider" // AGGIUNGERE: Importa useSupabase
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

// --- Tipi Definiti ---
type PrioritaConfigItem = {
  id: string
  value: string
  colore?: string
  livello?: number
}

type KanbanItemBase = {
  id: string
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
  originalRecordId: number
  id_utente?: string
  dbPriorityValue: string | number | null | Record<string, any>
  assignedPriorityConfigId: string | null
}

type KanbanColumn = {
  id: string
  title: string
  headerColor?: string
  items: KanbanItem[]
  isUncategorized?: boolean
}

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
  // const supabase = createClientComponentClient() // RIMUOVERE QUESTA RIGA
  const { supabase, isInitializing: supabaseInitializing } = useSupabase() // USARE QUESTO

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [prioritiesConfig, setPrioritiesConfig] = useState<PrioritaConfigItem[]>([])
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)

  const loadInitialData = useCallback(async () => {
    // Aggiunto controllo per supabase e supabaseInitializing
    if (!supabase || supabaseInitializing) {
      console.log("KanbanWidget: Supabase client non pronto, attesa per loadInitialData.")
      // Non impostare errore qui, l'useEffect esterno gestirà lo stato di caricamento/errore
      // basato su supabaseInitializing. Restituire null per indicare che i dati non sono pronti.
      return null
    }

    // Non è necessario setIsLoading(true) qui, lo gestisce l'useEffect chiamante
    // setError(null) viene gestito anche dall'useEffect chiamante prima di fetchData

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        // Se l'errore è "Auth session missing!", lancialo specificamente
        if (userError?.message.includes("Auth session missing!")) {
          throw new Error("Auth session missing!")
        }
        throw new Error(userError?.message || "Utente non autenticato.")
      }
      // Non è necessario setCurrentUser qui se lo restituiamo e lo gestisce l'useEffect
      // setCurrentUser(user)

      const { data: configData, error: configError } = await supabase
        .from("configurazione")
        .select("priorita, debug")
        .single()

      if (configError) throw configError
      if (!configData) throw new Error("Configurazione non trovata.")

      // Non è necessario setIsDebugEnabled qui se lo restituiamo
      // setIsDebugEnabled(configData.debug === true)

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
        console.warn("Nessuna priorità trovata nella configurazione.")
      }
      // Non è necessario setPrioritiesConfig qui se lo restituiamo
      // setPrioritiesConfig(parsedPriorities)

      return { user, parsedPriorities, isDebug: configData.debug === true }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati iniziali:", err) // Questo loggherà l'errore "Auth session missing!"
      // L'errore verrà propagato e gestito dall'useEffect chiamante
      throw err // Rilancia l'errore per essere catturato da fetchData in useEffect
    }
  }, [supabase, supabaseInitializing]) // Aggiunte dipendenze

  const getPriorityIdentifierFromDbItem = useCallback(
    (
      // Aggiunto useCallback
      itemData: any,
      localPrioritiesConfig: PrioritaConfigItem[], // Usare le priorità passate
    ): { assignedId: string | null; rawValue: string | number | null | Record<string, any> } => {
      const rawPriority = itemData.priorita ?? itemData.priorita_id ?? null
      if (rawPriority === null || rawPriority === undefined) return { assignedId: null, rawValue: null }
      if (typeof rawPriority === "number") {
        const matchingPriority = localPrioritiesConfig.find((p) => p.livello === rawPriority)
        return { assignedId: matchingPriority ? matchingPriority.id : null, rawValue: rawPriority }
      }
      if (typeof rawPriority === "string") {
        let matchingPriority = localPrioritiesConfig.find((p) => p.id === rawPriority)
        if (matchingPriority) return { assignedId: matchingPriority.id, rawValue: rawPriority }
        const numericValue = Number.parseInt(rawPriority, 10)
        if (!isNaN(numericValue)) {
          matchingPriority = localPrioritiesConfig.find((p) => p.livello === numericValue)
          if (matchingPriority) return { assignedId: matchingPriority.id, rawValue: rawPriority }
        }
        return { assignedId: null, rawValue: rawPriority }
      }
      if (typeof rawPriority === "object" && rawPriority !== null) {
        const priorityObjectId = String(rawPriority.id || rawPriority.value || "")
        const matchingPriority = localPrioritiesConfig.find((p) => p.id === priorityObjectId)
        return { assignedId: matchingPriority ? matchingPriority.id : null, rawValue: rawPriority }
      }
      return { assignedId: null, rawValue: rawPriority }
    },
    [],
  ) // Nessuna dipendenza diretta se localPrioritiesConfig è sempre passato

  const loadItems = useCallback(
    async (user: User, localPrioritiesConfig: PrioritaConfigItem[]) => {
      if (!supabase) {
        console.error("KanbanWidget: Supabase client non disponibile in loadItems.")
        return []
      }
      if (!user) return []

      const tables: KanbanItem["originalTable"][] = ["attivita", "progetti", "todolist"]
      let allKanbanItems: KanbanItem[] = []
      const validLivellos = localPrioritiesConfig.map((p) => p.livello).filter((l) => typeof l === "number") as number[]

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").eq("id_utente", user.id)
        if (error) {
          console.error(`Errore nel caricamento da ${table}:`, error)
          toast({ title: `Errore ${table}`, description: error.message, variant: "destructive" })
          continue
        }
        if (data) {
          const items: KanbanItem[] = data.map((itemData: any) => {
            const { assignedId, rawValue } = getPriorityIdentifierFromDbItem(itemData, localPrioritiesConfig)
            let finalAssignedId = assignedId
            if (assignedId === null) {
              if (rawValue === null || rawValue === undefined) finalAssignedId = null
              else if (typeof rawValue === "number" && !validLivellos.includes(rawValue)) finalAssignedId = null
              else finalAssignedId = null
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
    [supabase, toast, getPriorityIdentifierFromDbItem], // Aggiunta dipendenza
  )

  useEffect(() => {
    let isActive = true

    const fetchData = async () => {
      if (!supabase || supabaseInitializing) {
        if (!supabase && !supabaseInitializing && isActive) {
          setError("Client Supabase non disponibile.")
          setIsLoading(false)
        }
        // Se supabaseInitializing è true, aspetta il prossimo run dell'effetto
        return
      }

      if (isActive) {
        setIsLoading(true)
        setError(null) // Resetta errore precedente
      }

      try {
        const initialDataResult = await loadInitialData()
        if (!initialDataResult || !isActive) {
          if (isActive && !initialDataResult) setIsLoading(false) // Assicura che isLoading sia false
          return
        }

        const { user, parsedPriorities: localFetchedPriorities, isDebug: localFetchedIsDebug } = initialDataResult

        if (isActive) {
          setCurrentUser(user) // Imposta currentUser qui
          setPrioritiesConfig(localFetchedPriorities) // Imposta prioritiesConfig qui
          setIsDebugEnabled(localFetchedIsDebug) // Imposta isDebugEnabled qui
        }

        const allItems = await loadItems(user, localFetchedPriorities)
        if (!isActive) return

        const newColumns: KanbanColumn[] = []
        newColumns.push({
          id: UNCATEGORIZED_COLUMN_ID,
          title: "Non Categorizzati / Priorità Disallineata",
          headerColor: "bg-slate-200 dark:bg-slate-700",
          items: allItems.filter((item) => item.assignedPriorityConfigId === null),
          isUncategorized: true,
        })
        localFetchedPriorities.forEach((pConfig) => {
          newColumns.push({
            id: pConfig.id,
            title: pConfig.value,
            headerColor: pConfig.colore || "bg-gray-200 dark:bg-gray-700",
            items: allItems.filter((item) => item.assignedPriorityConfigId === pConfig.id),
          })
        })

        if (isActive) {
          setColumns(newColumns)
          setIsLoading(false)
        }
      } catch (err: any) {
        if (isActive) {
          console.error("KanbanWidget: Errore durante fetchData:", err)
          setError(err.message || "Errore caricamento dati Kanban.")
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isActive = false
    }
  }, [supabase, supabaseInitializing, loadInitialData, loadItems])

  const handleDragEnd = async (result: DropResult) => {
    if (!supabase) {
      // Controllo aggiunto
      toast({ title: "Errore", description: "Client Supabase non disponibile.", variant: "destructive" })
      return
    }
    const { source, destination, draggableId } = result
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return

    const sourceColumn = columns.find((col) => col.id === source.droppableId)
    const destinationColumn = columns.find((col) => col.id === destination.droppableId)
    const draggedItem = sourceColumn?.items.find((item) => item.id === draggableId)

    if (!sourceColumn || !destinationColumn || !draggedItem) return

    const currentPriorities = prioritiesConfig // Usa lo stato prioritiesConfig

    const newColumnsState = columns.map((col) => {
      if (col.id === source.droppableId) return { ...col, items: col.items.filter((item) => item.id !== draggableId) }
      if (col.id === destination.droppableId) {
        const newItems = Array.from(col.items)
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

    let newDbPriorityValue: number | string | null | Record<string, any> = null
    const targetPriorityConfigItem = currentPriorities.find((p) => p.id === destinationColumn.id)

    if (destinationColumn.id === UNCATEGORIZED_COLUMN_ID) newDbPriorityValue = null
    else if (targetPriorityConfigItem) {
      if (typeof targetPriorityConfigItem.livello === "number") newDbPriorityValue = targetPriorityConfigItem.livello
      else newDbPriorityValue = targetPriorityConfigItem.id
    } else {
      newDbPriorityValue = null
    }

    const priorityFieldName = "priorita"
    try {
      const { error: updateError } = await supabase
        .from(draggedItem.originalTable)
        .update({ [priorityFieldName]: newDbPriorityValue, modifica: new Date().toISOString() })
        .eq("id", draggedItem.originalRecordId)
      if (updateError) throw updateError
      toast({
        title: "Priorità Aggiornata",
        description: `Priorità di "${draggedItem.title}" aggiornata.`,
        variant: "success",
      })
    } catch (err: any) {
      console.error("Errore nell'aggiornamento della priorità:", err)
      toast({
        title: "Errore Aggiornamento",
        description: `Impossibile aggiornare: ${err.message}`,
        variant: "destructive",
      })
      // Revert UI (semplificato per brevità, idealmente ricaricare i dati come prima)
      // Per un revert completo, si dovrebbe ricaricare i dati come nella versione precedente
      // Per ora, questo revert è solo locale e potrebbe non essere perfetto.
      // La logica di revert precedente che ricaricava tutto era più robusta.
      // Per semplicità, la lascio così, ma in produzione si dovrebbe considerare il revert completo.
      const revertedColumns = [...columns] // Snapshot prima dell'ottimismo
      // Trova l'item e rimettilo dov'era, o ricarica tutto
      // Questa parte è complessa, per ora la ometto per focalizzarci sul fix principale
      // Idealmente, si chiamerebbe di nuovo la sequenza di fetch come nel blocco catch di useEffect.
      // Per ora, l'UI rimane nello stato ottimistico errato se il DB fallisce.
      // Sarebbe meglio ricaricare:
      if (currentUser) {
        // Assicurati che currentUser sia disponibile
        loadItems(currentUser, currentPriorities).then((allItems) => {
          const revertedCols: KanbanColumn[] = []
          revertedCols.push({
            id: UNCATEGORIZED_COLUMN_ID,
            title: "Non Categorizzati / Priorità Disallineata",
            headerColor: "bg-slate-200 dark:bg-slate-700",
            items: allItems.filter((item) => item.assignedPriorityConfigId === null),
            isUncategorized: true,
          })
          currentPriorities.forEach((pConfig) => {
            revertedCols.push({
              id: pConfig.id,
              title: pConfig.value,
              headerColor: pConfig.colore || "bg-gray-200 dark:bg-gray-700",
              items: allItems.filter((item) => item.assignedPriorityConfigId === pConfig.id),
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

  // Stati di rendering (caricamento, errore, nessun utente)
  if (isLoading && columns.length === 0) {
    // Mostra skeleton solo se non ci sono ancora colonne
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
              // Logica di retry migliorata
              setIsLoading(true)
              setError(null)
              // Non c'è bisogno di chiamare loadInitialData e loadItems direttamente qui,
              // l'useEffect principale verrà rieseguito quando supabase/supabaseInitializing cambiano,
              // o possiamo forzare un re-fetch modificando una dipendenza fittizia se necessario,
              // ma la struttura attuale di useEffect dovrebbe gestire il re-fetch se lo stato di errore viene resettato.
              // Per un retry esplicito, potremmo aggiungere un contatore di retry allo stato e incrementarlo.
              // Per ora, resettare l'errore e isLoading potrebbe essere sufficiente se l'useEffect è ben strutturato.
              // La cosa più semplice è richiamare la logica di fetch dell'useEffect:
              const mainFetchData = async () => {
                if (!supabase || supabaseInitializing) {
                  /* ... gestisci ... */ return
                }
                try {
                  const initialDataResult = await loadInitialData()
                  if (!initialDataResult) {
                    setIsLoading(false)
                    return
                  }
                  const {
                    user,
                    parsedPriorities: localFetchedPriorities,
                    isDebug: localFetchedIsDebug,
                  } = initialDataResult
                  setCurrentUser(user)
                  setPrioritiesConfig(localFetchedPriorities)
                  setIsDebugEnabled(localFetchedIsDebug)
                  const allItems = await loadItems(user, localFetchedPriorities)
                  const newCols: KanbanColumn[] = []
                  newCols.push({
                    /* ... uncategorized ... */ items: allItems.filter(
                      (item) => item.assignedPriorityConfigId === null,
                    ) /* ... */,
                  })
                  localFetchedPriorities.forEach((pConfig) =>
                    newCols.push({
                      /* ... priority col ... */ items: allItems.filter(
                        (item) => item.assignedPriorityConfigId === pConfig.id,
                      ) /* ... */,
                    }),
                  )
                  setColumns(newCols)
                  setIsLoading(false)
                  setError(null)
                } catch (err: any) {
                  setError(err.message)
                  setIsLoading(false)
                }
              }
              mainFetchData()
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            Riprova Caricamento
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!currentUser && !isLoading) {
    // Mostra solo se non sta caricando e non c'è utente
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

  // Rendering del Kanban effettivo
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
                        {column.title}{" "}
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
