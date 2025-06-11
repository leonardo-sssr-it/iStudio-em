"use client"

import { useState, useEffect } from "react"
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
  const [version, setVersion] = useState<string>("1.0.0") // Default value
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const supabase = createClient()

        // Proviamo direttamente a recuperare la versione dalla tabella configurazione
        const { data, error } = await supabase.from("configurazione").select("versione").limit(1).maybeSingle()

        if (error) {
          // Gestiamo i diversi tipi di errore
          if (error.code === "PGRST116") {
            // Tabella vuota - usiamo il valore di default
            console.warn("Tabella configurazione vuota, usando versione di default")
            setError("Tabella configurazione vuota")
          } else if (error.code === "42P01") {
            // Tabella non esiste
            console.warn("Tabella configurazione non esiste, usando versione di default")
            setError("Tabella configurazione non trovata")
          } else if (error.code === "42703") {
            // Colonna non esiste
            console.warn("Campo versione non esiste nella tabella configurazione")
            setError("Campo versione non trovato")
          } else {
            // Altri errori
            console.error("Errore nel caricamento della versione:", error)
            setError(error.message || "Errore sconosciuto")
          }
        } else if (data && data.versione) {
          // Successo - abbiamo trovato la versione
          setVersion(data.versione)
          setError(null)
        } else {
          // Dati trovati ma versione vuota
          console.warn("Campo versione vuoto nella tabella configurazione")
          setError("Campo versione vuoto")
        }
      } catch (err: any) {
        console.error("Errore nel caricamento della versione:", err)
        setError(err.message || "Errore di connessione")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVersion()
  }, [])

  return { version, isLoading, error }
}
