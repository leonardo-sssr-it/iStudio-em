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
    dateField: "data_inizio",
    titleField: "titolo",
  },
  {
    table: "attivita",
    label: "Attività",
    icon: ClipboardList,
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    dateField: "data_scadenza",
    titleField: "titolo",
  },
  {
    table: "scadenze",
    label: "Scadenze",
    icon: Clock,
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    dateField: "data_scadenza",
    titleField: "titolo",
  },
  {
    table: "todolist",
    label: "Todo",
    icon: CheckSquare,
    color: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
    dateField: "data_scadenza",
    titleField: "titolo",
  },
  {
    table: "progetti",
    label: "Progetti",
    icon: BarChart3,
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    dateField: "data_fine",
    titleField: "nome",
  },
  {
    table: "clienti",
    label: "Clienti",
    icon: Users,
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    dateField: "data_creazione",
    titleField: "ragione_sociale",
  },
  {
    table: "pagine",
    label: "Pagine",
    icon: FileText,
    color: "bg-teal-50 border-teal-200",
    textColor: "text-teal-700",
    dateField: "pubblicato",
    titleField: "titolo",
  },
  {
    table: "note",
    label: "Note",
    icon: StickyNote,
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    dateField: "data_creazione",
    titleField: "titolo",
  },
]

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

        // Calcolo date CORRETTE senza timezone
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 1)
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 1)

        const nextWeekEnd = new Date(today)
        nextWeekEnd.setDate(today.getDate() + 7)
        const nextWeekEndNormalized = new Date(
          nextWeekEnd.getFullYear(),
          nextWeekEnd.getMonth(),
          nextWeekEnd.getDate(),
          23,
          59,
          59,
          999,
        )

        console.log("Dashboard Summary - Date range per oggi:", {
          start: todayStart.toLocaleString(),
          end: todayEnd.toLocaleString(),
        })

        console.log("Dashboard Summary - Date range per prossima settimana:", {
          start: tomorrowStart.toLocaleString(),
          end: nextWeekEndNormalized.toLocaleString(),
        })

        // Fetch counts for each table
        const summaryCounts: SummaryCount[] = []
        const allTodayItems: UpcomingItem[] = []
        const allNextWeekItems: UpcomingItem[] = []

        for (const config of TABLE_CONFIGS) {
          try {
            console.log(`Dashboard Summary - Processando tabella: ${config.table}`)

            // Get count
            const { count, error: countError } = await supabase
              .from(config.table)
              .select("*", { count: "exact", head: true })
              .eq("id_utente", user.id)

            if (countError) {
              console.warn(`Errore nel conteggio per ${config.table}:`, countError)
              continue
            }

            console.log(`Dashboard Summary - Count per ${config.table}: ${count}`)

            summaryCounts.push({
              type: config.table,
              label: config.label,
              count: count || 0,
              icon: config.icon,
              color: config.color,
              textColor: config.textColor,
            })

            // Get today's items solo se ci sono elementi nella tabella
            if (config.dateField && count && count > 0) {
              console.log(`Dashboard Summary - Cercando elementi di oggi per ${config.table}`)

              // Costruisci la query per oggi
              const todayQuery = supabase
                .from(config.table)
                .select(`id, ${config.titleField}, ${config.dateField}`)
                .eq("id_utente", user.id)
                .gte(config.dateField, todayStart.toISOString())
                .lte(config.dateField, todayEnd.toISOString())
                .order(config.dateField, { ascending: true })

              const { data: todayData, error: todayError } = await todayQuery

              if (todayError) {
                console.warn(`Errore nel recupero oggi per ${config.table}:`, todayError)
              } else if (todayData && todayData.length > 0) {
                console.log(
                  `Dashboard Summary - Trovati ${todayData.length} elementi di oggi per ${config.table}:`,
                  todayData,
                )

                const items: UpcomingItem[] = todayData
                  .filter((item) => item[config.dateField])
                  .map((item) => ({
                    id_origine: item.id,
                    tabella_origine: config.table,
                    title: item[config.titleField] || "Senza titolo",
                    date: new Date(item[config.dateField]),
                    type: config.label.toLowerCase(),
                    color: config.textColor,
                  }))

                allTodayItems.push(...items)
                console.log(`Dashboard Summary - Aggiunti ${items.length} elementi di oggi da ${config.table}`)
              } else {
                console.log(`Dashboard Summary - Nessun elemento di oggi per ${config.table}`)
              }

              // Get next week's items
              console.log(`Dashboard Summary - Cercando elementi prossima settimana per ${config.table}`)

              const nextWeekQuery = supabase
                .from(config.table)
                .select(`id, ${config.titleField}, ${config.dateField}`)
                .eq("id_utente", user.id)
                .gte(config.dateField, tomorrowStart.toISOString())
                .lte(config.dateField, nextWeekEndNormalized.toISOString())
                .order(config.dateField, { ascending: true })
                .limit(10)

              const { data: nextWeekData, error: nextWeekError } = await nextWeekQuery

              if (nextWeekError) {
                console.warn(`Errore nel recupero prossima settimana per ${config.table}:`, nextWeekError)
              } else if (nextWeekData && nextWeekData.length > 0) {
                console.log(
                  `Dashboard Summary - Trovati ${nextWeekData.length} elementi prossima settimana per ${config.table}:`,
                  nextWeekData,
                )

                const items: UpcomingItem[] = nextWeekData
                  .filter((item) => item[config.dateField])
                  .map((item) => ({
                    id_origine: item.id,
                    tabella_origine: config.table,
                    title: item[config.titleField] || "Senza titolo",
                    date: new Date(item[config.dateField]),
                    type: config.label.toLowerCase(),
                    color: config.textColor,
                  }))

                allNextWeekItems.push(...items)
                console.log(
                  `Dashboard Summary - Aggiunti ${items.length} elementi prossima settimana da ${config.table}`,
                )
              } else {
                console.log(`Dashboard Summary - Nessun elemento prossima settimana per ${config.table}`)
              }
            } else {
              console.log(
                `Dashboard Summary - Saltando ricerca date per ${config.table} (count: ${count}, dateField: ${config.dateField})`,
              )
            }
          } catch (err) {
            console.error(`Errore nel recupero dati per ${config.table}:`, err)
          }
        }

        // Sort items by date
        allTodayItems.sort((a, b) => a.date.getTime() - b.date.getTime())
        allNextWeekItems.sort((a, b) => a.date.getTime() - b.date.getTime())

        console.log("Dashboard Summary - RISULTATI FINALI:")
        console.log("- Totale elementi di oggi:", allTodayItems.length)
        console.log("- Totale elementi prossima settimana:", allNextWeekItems.length)
        console.log(
          "- Summary counts:",
          summaryCounts.map((s) => `${s.label}: ${s.count}`),
        )

        setDashboardData({
          summaryCounts,
          todaysItems: allTodayItems,
          nextWeekItems: allNextWeekItems,
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
