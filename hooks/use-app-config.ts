"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client" // Assicurati che questo percorso sia corretto
import type { Database } from "@/types/supabase" // Assicurati che questo percorso sia corretto

export type AppConfig = Database["public"]["Tables"]["configurazione"]["Row"]

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: supabaseError } = await supabase
          .from("configurazione")
          .select("*")
          .limit(1) // Prende solo la prima riga, assumendo una config globale
          .maybeSingle() // Restituisce null invece di errore se non ci sono righe

        if (supabaseError) {
          // PGRST116: "Searched for a single row, but found no rows" non è un errore fatale qui
          if (supabaseError.code === "PGRST116") {
            console.warn("Tabella configurazione vuota o nessuna riga trovata.")
            setConfig({} as AppConfig) // Imposta un oggetto vuoto per evitare null, il widget gestirà le chiavi mancanti
          } else {
            throw supabaseError
          }
        }

        setConfig(data || ({} as AppConfig)) // Se data è null (nessuna riga), imposta un oggetto vuoto
      } catch (err: any) {
        console.error("Errore nel caricamento della configurazione:", err)
        setError(err.message || "Errore sconosciuto durante il caricamento della configurazione.")
        setConfig(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [supabase])

  return { config, isLoading, error }
}
