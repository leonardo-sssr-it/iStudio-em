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

        // Fetch counts for each table
        const summaryCounts: SummaryCount[] = []
        const allUpcomingItems: UpcomingItem[] = []

        for (const config of TABLE_CONFIGS) {
          try {
            // Get count
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

            // Get upcoming items (only if table has date field)
            if (config.dateField) {
              const today = new Date()
              const nextWeek = new Date()
              nextWeek.setDate(today.getDate() + 7)

              const { data: upcomingData, error: upcomingError } = await supabase
                .from(config.table)
                .select(`id, ${config.titleField}, ${config.dateField}`)
                .eq("id_utente", user.id)
                .gte(config.dateField, today.toISOString())
                .lte(config.dateField, nextWeek.toISOString())
                .order(config.dateField, { ascending: true })
                .limit(5)

              if (!upcomingError && upcomingData) {
                const items: UpcomingItem[] = upcomingData.map((item) => ({
                  id_origine: item.id,
                  tabella_origine: config.table,
                  title: item[config.titleField] || "Senza titolo",
                  date: new Date(item[config.dateField]),
                  type: config.label.toLowerCase(),
                  color: config.textColor,
                }))

                allUpcomingItems.push(...items)
              }
            }
          } catch (err) {
            console.warn(`Errore nel recupero dati per ${config.table}:`, err)
          }
        }

        // Sort upcoming items by date
        allUpcomingItems.sort((a, b) => a.date.getTime() - b.date.getTime())

        // Separate today's items from next week's items
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const todaysItems = allUpcomingItems.filter((item) => item.date >= todayStart && item.date < todayEnd)

        const nextWeekItems = allUpcomingItems.filter((item) => item.date >= todayEnd).slice(0, 10)

        setDashboardData({
          summaryCounts,
          todaysItems,
          nextWeekItems,
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
