"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isConnected: boolean
  isInitializing: boolean
  connectionError: string | null
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
  connectionError: null,
})

// Singleton globale per Supabase
let globalSupabaseInstance: SupabaseClient<Database> | null = null
let globalInstanceId = 0

// Stato globale persistente
const globalSupabaseState = {
  isConnected: false,
  isInitializing: true,
  connectionError: null as string | null,
  lastConnectionTest: 0,
  connectionCache: new Map<string, { connected: boolean; timestamp: number }>(),
}

const CONNECTION_CACHE_DURATION = 30000 // 30 secondi
const CONNECTION_TEST_INTERVAL = 60000 // 1 minuto

// Funzione per creare/ottenere l'istanza Supabase
const getSupabaseInstance = (): SupabaseClient<Database> => {
  if (!globalSupabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variabili ambiente Supabase mancanti")
    }

    globalInstanceId++
    globalSupabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Disabilitiamo la persistenza automatica
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    })

    console.log(`SupabaseProvider: Nuova istanza creata (ID: ${globalInstanceId})`)
  }

  return globalSupabaseInstance
}

let renderCount = 0

export function SupabaseProvider({ children }: { children: ReactNode }) {
  renderCount++

  const [state, setState] = useState(() => ({
    supabase: globalSupabaseInstance,
    isConnected: globalSupabaseState.isConnected,
    isInitializing: globalSupabaseState.isInitializing,
    connectionError: globalSupabaseState.connectionError,
  }))

  const testingRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Log ridotti - solo ogni 3 render
  if (renderCount % 3 === 1) {
    console.log(`SupabaseProvider: Render`, {
      isConnected: state.isConnected,
      isInitializing: state.isInitializing,
      hasSupabase: !!state.supabase,
      renderCount,
    })
  }

  const updateState = (newState: Partial<typeof state>) => {
    Object.assign(globalSupabaseState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }
  }

  const testConnection = async (supabase: SupabaseClient<Database>) => {
    if (testingRef.current) return

    const now = Date.now()
    const cacheKey = "connection_test"

    // Usa cache per evitare test ripetuti
    if (globalSupabaseState.connectionCache.has(cacheKey)) {
      const cached = globalSupabaseState.connectionCache.get(cacheKey)!
      if (now - cached.timestamp < CONNECTION_CACHE_DURATION) {
        updateState({
          isConnected: cached.connected,
          isInitializing: false,
          connectionError: cached.connected ? null : "Connessione non disponibile",
        })
        return
      }
    }

    testingRef.current = true

    try {
      console.log("SupabaseProvider: Test connessione...")

      // Test semplice sulla tabella utenti
      const { error } = await supabase.from("utenti").select("id").limit(1).single()

      const isConnected = !error || error.code === "PGRST116" // PGRST116 = no rows returned (ma connessione OK)

      // Salva in cache
      globalSupabaseState.connectionCache.set(cacheKey, {
        connected: isConnected,
        timestamp: now,
      })

      globalSupabaseState.lastConnectionTest = now

      updateState({
        isConnected,
        isInitializing: false,
        connectionError: isConnected ? null : error?.message || "Errore connessione",
      })

      console.log(`SupabaseProvider: Test connessione completato (connesso: ${isConnected})`)
    } catch (error) {
      console.error("SupabaseProvider: Errore test connessione:", error)

      // Salva errore in cache
      globalSupabaseState.connectionCache.set(cacheKey, {
        connected: false,
        timestamp: now,
      })

      updateState({
        isConnected: false,
        isInitializing: false,
        connectionError: error instanceof Error ? error.message : "Errore sconosciuto",
      })
    } finally {
      testingRef.current = false
    }
  }

  useEffect(() => {
    console.log("SupabaseProvider: Inizializzazione...")

    try {
      // Ottieni o crea l'istanza Supabase
      const supabaseInstance = getSupabaseInstance()

      if (globalSupabaseInstance === supabaseInstance) {
        console.log(`SupabaseProvider: Riutilizzo istanza esistente (ID: ${globalInstanceId})`)
      }

      updateState({ supabase: supabaseInstance })

      // Test connessione con debouncing
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          testConnection(supabaseInstance)
        }
      }, 100)
    } catch (error) {
      console.error("SupabaseProvider: Errore inizializzazione:", error)
      updateState({
        isConnected: false,
        isInitializing: false,
        connectionError: error instanceof Error ? error.message : "Errore inizializzazione",
      })
    }

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      console.log("SupabaseProvider: Cleanup")
    }
  }, [])

  // Test periodico della connessione
  useEffect(() => {
    if (!state.supabase || !state.isConnected) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - globalSupabaseState.lastConnectionTest > CONNECTION_TEST_INTERVAL) {
        testConnection(state.supabase!)
      }
    }, CONNECTION_TEST_INTERVAL)

    return () => clearInterval(interval)
  }, [state.supabase, state.isConnected])

  const contextValue: SupabaseContextType = {
    supabase: state.supabase,
    isConnected: state.isConnected,
    isInitializing: state.isInitializing,
    connectionError: state.connectionError,
  }

  return <SupabaseContext.Provider value={contextValue}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase deve essere usato all'interno di SupabaseProvider")
  }
  return context
}

// Funzione per reset esplicito (da usare solo su logout)
export const resetSupabaseState = () => {
  console.log("SupabaseProvider: Reset esplicito dello stato")
  globalSupabaseState.isConnected = false
  globalSupabaseState.isInitializing = true
  globalSupabaseState.connectionError = null
  globalSupabaseState.lastConnectionTest = 0
  globalSupabaseState.connectionCache.clear()
}
