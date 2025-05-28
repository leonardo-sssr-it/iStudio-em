"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { TablesRepository, type TableInfo } from "@/lib/repositories/tables-repository"
import { toast } from "@/components/ui/use-toast"

/**
 * Hook per la gestione delle tabelle
 * @returns Stato e funzioni per la gestione delle tabelle
 */
export function useTables() {
  const { supabase, isConnected } = useSupabase()
  const [repository, setRepository] = useState<TablesRepository | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Inizializza il repository quando supabase è disponibile
  useEffect(() => {
    if (supabase) {
      setRepository(new TablesRepository(supabase))
    } else {
      setRepository(null)
    }
  }, [supabase])

  // Funzione per recuperare le tabelle
  const fetchTables = useCallback(async () => {
    if (!repository) return

    setIsLoading(true)
    try {
      const tableList = await repository.getTables()
      setTables(tableList)

      if (tableList.length === 0) {
        toast({
          title: "Informazione",
          description: "Nessuna tabella trovata. Potrebbe essere necessario creare una funzione RPC 'get_tables'.",
        })
      }
    } catch (error) {
      console.error("Errore nel recupero delle tabelle:", error)
      toast({
        title: "Errore",
        description: "Impossibile recuperare l'elenco delle tabelle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  // Carica le tabelle quando il componente viene montato
  useEffect(() => {
    if (repository && isConnected) {
      fetchTables()
    } else {
      setTables([])
    }
  }, [repository, isConnected, fetchTables])

  // Ensure tables are always returned as an array of strings
  const tableNames = tables.map((table) => (typeof table === "object" && table.name ? table.name : String(table)))

  return {
    tables: tableNames,
    isLoading,
    fetchTables,
    repository,
  }
}
