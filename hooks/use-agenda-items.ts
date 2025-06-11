"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider" // Utilizza l'autenticazione Supabase

export interface AgendaItem {
  id: string | number // Corrisponde a id_origine dall'API
  titolo: string
  descrizione?: string
  data_inizio: Date
  data_fine?: Date
  data_scadenza?: Date
  tipo: "attivita" | "progetto" | "appuntamento" | "scadenza" | "todolist" | string
  colore?: string
  generale?: boolean
  cliente?: string
  stato?: string
  priorita?: string
  tabella_origine: string
  id_origine: string | number // Mantenuto per chiarezza, 'id' sarà mappato da questo
}

const useAgendaItems = (startDate?: Date, endDate?: Date) => {
  const { user, isLoading: authIsLoading } = useAuth()
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [isLoadingState, setIsLoadingState] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableStats, setTableStats] = useState<Record<string, number>>({})

  const fetchAgendaItems = useCallback(async () => {
    if (authIsLoading) {
      // Attendi il caricamento dell'autenticazione
      return
    }

    if (!user || !user.id) {
      setAgendaItems([])
      setTableStats({})
      // Non impostare un errore qui per evitare messaggi prematuri durante il logout o il caricamento iniziale
      // setError("Utente non autenticato.");
      return
    }

    if (!startDate || !endDate) {
      setAgendaItems([])
      setTableStats({})
      // setError("Intervallo di date non specificato.");
      return
    }

    setIsLoadingState(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        userId: String(user.id),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const response = await fetch(`/api/agenda-items?${queryParams.toString()}`)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Impossibile leggere il corpo dell'errore.")
        throw new Error(
          `Errore nel caricamento degli elementi dell'agenda: ${response.status} ${response.statusText}. Dettagli: ${errorText}`,
        )
      }

      const data = await response.json()

      if (!data || !Array.isArray(data.items)) {
        console.error("Formato risposta API non valido:", data)
        throw new Error("Formato della risposta API non valido o mancante `items` array.")
      }

      const transformedItems = data.items.map(
        (item: any): AgendaItem => ({
          ...item,
          id: item.id_origine, // Mappa id_origine a id per coerenza con l'uso nel widget
          data_inizio: new Date(item.data_inizio),
          data_fine: item.data_fine ? new Date(item.data_fine) : undefined,
          data_scadenza: item.data_scadenza ? new Date(item.data_scadenza) : undefined,
        }),
      )

      setAgendaItems(transformedItems)
      setTableStats(data.tableStats || {})
    } catch (err: any) {
      console.error("Errore in fetchAgendaItems:", err)
      setError(err.message)
      setAgendaItems([])
      setTableStats({})
    } finally {
      setIsLoadingState(false)
    }
  }, [user, user?.id, authIsLoading, startDate, endDate])

  useEffect(() => {
    // Esegui fetchAgendaItems solo se tutti i parametri necessari sono presenti
    if (user?.id && startDate && endDate && !authIsLoading) {
      fetchAgendaItems()
    } else if (!user?.id && !authIsLoading) {
      // Se l'utente non è loggato (e l'autenticazione non è in corso), pulisci i dati
      setAgendaItems([])
      setTableStats({})
    }
  }, [user?.id, startDate, endDate, authIsLoading, fetchAgendaItems])

  return {
    items: agendaItems,
    isLoading: isLoadingState || authIsLoading, // Considera entrambi gli stati di caricamento
    error,
    tableStats,
    fetchAgendaItems, // Esponi per un eventuale refresh manuale
  }
}

export default useAgendaItems
