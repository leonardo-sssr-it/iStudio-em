"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { normalizeDate } from "@/lib/date-utils"
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
    dateField: "data_appuntamento",
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
    titleField: "nome",
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

        // Calcolo date usando normalizeDate
        const today = new Date()
        const todayStart = normalizeDate(today, "start") // 00:00:00.000
        const todayEnd = normalizeDate(today, "end") // 23:59:59.999

        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const tomorrowStart = normalizeDate(tomorrow, "start") // 00:00:00.001 del giorno dopo

        const nextWeekEnd = new Date(today)
        nextWeekEnd.setDate(today.getDate() + 7)
        const nextWeekEndNormalized = normalizeDate(nextWeekEnd, "end") // 23:59:59.999 tra 7 giorni

        // Aggiungo 1 millisecondo per evitare sovrapposizioni
        const todayStartPlusOne = new Date(todayStart!.getTime() + 1)
        const tomorrowStartPlusOne = new Date(tomorrowStart!.getTime() + 1)

        console.log("Date range per oggi:", {
          start: todayStartPlusOne.toISOString(),
          end: todayEnd?.toISOString(),
        })

        console.log("Date range per prossima settimana:", {
          start: tomorrowStartPlusOne.toISOString(),
          end: nextWeekEndNormalized?.toISOString(),
        })

        // Fetch counts for each table
        const summaryCounts: SummaryCount[] = []
        const allTodayItems: UpcomingItem[] = []
        const allNextWeekItems: UpcomingItem[] = []

        for (const config of TABLE_CONFIGS) {
          try {
            // Get count (mantieni questa parte)
            const { count, error: countError } = await supabase
              .from(config.table)
              .select("*", { count: "exact", head: true })
              .eq("id_utente", user.id)

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

            // Get today's items
            if (config.dateField && todayStartPlusOne && todayEnd) {
              const { data: todayData, error: todayError } = await supabase
                .from(config.table)
                .select(`id, ${config.titleField}, ${config.dateField}`)
                .eq("id_utente", user.id)
                .gte(config.dateField, todayStartPlusOne.toISOString())
                .lte(config.dateField, todayEnd.toISOString())
                .order(config.dateField, { ascending: true })

              if (!todayError && todayData && todayData.length > 0) {
                console.log(`Elementi di oggi per ${config.table}:`, todayData.length)

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
              }
            }

            // Get next week's items
            if (config.dateField && tomorrowStartPlusOne && nextWeekEndNormalized) {
              const { data: nextWeekData, error: nextWeekError } = await supabase
                .from(config.table)
                .select(`id, ${config.titleField}, ${config.dateField}`)
                .eq("id_utente", user.id)
                .gte(config.dateField, tomorrowStartPlusOne.toISOString())
                .lte(config.dateField, nextWeekEndNormalized.toISOString())
                .order(config.dateField, { ascending: true })
                .limit(10)

              if (!nextWeekError && nextWeekData && nextWeekData.length > 0) {
                console.log(`Elementi prossima settimana per ${config.table}:`, nextWeekData.length)

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
              }
            }
          } catch (err) {
            console.warn(`Errore nel recupero dati per ${config.table}:`, err)
          }
        }

        // Sort items by date
        allTodayItems.sort((a, b) => a.date.getTime() - b.date.getTime())
        allNextWeekItems.sort((a, b) => a.date.getTime() - b.date.getTime())

        console.log("Totale elementi di oggi:", allTodayItems.length)
        console.log("Totale elementi prossima settimana:", allNextWeekItems.length)

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
