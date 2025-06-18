"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import {
  Calendar,
  ClipboardList,
  Clock,
  CheckSquare,
  BarChart3,
  Users,
  FileText,
  StickyNote,
  type LucideIcon,
} from "lucide-react"

export interface SummaryCount {
  type: string
  label: string
  count: number
  icon: LucideIcon
  color: string
  textColor: string
}

export interface UpcomingItem {
  id_origine: number
  tabella_origine: string
  title: string
  date: Date
  type: string
  color: string
}

interface DashboardData {
  summaryCounts: SummaryCount[]
  todaysItems: UpcomingItem[]
  nextWeekItems: UpcomingItem[]
}

const TABLE_CONFIGS = [
  {
    table: "appuntamenti",
    label: "Appuntamenti",
    icon: Calendar,
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    dateField: "data_inizio", // Campo principale per filtrare
    titleField: "titolo",
    fallbackFields: ["descrizione", "contenuto"], // Campi alternativi per il titolo
  },
  {
    table: "attivita",
    label: "Attività",
    icon: ClipboardList,
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    dateField: "data_inizio", // Campo principale
    titleField: "titolo",
    fallbackFields: ["descrizione", "contenuto"],
  },
  {
    table: "scadenze",
    label: "Scadenze",
    icon: Clock,
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    dateField: "scadenza", // Campo scadenza
    titleField: "titolo",
    fallbackFields: ["descrizione", "contenuto"],
  },
  {
    table: "todolist",
    label: "Todo",
    icon: CheckSquare,
    color: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
    dateField: "scadenza", // Campo scadenza
    titleField: "titolo",
    fallbackFields: ["descrizione", "contenuto"],
  },
  {
    table: "progetti",
    label: "Progetti",
    icon: BarChart3,
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    dateField: "data_inizio", // Useremo logica speciale per progetti attivi
    titleField: "nome",
    fallbackFields: ["descrizione", "contenuto"],
    hasDateRange: true, // Flag per progetti con data_inizio e data_fine
  },
  {
    table: "clienti",
    label: "Clienti",
    icon: Users,
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    dateField: "data_creazione",
    titleField: "nome",
    fallbackFields: ["descrizione", "contenuto"],
  },
  {
    table: "pagine",
    label: "Pagine",
    icon: FileText,
    color: "bg-teal-50 border-teal-200",
    textColor: "text-teal-700",
    dateField: "pubblicato",
    titleField: "titolo",
    fallbackFields: ["estratto", "contenuto"],
  },
  {
    table: "note",
    label: "Note",
    icon: StickyNote,
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    dateField: "creato_il",
    titleField: "titolo",
    fallbackFields: ["contenuto"],
  },
]

/**
 * Ottiene il titolo da un record, usando campi alternativi se il principale è vuoto
 */
function getRecordTitle(record: any, titleField: string, fallbackFields: string[] = []): string {
  // Prova il campo principale
  if (record[titleField] && record[titleField].trim()) {
    return record[titleField].trim()
  }

  // Prova i campi alternativi
  for (const field of fallbackFields) {
    if (record[field] && record[field].trim()) {
      const content = record[field].trim()
      // Se è contenuto lungo, prendi i primi 50 caratteri
      return content.length > 50 ? content.substring(0, 50) + "..." : content
    }
  }

  return "Senza titolo"
}

/**
 * Crea le date per oggi (inizio e fine giornata)
 */
function getTodayRange() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { todayStart, todayEnd }
}

/**
 * Crea le date per la prossima settimana (da domani a +7 giorni)
 */
function getNextWeekRange() {
  const now = new Date()
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  const nextWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999)
  return { tomorrowStart, nextWeekEnd }
}

