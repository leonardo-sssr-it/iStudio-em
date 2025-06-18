"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Calendar,
  Users,
  FileText,
  CheckSquare,
  Briefcase,
  StickyNote,
  Clock,
  Target,
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
  id_origine: string
  tabella_origine: string
  title: string
  date: Date
  type: string
  color: string
}

export interface DashboardData {
  summaryCounts: SummaryCount[]
  todaysItems: UpcomingItem[]
  nextWeekItems: UpcomingItem[]
}

// Configurazione completa delle tabelle - SEMPRE mostrate anche con count 0
const TABLE_CONFIG = {
  appuntamenti: {
    label: "Appuntamenti",
    icon: Calendar,
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    itemColor: "text-blue-600",
    titleFields: ["titolo", "oggetto", "descrizione", "nome", "title"],
    dateFields: ["data_inizio", "data_appuntamento", "data", "created_at", "data_creazione"],
  },
  contatti: {
    label: "Contatti",
    icon: Users,
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    itemColor: "text-green-600",
    titleFields: ["nome", "nome_completo", "ragione_sociale", "titolo", "title"],
    dateFields: ["created_at", "data_creazione", "ultimo_contatto", "data_inserimento"],
  },
  documenti: {
    label: "Documenti",
    icon: FileText,
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    itemColor: "text-purple-600",
    titleFields: ["titolo", "nome_file", "nome", "descrizione", "title"],
    dateFields: ["data_creazione", "created_at", "data_modifica", "updated_at"],
  },
  attivita: {
    label: "Attività",
    icon: CheckSquare,
    color: "bg-red-50 border-red-200",
    textColor: "text-red-700",
    itemColor: "text-red-600",
    titleFields: ["titolo", "nome", "descrizione", "oggetto", "title"],
    dateFields: ["data_scadenza", "scadenza", "data_inizio", "created_at"],
  },
  progetti: {
    label: "Progetti",
    icon: Briefcase,
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-700",
    itemColor: "text-indigo-600",
    titleFields: ["nome", "titolo", "descrizione", "title"],
    dateFields: ["data_inizio", "data_scadenza", "created_at", "data_creazione"],
  },
  note: {
    label: "Note",
    icon: StickyNote,
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    itemColor: "text-orange-600",
    titleFields: ["titolo", "oggetto", "contenuto", "title", "nome"],
    dateFields: ["creato_il", "modifica", "data_creazione", "updated_at", "created_at"],
  },
  scadenze: {
    label: "Scadenze",
    icon: Clock,
    color: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
    itemColor: "text-yellow-600",
    titleFields: ["titolo", "descrizione", "oggetto", "nome", "title"],
    dateFields: ["data_scadenza", "scadenza", "data", "created_at"],
  },
  obiettivi: {
    label: "Obiettivi",
    icon: Target,
    color: "bg-teal-50 border-teal-200",
    textColor: "text-teal-700",
    itemColor: "text-teal-600",
    titleFields: ["titolo", "nome", "descrizione", "obiettivo", "title"],
    dateFields: ["data_scadenza", "scadenza", "data_target", "created_at"],
  },
} as const

interface TableSchema {
  [columnName: string]: {
    data_type: string
    is_nullable: string
  }
}

const schemaCache = new Map<string, TableSchema>()

