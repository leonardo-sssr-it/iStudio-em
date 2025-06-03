"use client"
import { useState, useEffect, useMemo } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { startOfDay, endOfDay, addDays, isWithinInterval, parseISO } from "date-fns"
import type { LucideIcon } from "lucide-react"
import { CalendarDays, ClipboardCheck, AlarmClock, ListChecks, Briefcase, Users } from "lucide-react"

export interface SummaryCount {
  type: string
  label: string
  count: number
  icon: LucideIcon
  color: string // Tailwind background color class
  textColor: string // Tailwind text color class
}

export interface UpcomingItem {
  id: number
  title: string
  date: Date
  type: string
  tabella_origine: string
  id_origine: number
  color?: string // Tailwind text color class for item type
}

export interface UserDashboardData {
  summaryCounts: SummaryCount[]
  todaysItems: UpcomingItem[]
  nextWeekItems: UpcomingItem[]
}

const ITEM_TYPE_DETAILS: Record<
  string,
  { icon: LucideIcon; baseColor: string; textColor: string; itemTextColor: string }
> = {
  appuntamenti: {
    icon: CalendarDays,
    baseColor: "bg-sky-100",
    textColor: "text-sky-700",
    itemTextColor: "text-sky-600",
  },
  attivita: {
    icon: ClipboardCheck,
    baseColor: "bg-rose-100",
    textColor: "text-rose-700",
    itemTextColor: "text-rose-600",
  },
  scadenze: {
    icon: AlarmClock,
    baseColor: "bg-amber-100",
    textColor: "text-amber-700",
    itemTextColor: "text-amber-600",
  },
  todolist: {
    icon: ListChecks,
    baseColor: "bg-violet-100",
    textColor: "text-violet-700",
    itemTextColor: "text-violet-600",
  },
  progetti: {
    icon: Briefcase,
    baseColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    itemTextColor: "text-emerald-600",
  },
  clienti: { icon: Users, baseColor: "bg-slate-100", textColor: "text-slate-700", itemTextColor: "text-slate-600" },
}

const mapRawItemToUpcoming = (
  raw: any,
  type: string,
  dateField: string | string[],
  titleField: string,
  table: string,
): UpcomingItem | null => {
  let dateValue: Date | undefined
  if (Array.isArray(dateField)) {
    for (const field of dateField) {
      if (raw[field]) {
        dateValue = parseISO(raw[field])
        break
      }
    }
  } else if (raw[dateField]) {
    dateValue = parseISO(raw[dateField])
  }

  if (!dateValue) return null

  return {
    id: raw.id,
    title: raw[titleField] || `Item #${raw.id}`,
    date: dateValue,
    type,
    tabella_origine: table,
    id_origine: raw.id,
    color: ITEM_TYPE_DETAILS[type]?.itemTextColor || "text-gray-600",
  }
}

