"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import type { AgendaItem } from "./use-agenda-items"
import { startOfDay, endOfDay, format, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"
import { useAuth } from "@/lib/auth-provider"

// Funzione di utilità per normalizzare le date delle scadenze
export function normalizeDeadlineDate(date: Date | null | undefined): Date | undefined {
  if (!date) return undefined

  // Crea una nuova data per non modificare l'originale
  const normalizedDate = new Date(date)

  // Imposta l'orario a 23:59:59.999 (fine della giornata)
  return setMilliseconds(setSeconds(setMinutes(setHours(normalizedDate, 23), 59), 59), 999)
}

export function useGeneralDeadlines(startDate: Date, endDate: Date) {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [items, setItems] = useState<AgendaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [rawData, setRawData] = useState<any[]>([]) // Per debug

  useEffect(() => {
    const fetchGeneralDeadlines = async () => {
      console.log("Inizializzazione fetchGeneralDeadlines con date:", {
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
      })
      if (!supabase || !startDate || !endDate) {
        setItems([])
        setIsLoading(false)
        return
      }

      // Aggiungiamo validazione esplicita che startDate e endDate siano oggetti Date validi
      if (
        !(startDate instanceof Date) ||
        !(endDate instanceof Date) ||
        isNaN(startDate.getTime()) ||
        isNaN(endDate.getTime())
      ) {
        console.error("startDate o endDate non sono oggetti Date validi", {
          startDate,
          endDate,
          startDateType: typeof startDate,
          endDateType: typeof endDate,
          startDateIsDate: startDate instanceof Date,
          endDateIsDate: endDate instanceof Date,
        })
        setError(new Error("Date non valide"))
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Assicuriamoci che startDate sia all'inizio del giorno e endDate alla fine del giorno
        const adjustedStartDate = startOfDay(startDate)
        const adjustedEndDate = endOfDay(endDate)

        console.log(
          `Fetching general deadlines from ${format(adjustedStartDate, "yyyy-MM-dd")} to ${format(adjustedEndDate, "yyyy-MM-dd")}`,
        )

        // Formatta le date per la query SQL nel formato YYYY-MM-DD senza timezone
        const startDateIso = format(adjustedStartDate, "yyyy-MM-dd")
        const endDateIso = format(adjustedEndDate, "yyyy-MM-dd")

        console.log("Date formattate per query SQL (scadenze generali):", {
          startDateIso,
          endDateIso,
          startDateFormatted: format(adjustedStartDate, "yyyy-MM-dd"),
          endDateFormatted: format(adjustedEndDate, "yyyy-MM-dd"),
        })

        // Verifichiamo se la tabella scadenze esiste
        try {
          const { count, error } = await supabase.from("scadenze").select("*", { count: "exact", head: true })

          if (error) {
            console.log("Tabella scadenze non esiste o non è accessibile")
            setItems([])
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.log("Tabella scadenze non esiste o non è accessibile")
          setItems([])
          setIsLoading(false)
          return
        }

        // Prima verifichiamo la struttura della tabella
        const { data: columns, error: columnsError } = await supabase.from("scadenze").select("*").limit(1)

        if (columnsError) {
          console.error("Errore nel recupero della struttura della tabella scadenze:", columnsError)
          setError(columnsError)
          setIsLoading(false)
          return
        }

        if (!columns || columns.length === 0) {
          console.log("Nessuna colonna trovata nella tabella scadenze")
          setItems([])
          setIsLoading(false)
          return
        }

        console.log("Struttura tabella scadenze:", columns)
        console.log("Colonne disponibili in scadenze (generali):", Object.keys(columns[0]))

        // Verifichiamo se la tabella ha le colonne necessarie
        const hasPrivatoColumn = "privato" in columns[0]
        const hasDataColumn = "data" in columns[0]
        const hasScadenzaColumn = "scadenza" in columns[0]

        console.log("Colonne disponibili:", {
          hasPrivatoColumn,
          hasDataColumn,
          hasScadenzaColumn,
        })

        // Recuperiamo le scadenze generali (utente id=1 e privato<>true)
        let scadenzeQuery = supabase.from("scadenze").select("*")

        // Aggiungiamo il filtro per l'utente id=1 (utente generale)
        scadenzeQuery = scadenzeQuery.eq("id_utente", 1)
        console.log("Query dopo filtro id_utente=1")

        // Aggiungiamo il filtro privato<>true solo se la colonna esiste
        if (hasPrivatoColumn) {
          // CORREZIONE: Utilizziamo la sintassi corretta di Supabase per "not equal"
          scadenzeQuery = scadenzeQuery.not("privato", "eq", true)
          console.log("Query dopo filtro privato<>true")
        } else {
          console.warn("Colonna 'privato' non trovata nella tabella scadenze")
        }

        // IMPORTANTE: Se l'utente corrente è l'utente 1, non carichiamo le scadenze generali
        // per evitare duplicati
        if (user && user.id === 1) {
          console.log("Utente corrente è l'utente generale (id=1), non carico scadenze generali per evitare duplicati")
          setItems([])
          setIsLoading(false)
          return
        }

        // Costruiamo una query che includa scadenze che rientrano nel periodo selezionato
        let dateFilterQuery = scadenzeQuery

        // Aggiungiamo filtri per la colonna 'data' se esiste
        if (hasDataColumn) {
          console.log("Applicazione filtri per colonna 'data'")
          // VERIFICA: Sintassi corretta per il filtro OR in Supabase
          dateFilterQuery = dateFilterQuery.or(`data.gte.${startDateIso},data.lte.${endDateIso}`)
        }

        // Aggiungiamo filtri per la colonna 'scadenza' se esiste
        if (hasScadenzaColumn) {
          console.log("Applicazione filtri per colonna 'scadenza'")
          // VERIFICA: Sintassi corretta per il filtro OR in Supabase
          dateFilterQuery = dateFilterQuery.or(`scadenza.gte.${startDateIso},scadenza.lte.${endDateIso}`)
        }

        // Se non abbiamo né 'data' né 'scadenza', non applichiamo filtri di data
        if (!hasDataColumn && !hasScadenzaColumn) {
          console.warn("Nessuna colonna di data trovata, non verranno applicati filtri di data")
        }

        // Eseguiamo la query finale
        console.log("Esecuzione query finale per scadenze generali")
        const { data: scadenze, error: scadenzeError } = await dateFilterQuery

        // Dopo aver ottenuto i risultati
        console.log("Risultati query scadenze generali:", {
          success: !scadenzeError,
          count: scadenze?.length || 0,
          error: scadenzeError?.message,
          firstItem: scadenze?.[0]
            ? {
                id: scadenze[0].id,
                id_utente: scadenze[0].id_utente,
                privato: scadenze[0].privato,
                titolo: scadenze[0].titolo,
                data: scadenze[0].data,
                scadenza: scadenze[0].scadenza,
              }
            : null,
        })

        if (scadenze && Array.isArray(scadenze)) {
          // Verifica esplicita che le scadenze siano dell'utente 1 e non private
          const scadenzeUtente1 = scadenze.filter((item) => item.id_utente === 1)
          // VERIFICA: Utilizziamo !== per confronto stretto
          const scadenzeNonPrivate = hasPrivatoColumn ? scadenze.filter((item) => item.privato !== true) : scadenze

          console.log("Verifica filtri scadenze:", {
            totali: scadenze.length,
            utente1: scadenzeUtente1.length,
            nonPrivate: scadenzeNonPrivate.length,
            // VERIFICA: Utilizziamo !== per confronto stretto
            corrispondentiEntrambi: scadenze.filter(
              (item) => item.id_utente === 1 && (!hasPrivatoColumn || item.privato !== true),
            ).length,
          })
        }

        if (scadenzeError) {
          console.error("Errore nel recupero delle scadenze generali:", scadenzeError)
          setError(scadenzeError)
          setIsLoading(false)
          return
        }

        if (!scadenze || !Array.isArray(scadenze)) {
          console.log("Nessuna scadenza generale trovata")
          setItems([])
          setIsLoading(false)
          return
        }

        console.log(`Trovate ${scadenze.length} scadenze generali prima del filtro`)
        if (scadenze.length > 0) {
          console.log("Esempio di scadenza generale:", scadenze[0])
        }

        // Salva i dati grezzi per debug
        setRawData(scadenze.map((item) => ({ ...item, tabella: "scadenze_generali" })))

        // Filtriamo le scadenze in base al periodo selezionato
        const filteredScadenze = scadenze.filter((item) => {
          // Per le scadenze, verifichiamo se la data di scadenza rientra nel periodo selezionato
          if (hasScadenzaColumn && item.scadenza) {
            // NORMALIZZAZIONE: Impostiamo l'orario della scadenza a 23:59:59.999
            const scadenzaDate = normalizeDeadlineDate(new Date(item.scadenza))

            // Debug - utilizziamo format invece di toISOString per evitare timezone
            console.log(`Scadenza generale ${item.id} - ${item.titolo || "Senza titolo"}:`, {
              scadenzaOriginale: format(new Date(item.scadenza), "yyyy-MM-dd"),
              scadenzaNormalizzata: scadenzaDate ? format(scadenzaDate, "yyyy-MM-dd") : null,
              startDate: format(adjustedStartDate, "yyyy-MM-dd"),
              endDate: format(adjustedEndDate, "yyyy-MM-dd"),
              // VERIFICA: Utilizziamo && per combinare le condizioni
              inRange: scadenzaDate && scadenzaDate >= adjustedStartDate && scadenzaDate <= adjustedEndDate,
            })

            // VERIFICA: Utilizziamo && per combinare le condizioni
            return scadenzaDate && scadenzaDate >= adjustedStartDate && scadenzaDate <= adjustedEndDate
          }

          // Se non c'è scadenza ma c'è data, usiamo quella
          if (hasDataColumn && item.data) {
            // NORMALIZZAZIONE: Impostiamo l'orario della data a 23:59:59.999
            const dataDate = normalizeDeadlineDate(new Date(item.data))

            // Debug - utilizziamo format invece di toISOString per evitare timezone
            console.log(`Scadenza generale ${item.id} - ${item.titolo || "Senza titolo"} (usando data):`, {
              dataOriginale: format(new Date(item.data), "yyyy-MM-dd"),
              dataNormalizzata: dataDate ? format(dataDate, "yyyy-MM-dd") : null,
              startDate: format(adjustedStartDate, "yyyy-MM-dd"),
              endDate: format(adjustedEndDate, "yyyy-MM-dd"),
              // VERIFICA: Utilizziamo && per combinare le condizioni
              inRange: dataDate && dataDate >= adjustedStartDate && dataDate <= adjustedEndDate,
            })

            // VERIFICA: Utilizziamo && per combinare le condizioni
            return dataDate && dataDate >= adjustedStartDate && dataDate <= adjustedEndDate
          }

          return false
        })

        console.log(`Dopo il filtro per data: ${filteredScadenze.length} scadenze generali`)

        // Formatta le scadenze generali
        const formattedScadenze = filteredScadenze.map((item) => {
          // Determina la data da usare (scadenza o data)
          const dataScadenzaRaw = item.scadenza ? new Date(item.scadenza) : item.data ? new Date(item.data) : new Date()

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
            colore: "#FFC107", // Giallo ambra per le scadenze generali
            tabella_origine: "scadenze",
            id_origine: item.id,
            generale: true, // Flag per identificare le scadenze generali
          }
        })

        console.log("Scadenze generali formattate:", formattedScadenze)
        // Aggiungiamo più log di debug
        console.log("Scadenze generali prima del filtro:", scadenze.length)
        console.log("Scadenze generali dopo il filtro:", filteredScadenze.length)
        console.log("Scadenze generali formattate (prime 3):", formattedScadenze.slice(0, 3))
        setItems(formattedScadenze)
      } catch (err) {
        console.error("Errore generale nel recupero delle scadenze generali:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchGeneralDeadlines()
  }, [supabase, startDate, endDate, user])

  return { items, isLoading, error, rawData }
}
