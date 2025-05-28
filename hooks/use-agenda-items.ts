"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { useGeneralDeadlines, normalizeDeadlineDate } from "./use-general-deadlines"

// Definizione del tipo per gli elementi dell'agenda
export interface AgendaItem {
  id: number
  titolo: string
  descrizione?: string
  data_inizio: Date
  data_fine?: Date
  data_scadenza?: Date
  priorita?: string
  stato?: string
  cliente?: string
  tipo: "attivita" | "progetto" | "appuntamento" | "scadenza" | "todolist"
  colore: string
  tabella_origine: string
  id_origine: number
  generale: boolean
}

export function useAgendaItems(startDate: Date, endDate: Date) {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [items, setItems] = useState<AgendaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tableStats, setTableStats] = useState<Record<string, number>>({})
  const [rawData, setRawData] = useState<any[]>([]) // Per debug

  // Ottieni le scadenze generali
  const {
    items: scadenzeGenerali,
    isLoading: isLoadingScadenzeGenerali,
    error: errorScadenzeGenerali,
    rawData: rawScadenzeGenerali,
  } = useGeneralDeadlines(startDate, endDate)

  // Log di debug per le scadenze generali
  useEffect(() => {
    console.log("useAgendaItems - Scadenze generali:", {
      count: scadenzeGenerali.length,
      isLoading: isLoadingScadenzeGenerali,
      error: errorScadenzeGenerali?.message,
      items: scadenzeGenerali.slice(0, 3), // Primi 3 elementi per brevità
      rawData: rawScadenzeGenerali?.slice(0, 3), // Primi 3 elementi raw per brevità
    })
  }, [scadenzeGenerali, isLoadingScadenzeGenerali, errorScadenzeGenerali, rawScadenzeGenerali])

  useEffect(() => {
    if (!supabase || !user || !startDate || !endDate) {
      setItems([])
      setIsLoading(false)
      return
    }

    const fetchItems = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log(`Fetching agenda items from ${startDate.toISOString()} to ${endDate.toISOString()}`)

        // Formatta le date per la query SQL
        // Usiamo solo la parte della data (YYYY-MM-DD) per le query SQL
        // ma assicuriamoci di includere l'intera giornata
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        console.log("Date formattate per query SQL:", {
          startDateStr,
          endDateStr,
          startDateOriginal: startDate.toISOString(),
          endDateOriginal: endDate.toISOString(),
          startDateHours: startDate.getHours(),
          startDateMinutes: startDate.getMinutes(),
          endDateHours: endDate.getHours(),
          endDateMinutes: endDate.getMinutes(),
        })

        // Array per raccogliere tutti gli elementi
        const allItems: AgendaItem[] = []
        const stats: Record<string, number> = {}
        const debugRawData: any[] = [] // Per debug

        // Elenco delle tabelle da controllare
        const tablesToCheck = ["attivita", "progetti", "appuntamenti", "scadenze", "todolist", "todo"]
        const existingTables: string[] = []

        // Verifichiamo quali tabelle esistono
        for (const tableName of tablesToCheck) {
          try {
            const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

            if (!error) {
              console.log(`Tabella ${tableName} esiste`)
              existingTables.push(tableName)
            }
          } catch (err) {
            console.log(`Tabella ${tableName} non esiste o non è accessibile`)
          }
        }

        console.log("Tabelle esistenti:", existingTables)

        // 1. Fetch attività - se esiste
        if (existingTables.includes("attivita")) {
          try {
            // Prima verifichiamo la struttura della tabella
            const { data: columns, error: columnsError } = await supabase.from("attivita").select("*").limit(1)

            if (columnsError) {
              console.error("Errore nel recupero della struttura della tabella attività:", columnsError)
            } else {
              console.log("Struttura tabella attività:", columns)

              // Costruiamo la query in base alle colonne disponibili
              let query = `data_inizio.lte.${endDateStr}`

              // Aggiungiamo data_fine solo se esiste
              if (columns && columns.length > 0 && "data_fine" in columns[0]) {
                query += `,data_fine.gte.${startDateStr}`
              }

              const { data: attivita, error: attivitaError } = await supabase
                .from("attivita")
                .select("*")
                .eq("id_utente", user.id)
                .or(query)

              if (attivitaError) {
                console.error("Errore nel recupero delle attività:", attivitaError)
              } else if (attivita && Array.isArray(attivita)) {
                console.log(`Trovate ${attivita.length} attività`)
                debugRawData.push(...attivita.map((item) => ({ ...item, tabella: "attivita" })))

                // Filtriamo le attività in base al periodo selezionato
                const filteredAttivita = attivita.filter((item) => {
                  const dataInizio = item.data_inizio ? new Date(item.data_inizio) : null
                  const dataFine = item.data_fine ? new Date(item.data_fine) : null

                  if (!dataInizio) return false

                  // Debug
                  console.log(`Attività ${item.id} - ${item.titolo || "Senza titolo"}:`, {
                    dataInizio: dataInizio ? dataInizio.toISOString() : null,
                    dataFine: dataFine ? dataFine.toISOString() : null,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    inRange:
                      (dataInizio >= startDate && dataInizio <= endDate) ||
                      (dataFine && dataFine >= startDate && dataFine <= endDate) ||
                      (dataInizio <= startDate && dataFine && dataFine >= endDate),
                  })

                  // Verifichiamo se l'attività rientra nel periodo selezionato
                  // Un'attività è visibile se:
                  // - La data di inizio è all'interno del periodo selezionato, OPPURE
                  // - La data di fine è all'interno del periodo selezionato, OPPURE
                  // - Il periodo selezionato è completamente all'interno del periodo dell'attività
                  return (
                    (dataInizio >= startDate && dataInizio <= endDate) ||
                    (dataFine && dataFine >= startDate && dataFine <= endDate) ||
                    (dataInizio <= startDate && dataFine && dataFine >= endDate)
                  )
                })

                console.log(`Dopo il filtro per data: ${filteredAttivita.length} attività`)
                stats["attivita"] = filteredAttivita.length

                const formattedAttivita = filteredAttivita.map((item) => {
                  return {
                    id: item.id,
                    titolo: item.titolo || item.nome || `Attività #${item.id}`,
                    descrizione: item.descrizione,
                    data_inizio: item.data_inizio ? new Date(item.data_inizio) : new Date(),
                    data_fine: item.data_fine ? new Date(item.data_fine) : undefined,
                    data_scadenza: undefined, // Non esiste nella tabella attivita
                    priorita: item.priorita,
                    stato: item.stato,
                    cliente: item.cliente || item.id_cli,
                    tipo: "attivita" as const,
                    colore: "#ffcdd2", // Rosso pastello
                    tabella_origine: "attivita",
                    id_origine: item.id,
                    generale: false,
                  }
                })

                allItems.push(...formattedAttivita)
              }
            }
          } catch (err) {
            console.error("Errore nella query attività:", err)
          }
        }

        // 2. Fetch progetti - se esiste
        if (existingTables.includes("progetti")) {
          try {
            // Prima verifichiamo la struttura della tabella
            const { data: columns, error: columnsError } = await supabase.from("progetti").select("*").limit(1)

            if (columnsError) {
              console.error("Errore nel recupero della struttura della tabella progetti:", columnsError)
            } else {
              console.log("Struttura tabella progetti:", columns)

              // Costruiamo la query in base alle colonne disponibili
              let query = `data_inizio.lte.${endDateStr}`

              // Aggiungiamo data_fine solo se esiste
              if (columns && columns.length > 0 && "data_fine" in columns[0]) {
                query += `,data_fine.gte.${startDateStr}`
              }

              // Aggiungiamo data_scadenza solo se esiste
              if (columns && columns.length > 0 && "data_scadenza" in columns[0]) {
                query += `,data_scadenza.gte.${startDateStr},data_scadenza.lte.${endDateStr}`
              }

              const { data: progetti, error: progettiError } = await supabase
                .from("progetti")
                .select("*")
                .eq("id_utente", user.id)
                .or(query)

              if (progettiError) {
                console.error("Errore nel recupero dei progetti:", progettiError)
              } else if (progetti && Array.isArray(progetti)) {
                console.log(`Trovati ${progetti.length} progetti`)
                debugRawData.push(...progetti.map((item) => ({ ...item, tabella: "progetti" })))

                // Filtriamo i progetti in base al periodo selezionato
                const filteredProgetti = progetti.filter((item) => {
                  const dataInizio = item.data_inizio ? new Date(item.data_inizio) : null
                  const dataFine = item.data_fine ? new Date(item.data_fine) : null

                  if (!dataInizio) return false

                  // Debug
                  console.log(`Progetto ${item.id} - ${item.titolo || "Senza titolo"}:`, {
                    dataInizio: dataInizio ? dataInizio.toISOString() : null,
                    dataFine: dataFine ? dataFine.toISOString() : null,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    inRange:
                      (dataInizio >= startDate && dataInizio <= endDate) ||
                      (dataFine && dataFine >= startDate && dataFine <= endDate) ||
                      (dataInizio <= startDate && dataFine && dataFine >= endDate),
                  })

                  // Verifichiamo se il progetto rientra nel periodo selezionato
                  return (
                    (dataInizio >= startDate && dataInizio <= endDate) ||
                    (dataFine && dataFine >= startDate && dataFine <= endDate) ||
                    (dataInizio <= startDate && dataFine && dataFine >= endDate)
                  )
                })

                console.log(`Dopo il filtro per data: ${filteredProgetti.length} progetti`)
                stats["progetti"] = filteredProgetti.length

                const formattedProgetti = filteredProgetti.map((item) => {
                  return {
                    id: item.id,
                    titolo: item.titolo || item.nome || `Progetto #${item.id}`,
                    descrizione: item.descrizione,
                    data_inizio: item.data_inizio ? new Date(item.data_inizio) : new Date(),
                    data_fine: item.data_fine ? new Date(item.data_fine) : undefined,
                    data_scadenza: item.data_scadenza ? normalizeDeadlineDate(new Date(item.data_scadenza)) : undefined,
                    priorita: item.priorita,
                    stato: item.stato,
                    cliente: item.cliente || item.id_cli,
                    tipo: "progetto" as const,
                    colore: "#bbdefb", // Blu pastello
                    tabella_origine: "progetti",
                    id_origine: item.id,
                    generale: false,
                  }
                })

                allItems.push(...formattedProgetti)
              }
            }
          } catch (err) {
            console.error("Errore nella query progetti:", err)
          }
        }

        // 3. Fetch appuntamenti - se esiste
        if (existingTables.includes("appuntamenti")) {
          try {
            // Prima verifichiamo la struttura della tabella
            const { data: columns, error: columnsError } = await supabase.from("appuntamenti").select("*").limit(1)

            if (columnsError) {
              console.error("Errore nel recupero della struttura della tabella appuntamenti:", columnsError)
            } else {
              console.log("Struttura tabella appuntamenti:", columns)

              // Costruiamo la query in base alle colonne disponibili
              let query = ""

              // Aggiungiamo data_inizio solo se esiste
              if (columns && columns.length > 0 && "data_inizio" in columns[0]) {
                query += `data_inizio.lte.${endDateStr}`
              }

              // Aggiungiamo data_fine solo se esiste
              if (columns && columns.length > 0 && "data_fine" in columns[0]) {
                query += query ? `,data_fine.gte.${startDateStr}` : `data_fine.gte.${startDateStr}`
              }

              // Aggiungiamo data solo se esiste
              if (columns && columns.length > 0 && "data" in columns[0]) {
                query += query
                  ? `,data.gte.${startDateStr},data.lte.${endDateStr}`
                  : `data.gte.${startDateStr},data.lte.${endDateStr}`
              }

              // Se non abbiamo costruito una query, usiamo una query di base
              if (!query) {
                query = `id.gt.0` // Sempre vero, recupera tutti i record
              }

              const { data: appuntamenti, error: appuntamentiError } = await supabase
                .from("appuntamenti")
                .select("*")
                .eq("id_utente", user.id)
                .or(query)

              if (appuntamentiError) {
                console.error("Errore nel recupero degli appuntamenti:", appuntamentiError)
              } else if (appuntamenti && Array.isArray(appuntamenti)) {
                console.log(`Trovati ${appuntamenti.length} appuntamenti`)
                debugRawData.push(...appuntamenti.map((item) => ({ ...item, tabella: "appuntamenti" })))

                // Filtriamo gli appuntamenti in base al periodo selezionato
                const filteredAppuntamenti = appuntamenti.filter((item) => {
                  // Gestisci il caso in cui appuntamenti usa "data" invece di "data_inizio"
                  const dataInizio = item.data_inizio
                    ? new Date(item.data_inizio)
                    : item.data
                      ? new Date(item.data)
                      : null

                  const dataFine = item.data_fine ? new Date(item.data_fine) : item.data ? new Date(item.data) : null

                  if (!dataInizio) return false

                  // Debug
                  console.log(`Appuntamento ${item.id} - ${item.titolo || "Senza titolo"}:`, {
                    dataInizio: dataInizio ? dataInizio.toISOString() : null,
                    dataFine: dataFine ? dataFine.toISOString() : null,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    inRange:
                      (dataInizio >= startDate && dataInizio <= endDate) ||
                      (dataFine && dataFine >= startDate && dataFine <= endDate) ||
                      (dataInizio <= startDate && dataFine && dataFine >= endDate),
                  })

                  // Verifichiamo se l'appuntamento rientra nel periodo selezionato
                  return (
                    (dataInizio >= startDate && dataInizio <= endDate) ||
                    (dataFine && dataFine >= startDate && dataFine <= endDate) ||
                    (dataInizio <= startDate && dataFine && dataFine >= endDate)
                  )
                })

                console.log(`Dopo il filtro per data: ${filteredAppuntamenti.length} appuntamenti`)
                stats["appuntamenti"] = filteredAppuntamenti.length

                const formattedAppuntamenti = filteredAppuntamenti.map((item) => {
                  // Gestisci il caso in cui appuntamenti usa "data" invece di "data_inizio"
                  const dataInizio = item.data_inizio || item.data || new Date()
                  // Se c'è ora_inizio e ora_fine, aggiungi le ore alla data
                  const dataInizioCompleta = new Date(dataInizio)
                  const dataFineCompleta = item.data_fine ? new Date(item.data_fine) : new Date(dataInizio)

                  if (item.ora_inizio) {
                    const [ore, minuti] = item.ora_inizio.split(":").map(Number)
                    dataInizioCompleta.setHours(ore, minuti)
                  }

                  if (item.ora_fine) {
                    const [ore, minuti] = item.ora_fine.split(":").map(Number)
                    dataFineCompleta.setHours(ore, minuti)
                  }

                  return {
                    id: item.id,
                    titolo: item.titolo || item.nome || item.oggetto || `Appuntamento #${item.id}`,
                    descrizione: item.descrizione || item.note,
                    data_inizio: dataInizioCompleta,
                    data_fine: dataFineCompleta,
                    data_scadenza: undefined,
                    priorita: item.priorita,
                    stato: item.stato,
                    cliente: item.cliente || item.id_cli,
                    tipo: "appuntamento" as const,
                    colore: "#c8e6c9", // Verde pastello
                    tabella_origine: "appuntamenti",
                    id_origine: item.id,
                    generale: false,
                  }
                })

                allItems.push(...formattedAppuntamenti)
              }
            }
          } catch (err) {
            console.error("Errore nella query appuntamenti:", err)
          }
        }

        // 4. Fetch scadenze personali - se esiste
        if (existingTables.includes("scadenze")) {
          try {
            // Prima verifichiamo la struttura della tabella
            const { data: columns, error: columnsError } = await supabase.from("scadenze").select("*").limit(1)

            if (columnsError) {
              console.error("Errore nel recupero della struttura della tabella scadenze:", columnsError)
            } else if (columns && columns.length > 0) {
              console.log("Struttura tabella scadenze:", columns)

              // Verifichiamo se la tabella ha le colonne necessarie
              const hasDataColumn = "data" in columns[0]
              const hasScadenzaColumn = "scadenza" in columns[0]

              console.log("Colonne disponibili in scadenze:", {
                hasDataColumn,
                hasScadenzaColumn,
                columns: Object.keys(columns[0]),
              })

              // Costruiamo la query in base alle colonne disponibili
              let query = ""

              // Aggiungiamo data solo se esiste
              if (hasDataColumn) {
                query += `data.gte.${startDateStr},data.lte.${endDateStr}`
              }

              // Aggiungiamo scadenza solo se esiste
              if (hasScadenzaColumn) {
                query += query
                  ? `,scadenza.gte.${startDateStr},scadenza.lte.${endDateStr}`
                  : `scadenza.gte.${startDateStr},scadenza.lte.${endDateStr}`
              }

              // Se non abbiamo costruito una query, usiamo una query di base
              if (!query) {
                query = `id.gt.0` // Sempre vero, recupera tutti i record
              }

              console.log("Query scadenze personali:", query)

              // Recuperiamo le scadenze personali dell'utente
              let scadenzeQuery = supabase.from("scadenze").select("*").eq("id_utente", user.id)

              // Aggiungiamo il filtro per le date
              scadenzeQuery = scadenzeQuery.or(query)

              const { data: scadenze, error: scadenzeError } = await scadenzeQuery

              if (scadenzeError) {
                console.error("Errore nel recupero delle scadenze personali:", scadenzeError)
              } else if (scadenze && Array.isArray(scadenze)) {
                console.log(`Trovate ${scadenze.length} scadenze personali prima del filtro`)
                console.log("Esempio di scadenza personale:", scadenze[0])
                debugRawData.push(...scadenze.map((item) => ({ ...item, tabella: "scadenze" })))

                // Filtriamo le scadenze in base al periodo selezionato
                const filteredScadenze = scadenze.filter((item) => {
                  // Per le scadenze, verifichiamo se la data di scadenza rientra nel periodo selezionato
                  if (hasScadenzaColumn && item.scadenza) {
                    // NORMALIZZAZIONE: Impostiamo l'orario della scadenza a 23:59:59.999
                    const scadenzaDate = normalizeDeadlineDate(new Date(item.scadenza))

                    // Debug
                    console.log(`Scadenza ${item.id} - ${item.titolo || "Senza titolo"}:`, {
                      scadenzaOriginale: new Date(item.scadenza).toISOString(),
                      scadenzaNormalizzata: scadenzaDate?.toISOString(),
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                      inRange: scadenzaDate && scadenzaDate >= startDate && scadenzaDate <= endDate,
                    })

                    return scadenzaDate && scadenzaDate >= startDate && scadenzaDate <= endDate
                  }

                  // Se non c'è scadenza ma c'è data, usiamo quella
                  if (hasDataColumn && item.data) {
                    // NORMALIZZAZIONE: Impostiamo l'orario della data a 23:59:59.999
                    const dataDate = normalizeDeadlineDate(new Date(item.data))

                    // Debug
                    console.log(`Scadenza ${item.id} - ${item.titolo || "Senza titolo"} (usando data):`, {
                      dataOriginale: new Date(item.data).toISOString(),
                      dataNormalizzata: dataDate?.toISOString(),
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                      inRange: dataDate && dataDate >= startDate && dataDate <= endDate,
                    })

                    return dataDate && dataDate >= startDate && dataDate <= endDate
                  }

                  return false
                })

                console.log(`Dopo il filtro per data: ${filteredScadenze.length} scadenze personali`)
                stats["scadenze"] = filteredScadenze.length

                const formattedScadenze = filteredScadenze.map((item) => {
                  // Determina la data da usare (scadenza o data)
                  const dataScadenzaRaw = item.scadenza
                    ? new Date(item.scadenza)
                    : item.data
                      ? new Date(item.data)
                      : new Date()

                  // NORMALIZZAZIONE: Impostiamo l'orario della scadenza a 23:59:59.999
                  const dataScadenza = normalizeDeadlineDate(dataScadenzaRaw) || new Date()

                  return {
                    id: item.id,
                    titolo: item.titolo || item.nome || item.descrizione || `Scadenza #${item.id}`,
                    descrizione: item.descrizione || item.note,
                    data_inizio: dataScadenza,
                    data_fine: dataScadenza,
                    data_scadenza: dataScadenza,
                    priorita: item.priorita,
                    stato: item.stato,
                    cliente: item.cliente || item.id_cli,
                    tipo: "scadenza" as const,
                    colore: "#ffecb3", // Giallo pastello per le scadenze personali
                    tabella_origine: "scadenze",
                    id_origine: item.id,
                    generale: false,
                  }
                })

                allItems.push(...formattedScadenze)
              }
            }
          } catch (err) {
            console.error("Errore nella query scadenze personali:", err)
          }
        }

        // 5. Fetch todolist o todo - se esiste
        const todoTableName = existingTables.includes("todolist")
          ? "todolist"
          : existingTables.includes("todo")
            ? "todo"
            : null

        if (todoTableName) {
          try {
            // Prima verifichiamo la struttura della tabella
            const { data: columns, error: columnsError } = await supabase.from(todoTableName).select("*").limit(1)

            if (columnsError) {
              console.error(`Errore nel recupero della struttura della tabella ${todoTableName}:`, columnsError)
            } else if (columns && columns.length > 0) {
              console.log(`Struttura tabella ${todoTableName}:`, columns)

              // Verifichiamo se la tabella ha le colonne necessarie
              const hasDataColumn = "data" in columns[0]
              const hasScadenzaColumn = "data_scadenza" in columns[0] || "scadenza" in columns[0]
              const scadenzaColumnName =
                "data_scadenza" in columns[0] ? "data_scadenza" : "scadenza" in columns[0] ? "scadenza" : null

              // Costruiamo la query in base alle colonne disponibili
              let query = ""

              // Aggiungiamo data solo se esiste
              if (hasDataColumn) {
                query += `data.gte.${startDateStr},data.lte.${endDateStr}`
              }

              // Aggiungiamo data_scadenza o scadenza solo se esiste
              if (hasScadenzaColumn && scadenzaColumnName) {
                query += query
                  ? `,${scadenzaColumnName}.gte.${startDateStr},${scadenzaColumnName}.lte.${endDateStr}`
                  : `${scadenzaColumnName}.gte.${startDateStr},${scadenzaColumnName}.lte.${endDateStr}`
              }

              // Se non abbiamo costruito una query, usiamo una query di base
              if (!query) {
                query = `id.gt.0` // Sempre vero, recupera tutti i record
              }

              const { data: todolist, error: todolistError } = await supabase
                .from(todoTableName)
                .select("*")
                .eq("id_utente", user.id)
                .or(query)

              if (todolistError) {
                console.error(`Errore nel recupero dei ${todoTableName}:`, todolistError)
              } else if (todolist && Array.isArray(todolist)) {
                console.log(`Trovati ${todolist.length} ${todoTableName}`)
                debugRawData.push(...todolist.map((item) => ({ ...item, tabella: todoTableName })))

                // Filtriamo i todo in base al periodo selezionato
                const filteredTodos = todolist.filter((item) => {
                  // Per todolist, verifichiamo se la data di scadenza rientra nel periodo selezionato
                  if (hasScadenzaColumn && scadenzaColumnName && item[scadenzaColumnName]) {
                    // NORMALIZZAZIONE: Impostiamo l'orario della scadenza a 23:59:59.999
                    const scadenzaDate = normalizeDeadlineDate(new Date(item[scadenzaColumnName]))

                    // Debug
                    console.log(`Todo ${item.id} - ${item.titolo || "Senza titolo"}:`, {
                      scadenzaOriginale: new Date(item[scadenzaColumnName]).toISOString(),
                      scadenzaNormalizzata: scadenzaDate?.toISOString(),
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                      inRange: scadenzaDate && scadenzaDate >= startDate && scadenzaDate <= endDate,
                    })

                    return scadenzaDate && scadenzaDate >= startDate && scadenzaDate <= endDate
                  }

                  // Se non c'è scadenza ma c'è data, usiamo quella
                  if (hasDataColumn && item.data) {
                    // NORMALIZZAZIONE: Impostiamo l'orario della data a 23:59:59.999
                    const dataDate = normalizeDeadlineDate(new Date(item.data))

                    // Debug
                    console.log(`Todo ${item.id} - ${item.titolo || "Senza titolo"} (usando data):`, {
                      dataOriginale: new Date(item.data).toISOString(),
                      dataNormalizzata: dataDate?.toISOString(),
                      startDate: startDate.toISOString(),
                      endDate: endDate.toISOString(),
                      inRange: dataDate && dataDate >= startDate && dataDate <= endDate,
                    })

                    return dataDate && dataDate >= startDate && dataDate <= endDate
                  }

                  return false
                })

                console.log(`Dopo il filtro per data: ${filteredTodos.length} ${todoTableName}`)
                stats[todoTableName] = filteredTodos.length

                const formattedTodos = filteredTodos.map((item) => {
                  const dataTodo = item.data ? new Date(item.data) : new Date()
                  const dataScadenzaRaw =
                    scadenzaColumnName && item[scadenzaColumnName] ? new Date(item[scadenzaColumnName]) : undefined

                  // NORMALIZZAZIONE: Impostiamo l'orario della scadenza a 23:59:59.999
                  const dataScadenza = normalizeDeadlineDate(dataScadenzaRaw)

                  return {
                    id: item.id,
                    titolo: item.titolo || item.nome || item.descrizione || `${todoTableName} #${item.id}`,
                    descrizione: item.descrizione || item.note,
                    data_inizio: normalizeDeadlineDate(dataTodo) || dataTodo,
                    data_fine: dataScadenza || normalizeDeadlineDate(dataTodo) || dataTodo,
                    data_scadenza: dataScadenza,
                    priorita: item.priorita,
                    stato: item.stato,
                    cliente: item.cliente || item.id_cli,
                    tipo: "todolist" as const,
                    colore: "#e1bee7", // Viola pastello
                    tabella_origine: todoTableName,
                    id_origine: item.id,
                    generale: false,
                  }
                })

                allItems.push(...formattedTodos)
              }
            }
          } catch (err) {
            console.error(`Errore nella query ${todoTableName}:`, err)
          }
        }

        // Combina tutti gli elementi, incluse le scadenze generali
        // Modifichiamo questa parte per evitare duplicati per l'utente 1
        if (user && user.id === 1) {
          // Per l'utente 1, non aggiungiamo le scadenze generali perché sono già incluse nelle sue scadenze personali
          console.log("Utente 1: non aggiungo scadenze generali per evitare duplicati")
        } else {
          // Per tutti gli altri utenti, aggiungiamo le scadenze generali
          allItems.push(...scadenzeGenerali)
        }

        console.log(`Totale elementi agenda trovati: ${allItems.length}`)

        // Aggiorna le statistiche
        stats["scadenze_generali"] = user && user.id === 1 ? 0 : scadenzeGenerali.length

        setTableStats(stats)
        setItems(allItems)
        setRawData(debugRawData)
      } catch (err) {
        console.error("Errore nel recupero degli elementi dell'agenda:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [supabase, user, startDate, endDate, scadenzeGenerali])

  // Aggiungiamo un controllo per verificare se ci sono ancora duplicati
  // Prima di restituire gli items alla fine della funzione:

  // Verifica duplicati per l'utente 1
  if (user && user.id === 1) {
    // Conta le scadenze per titolo
    const scadenzeCounts = {}
    const possibleDuplicates = []

    items.forEach((item) => {
      if (item.tipo === "scadenza") {
        if (!scadenzeCounts[item.titolo]) {
          scadenzeCounts[item.titolo] = 1
        } else {
          scadenzeCounts[item.titolo]++
          possibleDuplicates.push(item.titolo)
        }
      }
    })

    // Log dei possibili duplicati
    if (possibleDuplicates.length > 0) {
      console.warn("ATTENZIONE: Possibili scadenze duplicate per l'utente 1:", [...new Set(possibleDuplicates)])
    } else {
      console.log("Nessuna scadenza duplicata rilevata per l'utente 1")
    }
  }

  return {
    items,
    isLoading: isLoading || isLoadingScadenzeGenerali,
    error: error || errorScadenzeGenerali,
    tableStats,
    rawData: rawData,
  }
}
