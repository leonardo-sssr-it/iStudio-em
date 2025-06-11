"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

export type AppConfig = Database["public"]["Tables"]["configurazione"]["Row"]

// Chiavi per sessionStorage
const CONFIG_STORAGE_KEY = "app_config"
const CONFIG_TIMESTAMP_KEY = "app_config_timestamp"
const CONFIG_CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

// Configurazione di default
const DEFAULT_CONFIG: Partial<AppConfig> = {
  versione: "1.0.0",
  nome_app: "iStudio",
  descrizione: "Sistema di gestione integrato",
}

// Utility per gestire sessionStorage
const getStoredConfig = (): AppConfig | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = sessionStorage.getItem(CONFIG_STORAGE_KEY)
    const timestamp = sessionStorage.getItem(CONFIG_TIMESTAMP_KEY)

    if (!stored || !timestamp) return null

    // Verifica se la cache è scaduta
    const now = Date.now()
    const storedTime = Number.parseInt(timestamp, 10)

    if (now - storedTime > CONFIG_CACHE_DURATION) {
      // Cache scaduta, rimuovi i dati
      sessionStorage.removeItem(CONFIG_STORAGE_KEY)
      sessionStorage.removeItem(CONFIG_TIMESTAMP_KEY)
      return null
    }

    return JSON.parse(stored) as AppConfig
  } catch (error) {
    console.error("Errore nel recupero della configurazione dalla sessione:", error)
    return null
  }
}

const setStoredConfig = (config: AppConfig): void => {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    sessionStorage.setItem(CONFIG_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error("Errore nel salvataggio della configurazione in sessione:", error)
  }
}

const clearStoredConfig = (): void => {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem(CONFIG_STORAGE_KEY)
    sessionStorage.removeItem(CONFIG_TIMESTAMP_KEY)
  } catch (error) {
    console.error("Errore nella pulizia della configurazione dalla sessione:", error)
  }
}

// Hook principale per la configurazione
export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(
    async (forceRefresh = false) => {
      // Evita chiamate multiple se già in caricamento
      if (isLoading && !forceRefresh) {
        return config
      }

      setIsLoading(true)
      setError(null)

      try {
        // Controlla prima la cache se non è un refresh forzato
        if (!forceRefresh) {
          const cachedConfig = getStoredConfig()
          if (cachedConfig) {
            setConfig(cachedConfig)
            setIsLoading(false)
            return cachedConfig
          }
        }

        // Carica dal database
        const supabase = createClient()
        const { data, error: supabaseError } = await supabase.from("configurazione").select("*").limit(1).maybeSingle()

        if (supabaseError) {
          if (supabaseError.code === "PGRST116") {
            // Tabella vuota - usa configurazione di default
            console.warn("Tabella configurazione vuota, usando configurazione di default")
            const defaultConfig = { ...DEFAULT_CONFIG } as AppConfig
            setConfig(defaultConfig)
            setStoredConfig(defaultConfig)
            setError("Configurazione di default")
            return defaultConfig
          } else if (supabaseError.code === "42P01") {
            // Tabella non esiste
            console.warn("Tabella configurazione non esiste, usando configurazione di default")
            const defaultConfig = { ...DEFAULT_CONFIG } as AppConfig
            setConfig(defaultConfig)
            setError("Tabella non trovata")
            return defaultConfig
          } else {
            throw supabaseError
          }
        }

        // Merge con configurazione di default per campi mancanti
        const finalConfig = { ...DEFAULT_CONFIG, ...data } as AppConfig

        setConfig(finalConfig)
        setStoredConfig(finalConfig)
        setError(null)

        return finalConfig
      } catch (err: any) {
        console.error("Errore nel caricamento della configurazione:", err)
        setError(err.message || "Errore sconosciuto")

        // In caso di errore, usa la configurazione di default
        const defaultConfig = { ...DEFAULT_CONFIG } as AppConfig
        setConfig(defaultConfig)
        return defaultConfig
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, config],
  )

  const refreshConfig = useCallback(() => {
    clearStoredConfig()
    return fetchConfig(true)
  }, [fetchConfig])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    isLoading,
    error,
    refreshConfig,
    clearCache: clearStoredConfig,
  }
}

// Hook semplificato per la versione
export function useAppVersion() {
  const { config, isLoading, error } = useAppConfig()

  return {
    version: config?.versione || DEFAULT_CONFIG.versione || "1.0.0",
    isLoading,
    error,
  }
}

// Hook per singoli valori di configurazione
export function useConfigValue<K extends keyof AppConfig>(
  key: K,
): {
  value: AppConfig[K] | undefined
  isLoading: boolean
  error: string | null
} {
  const { config, isLoading, error } = useAppConfig()

  return {
    value: config?.[key],
    isLoading,
    error,
  }
}

// Utility functions per accesso diretto (non reactive)
export const getConfigValue = <K extends keyof AppConfig>(key: K): AppConfig[K] | undefined => {
  const stored = getStoredConfig()
  return stored?.[key] || (DEFAULT_CONFIG as AppConfig)[key]
}

export const getAppVersion = (): string => {
  return getConfigValue("versione") || "1.0.0"
}

export const getAppName = (): string => {
  return getConfigValue("nome_app") || "iStudio"
}

export const getAppDescription = (): string => {
  return getConfigValue("descrizione") || "Sistema di gestione integrato"
}

// Context provider per configurazione globale (opzionale)
export const AppConfigContext = React.createContext<{
  config: AppConfig | null
  isLoading: boolean
  error: string | null
  refreshConfig: () => Promise<AppConfig>
  clearCache: () => void
} | null>(null)
