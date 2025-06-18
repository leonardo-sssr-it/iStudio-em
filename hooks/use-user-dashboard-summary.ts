"use client"

import { useState, useEffect, useCallback } from "react"
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

interface TableSchema {
  table: string
  columns: string[]
  dateFields: string[]
  titleFields: string[]
}

// Configurazione tabelle - SEMPRE mostrate anche con count 0
const TABLE_CONFIGS = [
  {
    table: "appuntamenti",
    label: "Appuntamenti",
    icon: Calendar,
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    preferredDateFields: ["data_inizio", "data_appuntamento", "scadenza", "data_scadenza"],
    preferredTitleFields: ["titolo", "nome", "descrizione", "contenuto"],
  },
  {
    table: "attivita",
    label: "Attività",
    icon: ClipboardList,
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    preferredDateFields: ["data_inizio", "scadenza", "data_scadenza", "data_appuntamento"],
    preferredTitleFields: ["titolo", "nome", "descrizione", "contenuto"],
  },
  {
    table: "scadenze",
    label: "Scadenze",
    icon: Clock,
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    preferredDateFields: ["scadenza", "data_scadenza", "data_inizio"],
    preferredTitleFields: ["titolo", "nome", "descrizione", "contenuto"],
  },
  {
    table: "todolist",
    label: "Todo",
    icon: CheckSquare,
    color: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
    preferredDateFields: ["scadenza", "data_scadenza", "data_inizio"],
    preferredTitleFields: ["titolo", "nome", "descrizione", "contenuto"],
  },
  {
    table: "progetti",
    label: "Progetti",
    icon: BarChart3,
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    preferredDateFields: ["data_inizio", "data_fine", "scadenza"],
    preferredTitleFields: ["nome", "titolo", "descrizione", "contenuto"],
  },
  {
    table: "clienti",
    label: "Clienti",
    icon: Users,
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    preferredDateFields: ["data_creazione", "data_inizio", "creato_il"],
    preferredTitleFields: ["nome", "titolo", "descrizione", "contenuto"],
  },
  {
    table: "pagine",
    label: "Pagine",
    icon: FileText,
    color: "bg-teal-50 border-teal-200",
    textColor: "text-teal-700",
    preferredDateFields: ["pubblicato", "data_creazione", "creato_il", "modifica"],
    preferredTitleFields: ["titolo", "nome", "estratto", "contenuto"],
  },
  {
    table: "note",
    label: "Note",
    icon: StickyNote,
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    preferredDateFields: ["creato_il", "modifica", "data_creazione", "updated_at"],
    preferredTitleFields: ["titolo", "nome", "contenuto"],
  },
] as const

/**
 * Cache per gli schemi delle tabelle per evitare query ripetute
 */
const schemaCache = new Map<string, TableSchema>()

/**
 * Ottiene lo schema di una tabella con caching
 */
async function getTableSchema(supabase: any, tableName: string): Promise<TableSchema | null> {
  // Controlla cache
  if (schemaCache.has(tableName)) {
    return schemaCache.get(tableName)!
  }

  try {
    // Prima prova con information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .order("ordinal_position")

    if (!schemaError && schemaData && schemaData.length > 0) {
      const columns = schemaData.map((col: any) => col.column_name)
      const dateFields = schemaData
        .filter(
          (col: any) =>
            col.data_type.includes("timestamp") || col.data_type.includes("date") || col.data_type.includes("time"),
        )
        .map((col: any) => col.column_name)

      const titleFields = columns.filter((col: string) =>
        ["titolo", "nome", "descrizione", "contenuto", "estratto"].includes(col.toLowerCase()),
      )

      const schema: TableSchema = {
        table: tableName,
        columns,
        dateFields,
        titleFields,
      }

      // Salva in cache
      schemaCache.set(tableName, schema)
      return schema
    }

    // Fallback: prova a fare una query sulla tabella per ottenere la struttura
    const { data: sampleData, error: sampleError } = await supabase.from(tableName).select("*").limit(1)

    if (!sampleError && sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0])
      const dateFields = columns.filter((col) => {
        const value = sampleData[0][col]
        if (!value) return false
        // Prova a parsare come data
        const date = new Date(value)
        return !isNaN(date.getTime()) && typeof value === "string" && value.includes("-")
      })

      const titleFields = columns.filter((col: string) =>
        ["titolo", "nome", "descrizione", "contenuto", "estratto"].includes(col.toLowerCase()),
      )

      const schema: TableSchema = {
        table: tableName,
        columns,
        dateFields,
        titleFields,
      }

      // Salva in cache
      schemaCache.set(tableName, schema)
      return schema
    }

    return null
  } catch (error) {
    console.warn(`Errore nel recupero schema per ${tableName}:`, error)
    return null
  }
}

