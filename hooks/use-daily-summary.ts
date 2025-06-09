"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { startOfDay, endOfDay } from "date-fns"

export interface DailySummaryData {
  appuntamentiCount: number
  attivitaCount: number
  scadenzeCount: number
  todolistCount: number
  isLoading: boolean
  error: string | null
}

export function useDailySummary(): DailySummaryData {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [summary, setSummary] = useState<Omit<DailySummaryData, "isLoading" | "error">>({
    appuntamentiCount: 0,
    attivitaCount: 0,
    scadenzeCount: 0,
    todolistCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase || !user) {
      setIsLoading(false)
      if (!user) setError("Utente non autenticato.")
      return
    }

    const fetchSummary = async () => {
      setIsLoading(true)
      setError(null)

      const todayStart = startOfDay(new Date()).toISOString()
      const todayEnd = endOfDay(new Date()).toISOString()

      try {
        let appuntamentiCount = 0
        let attivitaCount = 0
        let scadenzeCount = 0
        let todolistCount = 0

        // Fetch Appuntamenti
        const { count: appCount, error: appError } = await supabase
          .from("appuntamenti")
          .select("*", { count: "exact", head: true })
          .eq("id_utente", user.id)
          .gte("data_inizio", todayStart) // Assuming data_inizio or similar field
          .lte("data_inizio", todayEnd)
        if (appError) console.warn("Errore conteggio appuntamenti:", appError.message)
        else appuntamentiCount = appCount || 0

        // Fetch Attivita (items active today)
        const { count: actCount, error: actError } = await supabase
          .from("attivita")
          .select("*", { count: "exact", head: true })
          .eq("id_utente", user.id)
          .lte("data_inizio", todayEnd)
          .or(`data_fine.gte.${todayStart},data_fine.is.null`) // Active if ends today or later, or no end date
        if (actError) console.warn("Errore conteggio attivita:", actError.message)
        else attivitaCount = actCount || 0

        // Fetch Scadenze (due today)
        const { count: scaCount, error: scaError } = await supabase
          .from("scadenze")
          .select("*", { count: "exact", head: true })
          .eq("id_utente", user.id)
          .gte("scadenza", todayStart) // Assuming 'scadenza' field
          .lte("scadenza", todayEnd)
        if (scaError) console.warn("Errore conteggio scadenze:", scaError.message)
        else scadenzeCount = scaCount || 0

        // Fetch Todolist (due today)
        const todoTable = (await supabase.rpc("table_exists", { table_name: "todolist" })).data ? "todolist" : "todo"
        const { count: todoCount, error: todoError } = await supabase
          .from(todoTable)
          .select("*", { count: "exact", head: true })
          .eq("id_utente", user.id)
          .gte("data_scadenza", todayStart) // Assuming 'data_scadenza' or similar
          .lte("data_scadenza", todayEnd)
        if (todoError) console.warn("Errore conteggio todolist:", todoError.message)
        else todolistCount = todoCount || 0

        setSummary({ appuntamentiCount, attivitaCount, scadenzeCount, todolistCount })
      } catch (e: any) {
        console.error("Errore fetchSummary:", e)
        setError(e.message || "Errore nel caricamento del riepilogo.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()
  }, [supabase, user])

  return { ...summary, isLoading, error }
}