export function useUserDashboardSummary() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const getTableSchema = useCallback(
    async (tableName: string): Promise<TableSchema> => {
      if (schemaCache.has(tableName)) {
        return schemaCache.get(tableName)!
      }

      try {
        const { data, error } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type, is_nullable")
          .eq("table_name", tableName)
          .eq("table_schema", "public")

        if (error || !data?.length) {
          console.warn(`Schema non disponibile per ${tableName}, uso fallback`)
          const { data: sampleData } = await supabase.from(tableName).select("*").limit(1).single()

          if (sampleData) {
            const schema: TableSchema = {}
            Object.keys(sampleData).forEach((key) => {
              schema[key] = { data_type: "text", is_nullable: "YES" }
            })
            schemaCache.set(tableName, schema)
            return schema
          }
          return {}
        }

        const schema: TableSchema = {}
        data.forEach((col: any) => {
          schema[col.column_name] = {
            data_type: col.data_type,
            is_nullable: col.is_nullable,
          }
        })

        schemaCache.set(tableName, schema)
        return schema
      } catch (error) {
        console.warn(`Errore nel recupero schema per ${tableName}:`, error)
        return {}
      }
    },
    [supabase],
  )

  const sanitizeHtml = useCallback((text: string): string => {
    if (!text || typeof text !== "string") return ""
    return text.replace(/<[^>]*>/g, "").trim()
  }, [])

  const findAvailableField = useCallback((schema: TableSchema, fieldList: string[]): string | null => {
    return fieldList.find((field) => schema[field]) || null
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error("Utente non autenticato")
      }

      const userId = userData.user.id
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Inizializza sempre tutti i contatori a 0
      const summaryCounts: SummaryCount[] = Object.entries(TABLE_CONFIG).map(([tableName, config]) => ({
        type: tableName,
        label: config.label,
        count: 0, // Inizializza sempre a 0
        icon: config.icon,
        color: config.color,
        textColor: config.textColor,
      }))

      const todaysItems: UpcomingItem[] = []
      const nextWeekItems: UpcomingItem[] = []

      // Processa ogni tabella in parallelo
      const tablePromises = Object.entries(TABLE_CONFIG).map(async ([tableName, config]) => {
        try {
          const schema = await getTableSchema(tableName)
          const availableColumns = Object.keys(schema)

          if (availableColumns.length === 0) {
            console.warn(`Tabella ${tableName} non accessibile o vuota`)
            return
          }

          const titleField = findAvailableField(schema, config.titleFields)
          const dateField = findAvailableField(schema, config.dateFields)
          const hasUserField = schema["id_utente"] || schema["user_id"] || schema["utente_id"]

          if (!titleField) {
            console.warn(`Nessun campo titolo trovato per ${tableName}`)
            return
          }

          // Query per il conteggio totale
          let countQuery = supabase.from(tableName).select("*", { count: "exact", head: true })

          if (hasUserField) {
            const userFieldName = schema["id_utente"] ? "id_utente" : schema["user_id"] ? "user_id" : "utente_id"
            countQuery = countQuery.eq(userFieldName, userId)
          }

          const { count } = await countQuery

          // Aggiorna il conteggio per questa tabella
          const summaryIndex = summaryCounts.findIndex((s) => s.type === tableName)
          if (summaryIndex !== -1) {
            summaryCounts[summaryIndex].count = count || 0
          }

          // Se non c'è un campo data, salta la parte degli elementi imminenti
          if (!dateField) {
            return
          }

          // Query per gli elementi imminenti
          const fieldsToSelect = [titleField, dateField, "id"]
          if (hasUserField) {
            const userFieldName = schema["id_utente"] ? "id_utente" : schema["user_id"] ? "user_id" : "utente_id"
            fieldsToSelect.push(userFieldName)
          }

          let itemsQuery = supabase
            .from(tableName)
            .select(fieldsToSelect.join(","))
            .not(dateField, "is", null)
            .gte(dateField, today.toISOString())
            .lte(dateField, nextWeek.toISOString())
            .order(dateField, { ascending: true })
            .limit(5)

          if (hasUserField) {
            const userFieldName = schema["id_utente"] ? "id_utente" : schema["user_id"] ? "user_id" : "utente_id"
            itemsQuery = itemsQuery.eq(userFieldName, userId)
          }

          const { data: items, error: itemsError } = await itemsQuery

          if (itemsError) {
            console.warn(`Errore nel recupero elementi per ${tableName}:`, itemsError)
            return
          }

          if (!items?.length) return

          items.forEach((item: any) => {
            try {
              const itemDate = new Date(item[dateField])
              if (isNaN(itemDate.getTime())) return

              const upcomingItem: UpcomingItem = {
                id_origine: String(item.id || ""),
                tabella_origine: tableName,
                title: sanitizeHtml(String(item[titleField] || "Senza titolo")),
                date: itemDate,
                type: config.label.toLowerCase(),
                color: config.itemColor,
              }

              if (itemDate >= today && itemDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
                todaysItems.push(upcomingItem)
              } else if (itemDate >= new Date(today.getTime() + 24 * 60 * 60 * 1000) && itemDate <= nextWeek) {
                nextWeekItems.push(upcomingItem)
              }
            } catch (error) {
              console.warn(`Errore nel processare elemento di ${tableName}:`, error)
            }
          })
        } catch (error) {
          console.warn(`Errore nel processare tabella ${tableName}:`, error)
        }
      })

      await Promise.allSettled(tablePromises)

      // Ordina gli elementi per data
      todaysItems.sort((a, b) => a.date.getTime() - b.date.getTime())
      nextWeekItems.sort((a, b) => a.date.getTime() - b.date.getTime())

      setDashboardData({
        summaryCounts, // Contiene sempre tutte le tabelle, anche con count 0
        todaysItems,
        nextWeekItems,
      })
    } catch (error) {
      console.error("Errore nel caricamento dashboard:", error)
      setError(error instanceof Error ? error.message : "Errore sconosciuto")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, getTableSchema, findAvailableField, sanitizeHtml])

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