export function useUserDashboardSummary() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayRange = useMemo(
    () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    }),
    [],
  )

  const nextWeekRange = useMemo(
    () => ({
      start: startOfDay(addDays(new Date(), 1)),
      end: endOfDay(addDays(new Date(), 7)),
    }),
    [],
  )

  useEffect(() => {
    if (!supabase || !user) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const userId = user.id
        const fetchedTodaysItems: UpcomingItem[] = []
        const fetchedNextWeekItems: UpcomingItem[] = []
        const summaryCounts: SummaryCount[] = []

        // Helper to fetch and process items
        const processTable = async (
          tableName: string,
          typeLabel: string,
          dateFields: string | string[],
          titleField: string,
        ) => {
          // Construct the select string carefully
          const selectFields = ["id", titleField]
          if (Array.isArray(dateFields)) {
            selectFields.push(...dateFields)
          } else {
            selectFields.push(dateFields)
          }
          // Ensure unique fields in select if titleField or id is also in dateFields
          const uniqueSelectFields = [...new Set(selectFields)].join(", ")

          const {
            data,
            error: fetchError,
            count,
          } = await supabase
            .from(tableName)
            .select(uniqueSelectFields, {
              // Use the constructed unique select string
              count: "exact",
            })
            .eq("id_utente", userId)
          // Removed problematic filter line here

          if (fetchError) {
            console.error(`Error fetching ${tableName}:`, fetchError)
            setError((prevError) =>
              prevError ? `${prevError}\nFailed to fetch ${tableName}` : `Failed to fetch ${tableName}`,
            )
            return { count: 0, items: [] }
          }

          const items: UpcomingItem[] = []
          data?.forEach((rawItem) => {
            const item = mapRawItemToUpcoming(rawItem, typeLabel, dateFields, titleField, tableName)
            if (item) {
              items.push(item)
              if (isWithinInterval(item.date, todayRange)) {
                fetchedTodaysItems.push(item)
              } else if (isWithinInterval(item.date, nextWeekRange)) {
                fetchedNextWeekItems.push(item)
              }
            }
          })
          return { count: count || 0, items }
        }

        // Appuntamenti
        const appuntamentiResult = await processTable("appuntamenti", "appuntamenti", ["data_inizio", "data"], "titolo")
        summaryCounts.push({
          type: "appuntamenti",
          label: "Appuntamenti",
          count: appuntamentiResult.count,
          ...ITEM_TYPE_DETAILS.appuntamenti,
        })

        // Attività
        const attivitaResult = await processTable("attivita", "attivita", "data_inizio", "titolo")
        summaryCounts.push({
          type: "attivita",
          label: "Attività",
          count: attivitaResult.count,
          ...ITEM_TYPE_DETAILS.attivita,
        })

        // Scadenze (Personali)
        const scadenzeResult = await processTable("scadenze", "scadenze", ["data_scadenza", "data"], "titolo")
        summaryCounts.push({
          type: "scadenze",
          label: "Scadenze",
          count: scadenzeResult.count,
          ...ITEM_TYPE_DETAILS.scadenze,
        })

        // Todolist
        let todoTableName = "todolist"
        try {
          // Check if 'todolist' table exists by attempting a lightweight query
          const { error: tableCheckError } = await supabase
            .from("todolist")
            .select("id", { head: true, count: "exact" })
            .limit(0)
          if (tableCheckError && tableCheckError.code === "42P01") {
            // 42P01 is "undefined_table"
            todoTableName = "todo" // Fallback if todolist doesn't exist
          } else if (tableCheckError) {
            // Some other error occurred, log it but proceed with 'todolist' as default
            console.warn(`Error checking for 'todolist' table, defaulting to it:`, tableCheckError.message)
          }
        } catch (e) {
          // Catch any unexpected error during the check, default to 'todolist'
          console.warn(`Unexpected error checking for 'todolist' table, defaulting to it:`, e)
          todoTableName = "todolist" // Or 'todo' if that's a more likely fallback
        }
        const todolistResult = await processTable(todoTableName, "todolist", ["data_scadenza", "data"], "titolo")
        summaryCounts.push({
          type: "todolist",
          label: "Todo List",
          count: todolistResult.count,
          ...ITEM_TYPE_DETAILS.todolist,
        })

        // Progetti (Attivi)
        const { count: progettiCount, error: progettiError } = await supabase
          .from("progetti")
          .select("id", { count: "exact" })
          .eq("id_utente", userId)
          .neq("stato", "Completato")
        if (progettiError) console.error("Error fetching progetti count:", progettiError)
        summaryCounts.push({
          type: "progetti",
          label: "Progetti Attivi",
          count: progettiCount || 0,
          ...ITEM_TYPE_DETAILS.progetti,
        })

        // Clienti
        const { count: clientiCount, error: clientiError } = await supabase
          .from("clienti")
          .select("id", { count: "exact" })
          .eq("id_utente", userId)
        if (clientiError) console.error("Error fetching clienti count:", clientiError)
        summaryCounts.push({
          type: "clienti",
          label: "Clienti",
          count: clientiCount || 0,
          ...ITEM_TYPE_DETAILS.clienti,
        })

        fetchedTodaysItems.sort((a, b) => a.date.getTime() - b.date.getTime())
        fetchedNextWeekItems.sort((a, b) => a.date.getTime() - b.date.getTime())

        setDashboardData({
          summaryCounts,
          todaysItems: fetchedTodaysItems.slice(0, 5),
          nextWeekItems: fetchedNextWeekItems.slice(0, 5),
        })
      } catch (e) {
        console.error("Error fetching user dashboard summary:", e)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, user, todayRange, nextWeekRange])

  return { dashboardData, isLoading, error }
}
