"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { toast } from "@/components/ui/use-toast"

// Importa la funzione helper
import { createSupabaseQuery } from "@/lib/supabase-helpers"

/**
 * Hook personalizzato per recuperare e gestire le tabelle Supabase
 * @returns Stato e funzioni per la gestione delle tabelle
 */
export function useSupabaseTables() {
  const { supabase, isConnected } = useSupabase()
  const [tables, setTables] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRpcInstructions, setShowRpcInstructions] = useState(false)

  // Recupera l'elenco delle tabelle senza usare RPC
  const fetchTables = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setShowRpcInstructions(false)
    try {
      let foundTables = false

      // Approccio 1: Prova a ottenere le tabelle direttamente da information_schema
      try {
        const { data: schemaData, error: schemaError } = await createSupabaseQuery(
          supabase,
          "information_schema.tables",
          "table_name",
        )
          .eq("table_schema", "public")
          .neq("table_type", "VIEW")
          .not("table_name", "like", "pg_%")
          .order("table_name")

        if (!schemaError && schemaData && schemaData.length > 0) {
          const tableNames = schemaData.map((item: any) => item.table_name)
          setTables(tableNames)
          foundTables = true
        }
      } catch (schemaError) {
        console.log("Accesso a information_schema fallito, utilizzo metodo alternativo")
      }

      // Approccio 2: Otteniamo le tabelle dal sistema di storage di Supabase
      if (!foundTables) {
        try {
          const { data: storageData, error: storageError } = await supabase.storage.listBuckets()

          if (!storageError && storageData && storageData.length > 0) {
            // Otteniamo almeno i bucket di storage come esempio
            const tableNames = storageData.map((bucket: any) => bucket.name + " (storage bucket)")
            setTables(tableNames)
            foundTables = true
          }
        } catch (storageError) {
          console.log("Accesso allo storage fallito, utilizzo metodo alternativo")
        }
      }

      // Approccio 3: Prova con alcune tabelle comuni
      if (!foundTables) {
        const commonTables = [
          "utenti",
          "clienti",
          "attivita",
          "progetti",
          "appuntamenti",
          "todolist",
          "scadenze",
          "pagine",
          "media",
          "notifiche",
          "temi",
          "primanota",
        ]
        const foundTablesArray: string[] = []

        for (const table of commonTables) {
          try {
            const { data, error } = await createSupabaseQuery(supabase, table, "*", {
              count: "exact",
              head: true,
            }).limit(1)

            if (!error) {
              foundTablesArray.push(table)
            }
          } catch (e) {
            // Ignora errori per tabelle che non esistono
          }
        }

        if (foundTablesArray.length > 0) {
          setTables(foundTablesArray)
          foundTables = true
        }
      }

      // Se non abbiamo trovato tabelle con nessun metodo, mostriamo le istruzioni
      if (!foundTables) {
        setShowRpcInstructions(true)
        setTables([])
        toast({
          title: "Informazione",
          description: "Non è stato possibile recuperare l'elenco delle tabelle. Verifica la connessione al database.",
          duration: 6000,
        })
      }
    } catch (error) {
      console.error("Errore nel recupero delle tabelle:", error)
      setShowRpcInstructions(true)
      setTables([])
      toast({
        title: "Errore",
        description: "Impossibile recuperare le tabelle. Verifica la connessione al database.",
        variant: "destructive",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Verifica se una tabella esiste senza usare RPC
  const checkTableExists = useCallback(
    async (tableName: string): Promise<boolean> => {
      if (!supabase || !tableName) return false

      try {
        // Se è un bucket di storage, verifichiamo se esiste
        if (tableName.includes("storage bucket")) {
          const bucketName = tableName.replace(" (storage bucket)", "")
          try {
            const { error } = await supabase.storage.getBucket(bucketName)
            return !error
          } catch {
            return false
          }
        } else {
          // Per le tabelle normali, proviamo a fare una query
          try {
            const { error } = await createSupabaseQuery(supabase, tableName, "*", { count: "exact", head: true }).limit(
              1,
            )

            return !error
          } catch {
            return false
          }
        }
      } catch {
        return false
      }
    },
    [supabase],
  )

  // Carica le tabelle quando il componente viene montato
  useEffect(() => {
    let isMounted = true

    if (supabase && isConnected) {
      fetchTables().then(() => {
        if (!isMounted) return
      })
    } else {
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [supabase, isConnected, fetchTables])

  // Ensure tables are always returned as strings
  const tableNames = tables.map((table) => (typeof table === "object" && table.name ? table.name : String(table)))

  return {
    tables: tableNames,
    isLoading,
    showRpcInstructions,
    fetchTables,
    checkTableExists,
  }
}
