"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { sanitizeIdentifier } from "@/lib/utils"

interface FilterOptions {
  column: string
  value: any
  operator?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike"
}

export function useTableData(tableName: string, filter?: FilterOptions) {
  const { supabase } = useSupabase()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Funzione per recuperare i dati
  const fetchData = useCallback(async () => {
    if (!supabase || !tableName) {
      setData([])
      setIsLoading(false)
      return
    }

    // Verifica che tableName sia una stringa valida
    if (typeof tableName !== "string") {
      console.error("Nome tabella non valido:", tableName)
      setError(new Error(`Nome tabella non valido: ${String(tableName)}`))
      setData([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching data from table: ${tableName}`)

      // Sanitizza il nome della tabella
      const sanitizedTableName = sanitizeIdentifier(tableName)
      if (!sanitizedTableName) {
        throw new Error(`Nome tabella non valido dopo sanitizzazione: ${tableName}`)
      }

      let query = supabase.from(sanitizedTableName).select("*", { count: "exact" })

      // Applica il filtro se specificato
      if (filter && filter.column && filter.value !== undefined) {
        const operator = filter.operator || "eq"
        const sanitizedColumn = sanitizeIdentifier(filter.column)

        if (!sanitizedColumn) {
          throw new Error(`Nome colonna non valido dopo sanitizzazione: ${filter.column}`)
        }

        console.log(`Applying filter: ${sanitizedColumn} ${operator} ${filter.value}`)

        switch (operator) {
          case "eq":
            query = query.eq(sanitizedColumn, filter.value)
            break
          case "neq":
            query = query.neq(sanitizedColumn, filter.value)
            break
          case "gt":
            query = query.gt(sanitizedColumn, filter.value)
            break
          case "gte":
            query = query.gte(sanitizedColumn, filter.value)
            break
          case "lt":
            query = query.lt(sanitizedColumn, filter.value)
            break
          case "lte":
            query = query.lte(sanitizedColumn, filter.value)
            break
          case "like":
            query = query.like(sanitizedColumn, filter.value)
            break
          case "ilike":
            query = query.ilike(sanitizedColumn, filter.value)
            break
        }
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      console.log(`Fetched ${data?.length || 0} rows from ${tableName}`)
      setData(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error(`Errore nel recupero dei dati dalla tabella ${tableName}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, tableName, filter])

  // Effetto per recuperare i dati quando cambiano le dipendenze
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    totalCount,
    refresh: fetchData,
  }
}