/**
 * Ottiene il titolo da un record con sanitizzazione
 */
function getRecordTitle(record: any, availableTitleFields: string[]): string {
  for (const field of availableTitleFields) {
    if (record[field] && typeof record[field] === "string") {
      const content = record[field].trim()
      if (content) {
        // Sanitizza il contenuto per sicurezza
        const sanitized = content.replace(/<[^>]*>/g, "").trim()
        // Se è contenuto lungo, prendi i primi 50 caratteri
        return sanitized.length > 50 ? sanitized.substring(0, 50) + "..." : sanitized
      }
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
  const { user } = useAuth() // Usa il sistema di autenticazione personalizzato
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!supabase || !user) {
      console.log("Dashboard: Supabase o utente non disponibili", { supabase: !!supabase, user: !!user })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log("Dashboard: Inizio caricamento dati per utente", user.id)

      // Converte l'ID utente in numero se necessario
      const userId = Number.parseInt(user.id.toString())
      if (isNaN(userId)) {
        throw new Error("ID utente non valido")
      }

      // Calcola range di date
      const { todayStart, todayEnd } = getTodayRange()
      const { tomorrowStart, nextWeekEnd } = getNextWeekRange()

      // Inizializza sempre tutti i contatori a 0 - SEMPRE MOSTRATI
      const summaryCounts: SummaryCount[] = TABLE_CONFIGS.map((config) => ({
        type: config.table,
        label: config.label,
        count: 0, // Inizializza sempre a 0
        icon: config.icon,
        color: config.color,
        textColor: config.textColor,
      }))

      const todaysItems: UpcomingItem[] = []
      const nextWeekItems: UpcomingItem[] = []

      // Processa le tabelle in parallelo per migliori performance
      const tablePromises = TABLE_CONFIGS.map(async (config, index) => {
        try {
          console.log(`Dashboard: Processando tabella ${config.table}`)

          // Ottieni lo schema della tabella
          const schema = await getTableSchema(supabase, config.table)
          if (!schema) {
            console.warn(`Schema non disponibile per ${config.table}`)
            return
          }

          // Verifica se la tabella ha il campo id_utente
          if (!schema.columns.includes("id_utente")) {
            console.warn(`Tabella ${config.table} non ha campo id_utente`)
            return
          }

          // Get count - SEMPRE eseguito anche se 0
          const { count, error: countError } = await supabase
            .from(config.table)
            .select("*", { count: "exact", head: true })
            .eq("id_utente", userId)

          if (countError) {
            console.warn(`Errore nel conteggio per ${config.table}:`, countError)
            // Non return, continua con count 0
          } else {
            // Aggiorna il count nell'array pre-inizializzato
            summaryCounts[index].count = count || 0
            console.log(`Dashboard: ${config.table} ha ${count || 0} elementi`)
          }

          // Trova il primo campo data disponibile
          const availableDateField = config.preferredDateFields.find((field) => schema.dateFields.includes(field))

          // Trova i campi titolo disponibili
          const availableTitleFields = config.preferredTitleFields.filter((field) => schema.titleFields.includes(field))

          if (!availableDateField || availableTitleFields.length === 0) {
            console.warn(`Campi necessari non trovati per ${config.table}`)
            return
          }

          // Costruisci la query con campi esistenti
          const selectFields = ["id", availableDateField, ...availableTitleFields].join(", ")

          // Logica speciale per progetti con data_inizio e data_fine
          if (
            config.table === "progetti" &&
            schema.dateFields.includes("data_inizio") &&
            schema.dateFields.includes("data_fine")
          ) {
            // Progetti attivi oggi
            const { data: todayProjects, error: todayError } = await supabase
              .from(config.table)
              .select(`id, data_inizio, data_fine, ${availableTitleFields.join(", ")}`)
              .eq("id_utente", userId)
              .lte("data_inizio", todayEnd.toISOString())
              .gte("data_fine", todayStart.toISOString())
              .order("data_inizio", { ascending: true })
              .limit(5)

            if (!todayError && todayProjects) {
              const items: UpcomingItem[] = todayProjects.map((item) => ({
                id_origine: item.id,
                tabella_origine: config.table,
                title: getRecordTitle(item, availableTitleFields),
                date: new Date(item.data_inizio),
                type: config.label.toLowerCase(),
                color: config.textColor,
              }))
              todaysItems.push(...items)
            }

            // Progetti che iniziano nella prossima settimana
            const { data: nextWeekProjects, error: nextWeekError } = await supabase
              .from(config.table)
              .select(`id, data_inizio, data_fine, ${availableTitleFields.join(", ")}`)
              .eq("id_utente", userId)
              .gte("data_inizio", tomorrowStart.toISOString())
              .lte("data_inizio", nextWeekEnd.toISOString())
              .order("data_inizio", { ascending: true })
              .limit(5)

            if (!nextWeekError && nextWeekProjects) {
              const items: UpcomingItem[] = nextWeekProjects.map((item) => ({
                id_origine: item.id,
                tabella_origine: config.table,
                title: getRecordTitle(item, availableTitleFields),
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
              .select(selectFields)
              .eq("id_utente", userId)
              .gte(availableDateField, todayStart.toISOString())
              .lte(availableDateField, todayEnd.toISOString())
              .order(availableDateField, { ascending: true })
              .limit(5)

            if (!todayError && todayData) {
              const items: UpcomingItem[] = todayData.map((item) => ({
                id_origine: item.id,
                tabella_origine: config.table,
                title: getRecordTitle(item, availableTitleFields),
                date: new Date(item[availableDateField]),
                type: config.label.toLowerCase(),
                color: config.textColor,
              }))
              todaysItems.push(...items)
            }

            // Elementi della prossima settimana
            const { data: nextWeekData, error: nextWeekError } = await supabase
              .from(config.table)
              .select(selectFields)
              .eq("id_utente", userId)
              .gte(availableDateField, tomorrowStart.toISOString())
              .lte(availableDateField, nextWeekEnd.toISOString())
              .order(availableDateField, { ascending: true })
              .limit(5)

            if (!nextWeekError && nextWeekData) {
              const items: UpcomingItem[] = nextWeekData.map((item) => ({
                id_origine: item.id,
                tabella_origine: config.table,
                title: getRecordTitle(item, availableTitleFields),
                date: new Date(item[availableDateField]),
                type: config.label.toLowerCase(),
                color: config.textColor,
              }))
              nextWeekItems.push(...items)
            }
          }
        } catch (err) {
          console.warn(`Errore nel recupero dati per ${config.table}:`, err)
          // Non bloccare il processo, continua con le altre tabelle
        }
      })

      // Attendi tutti i risultati con Promise.allSettled per non bloccare su errori
      await Promise.allSettled(tablePromises)

      // Ordina gli elementi per data
      todaysItems.sort((a, b) => a.date.getTime() - b.date.getTime())
      nextWeekItems.sort((a, b) => a.date.getTime() - b.date.getTime())

      // Limita il numero di elementi mostrati
      const finalTodaysItems = todaysItems.slice(0, 10)
      const finalNextWeekItems = nextWeekItems.slice(0, 10)

      console.log("Dashboard: Dati caricati con successo", {
        summaryCounts: summaryCounts.length,
        todaysItems: finalTodaysItems.length,
        nextWeekItems: finalNextWeekItems.length,
      })

      setDashboardData({
        summaryCounts, // Contiene sempre tutte le tabelle, anche con count 0
        todaysItems: finalTodaysItems,
        nextWeekItems: finalNextWeekItems,
      })
    } catch (err: any) {
      console.error("Errore nel recupero dei dati del dashboard:", err)
      setError(err.message || "Errore sconosciuto")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, user?.id])

  const refetch = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    dashboardData,
    isLoading,
    error,
    refetch,
  }
}