export function useUserDashboardSummary() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!supabase || !user?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const userId = Number.parseInt(user.id.toString())
        if (isNaN(userId)) {
          throw new Error("ID utente non valido")
        }

        // Calcola range di date
        const { todayStart, todayEnd } = getTodayRange()
        const { tomorrowStart, nextWeekEnd } = getNextWeekRange()
        const now = new Date()

        // Fetch counts for each table
        const summaryCounts: SummaryCount[] = []
        const todaysItems: UpcomingItem[] = []
        const nextWeekItems: UpcomingItem[] = []

        for (const config of TABLE_CONFIGS) {
          try {
            // Get count
            const { count, error: countError } = await supabase
              .from(config.table)
              .select("*", { count: "exact", head: true })
              .eq("id_utente", userId)

            if (countError) {
              console.warn(`Errore nel conteggio per ${config.table}:`, countError)
              continue
            }

            summaryCounts.push({
              type: config.table,
              label: config.label,
              count: count || 0,
              icon: config.icon,
              color: config.color,
              textColor: config.textColor,
            })

            // Get upcoming items (solo per tabelle con campi data)
            if (config.dateField) {
              // Costruisci la query base
              const baseFields = [
                "id",
                config.titleField,
                config.dateField,
                ...config.fallbackFields.filter((field) => field !== config.titleField),
              ].join(", ")

              // Logica speciale per progetti (data_inizio <= now <= data_fine)
              if (config.hasDateRange && config.table === "progetti") {
                // Progetti attivi oggi
                const { data: todayProjects, error: todayError } = await supabase
                  .from(config.table)
                  .select(`id, ${config.titleField}, data_inizio, data_fine, ${config.fallbackFields.join(", ")}`)
                  .eq("id_utente", userId)
                  .lte("data_inizio", todayEnd.toISOString())
                  .gte("data_fine", todayStart.toISOString())
                  .order("data_inizio", { ascending: true })
                  .limit(5)

                if (!todayError && todayProjects) {
                  const items: UpcomingItem[] = todayProjects.map((item) => ({
                    id_origine: item.id,
                    tabella_origine: config.table,
                    title: getRecordTitle(item, config.titleField, config.fallbackFields),
                    date: new Date(item.data_inizio),
                    type: config.label.toLowerCase(),
                    color: config.textColor,
                  }))
                  todaysItems.push(...items)
                }

                // Progetti che iniziano nella prossima settimana
                const { data: nextWeekProjects, error: nextWeekError } = await supabase
                  .from(config.table)
                  .select(`id, ${config.titleField}, data_inizio, data_fine, ${config.fallbackFields.join(", ")}`)
                  .eq("id_utente", userId)
                  .gte("data_inizio", tomorrowStart.toISOString())
                  .lte("data_inizio", nextWeekEnd.toISOString())
                  .order("data_inizio", { ascending: true })
                  .limit(5)

                if (!nextWeekError && nextWeekProjects) {
                  const items: UpcomingItem[] = nextWeekProjects.map((item) => ({
                    id_origine: item.id,
                    tabella_origine: config.table,
                    title: getRecordTitle(item, config.titleField, config.fallbackFields),
                    date: new Date(item.data_inizio),
                    type: config.label.toLowerCase(),
                    color: config.textColor,
                  }))
                  nextWeekItems.push(...items)
                }
              } else {
                // Logica normale per altre tabelle

                // Elementi di oggi
                const { data: todayData, error: todayError } = await supabase
                  .from(config.table)
                  .select(baseFields)
                  .eq("id_utente", userId)
                  .gte(config.dateField, todayStart.toISOString())
                  .lte(config.dateField, todayEnd.toISOString())
                  .order(config.dateField, { ascending: true })
                  .limit(5)

                if (!todayError && todayData) {
                  const items: UpcomingItem[] = todayData.map((item) => ({
                    id_origine: item.id,
                    tabella_origine: config.table,
                    title: getRecordTitle(item, config.titleField, config.fallbackFields),
                    date: new Date(item[config.dateField]),
                    type: config.label.toLowerCase(),
                    color: config.textColor,
                  }))
                  todaysItems.push(...items)
                }

                // Elementi della prossima settimana
                const { data: nextWeekData, error: nextWeekError } = await supabase
                  .from(config.table)
                  .select(baseFields)
                  .eq("id_utente", userId)
                  .gte(config.dateField, tomorrowStart.toISOString())
                  .lte(config.dateField, nextWeekEnd.toISOString())
                  .order(config.dateField, { ascending: true })
                  .limit(5)

                if (!nextWeekError && nextWeekData) {
                  const items: UpcomingItem[] = nextWeekData.map((item) => ({
                    id_origine: item.id,
                    tabella_origine: config.table,
                    title: getRecordTitle(item, config.titleField, config.fallbackFields),
                    date: new Date(item[config.dateField]),
                    type: config.label.toLowerCase(),
                    color: config.textColor,
                  }))
                  nextWeekItems.push(...items)
                }
              }
            }
          } catch (err) {
            console.warn(`Errore nel recupero dati per ${config.table}:`, err)
          }
        }

        // Ordina gli elementi per data
        todaysItems.sort((a, b) => a.date.getTime() - b.date.getTime())
        nextWeekItems.sort((a, b) => a.date.getTime() - b.date.getTime())

        // Limita il numero di elementi mostrati
        const finalTodaysItems = todaysItems.slice(0, 10)
        const finalNextWeekItems = nextWeekItems.slice(0, 10)

        setDashboardData({
          summaryCounts,
          todaysItems: finalTodaysItems,
          nextWeekItems: finalNextWeekItems,
        })
      } catch (err: any) {
        console.error("Errore nel recupero dei dati del dashboard:", err)
        setError(err.message || "Errore sconosciuto")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase, user?.id])

  return { dashboardData, isLoading, error }
}
