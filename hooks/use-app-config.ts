"use client"

import { useState, useEffect } from "react"
// L'import ora dovrebbe funzionare correttamente
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

export type AppConfig = Database["public"]["Tables"]["configurazione"]["Row"]

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Definisci la funzione di fetch all'interno dell'useEffect
    const fetchConfig = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Crea il client solo quando la funzione viene eseguita nel browser
        const supabase = createClient()
        const { data, error: supabaseError } = await supabase.from("configurazione").select("*").limit(1).maybeSingle()

        if (supabaseError) {
          if (supabaseError.code === "PGRST116") {
            console.warn("Tabella configurazione vuota o nessuna riga trovata.")
            setConfig({} as AppConfig)
          } else {
            throw supabaseError
          }
        }

        setConfig(data || ({} as AppConfig))
      } catch (err: any) {
        console.error("Errore nel caricamento della configurazione:", err)
        setError(err.message || "Errore sconosciuto durante il caricamento della configurazione.")
        setConfig(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, []) // L'array di dipendenze è vuoto perché createClient è stabile

  return { config, isLoading, error }
}

// Hook specifico per recuperare solo la versione (più leggero)
export function useAppVersion() {
  const [version, setVersion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("configurazione").select("versione").limit(1).maybeSingle()

        if (error && error.code !== "PGRST116") {
          console.error("Errore nel caricamento della versione:", error)
        }

        setVersion(data?.versione || "1.0.0")
      } catch (err) {
        console.error("Errore nel caricamento della versione:", err)
        setVersion("1.0.0")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVersion()
  }, [])

  return { version, isLoading }
}
