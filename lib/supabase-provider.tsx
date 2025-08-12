"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isConnected: boolean
  isInitializing: boolean
  connectionError: string | null
  testConnection: () => Promise<boolean>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

// Stato globale persistente per prevenire reset durante unmount/remount
const globalSupabaseState = {
  client: null as SupabaseClient<Database> | null,
  isConnected: false,
  isInitializing: false,
  connectionError: null as string | null,
  instanceId: 0,
  lastConnectionTest: 0,
  connectionCache: new Map<string, { result: boolean; timestamp: number }>(),
}

let renderCount = 0

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  renderCount++

  // Inizializza lo stato dal globalState
  const [state, setState] = useState(() => ({
    supabase: globalSupabaseState.client,
    isConnected: globalSupabaseState.isConnected,
    isInitializing: globalSupabaseState.isInitializing,
    connectionError: globalSupabaseState.connectionError,
  }))

  const initializingRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Funzione per aggiornare sia lo stato locale che globale
  const updateState = useCallback((newState: Partial<typeof state>) => {
    Object.assign(globalSupabaseState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }
  }, [])

  // Log ridotto (ogni 3 render)
  if (renderCount % 3 === 0) {
    console.log(
      `${new Date().toISOString()} SupabaseProvider: Render`,
      JSON.stringify({
        isConnected: state.isConnected,
        isInitializing: state.isInitializing,
        hasClient: !!state.supabase,
        instanceId: globalSupabaseState.instanceId,
        renderCount,
      }),
    )
  }

  const initializeSupabase = useCallback(async () => {
    if (initializingRef.current || globalSupabaseState.client) {
      return
    }

    initializingRef.current = true
    globalSupabaseState.instanceId++

    console.log(`${new Date().toISOString()} SupabaseProvider: Inizializzazione...`)

    if (globalSupabaseState.client) {
      console.log(
        `${new Date().toISOString()} SupabaseProvider: Riutilizzo istanza esistente (ID: ${globalSupabaseState.instanceId})`,
      )
      updateState({
        supabase: globalSupabaseState.client,
        isConnected: globalSupabaseState.isConnected,
        isInitializing: false,
      })
      initializingRef.current = false
      return
    }

    updateState({ isInitializing: true, connectionError: null })

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Variabili ambiente Supabase mancanti")
      }

      const client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            "x-client-info": "istudio-v0.4",
          },
        },
      })

      // Test di connessione con cache
      const cacheKey = "connection_test"
      const now = Date.now()
      const cached = globalSupabaseState.connectionCache.get(cacheKey)

      let isConnected = false

      if (cached && now - cached.timestamp < 30000) {
        // Cache per 30 secondi
        isConnected = cached.result
        console.log(`${new Date().toISOString()} SupabaseProvider: Uso cache connessione: ${isConnected}`)
      } else {
        try {
          const { data, error } = await client.from("utenti").select("count").limit(1).single()
          isConnected = !error
          globalSupabaseState.connectionCache.set(cacheKey, { result: isConnected, timestamp: now })
          console.log(`${new Date().toISOString()} SupabaseProvider: Test connessione: ${isConnected}`)
        } catch (testError) {
          console.warn(`${new Date().toISOString()} SupabaseProvider: Errore test connessione:`, testError)
          isConnected = false
          globalSupabaseState.connectionCache.set(cacheKey, { result: false, timestamp: now })
        }
      }

      globalSupabaseState.client = client
      globalSupabaseState.isConnected = isConnected
      globalSupabaseState.lastConnectionTest = now

      updateState({
        supabase: client,
        isConnected,
        isInitializing: false,
        connectionError: null,
      })

      console.log(
        `${new Date().toISOString()} SupabaseProvider: Inizializzazione completata (connesso: ${isConnected})`,
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
      console.error(`${new Date().toISOString()} SupabaseProvider: Errore inizializzazione:`, error)

      globalSupabaseState.connectionError = errorMessage

      updateState({
        isInitializing: false,
        connectionError: errorMessage,
      })
    } finally {
      initializingRef.current = false
    }
  }, [updateState])

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!state.supabase) return false

    const cacheKey = "manual_test"
    const now = Date.now()
    const cached = globalSupabaseState.connectionCache.get(cacheKey)

    if (cached && now - cached.timestamp < 10000) {
      // Cache per 10 secondi
      return cached.result
    }

    try {
      const { error } = await state.supabase.from("utenti").select("count").limit(1).single()
      const result = !error
      globalSupabaseState.connectionCache.set(cacheKey, { result, timestamp: now })

      if (result !== state.isConnected) {
        globalSupabaseState.isConnected = result
        updateState({ isConnected: result })
      }

      return result
    } catch (error) {
      console.error(`${new Date().toISOString()} SupabaseProvider: Errore test connessione:`, error)
      globalSupabaseState.connectionCache.set(cacheKey, { result: false, timestamp: now })
      return false
    }
  }, [state.supabase, state.isConnected, updateState])

  useEffect(() => {
    // Timeout di sicurezza per inizializzazione
    timeoutRef.current = setTimeout(() => {
      if (!globalSupabaseState.client && !initializingRef.current) {
        initializeSupabase()
      }
    }, 100)

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // NON resettiamo globalSupabaseState qui per mantenerlo tra i remount
      console.log(`${new Date().toISOString()} SupabaseProvider: Cleanup`)
    }
  }, [initializeSupabase])

  const contextValue: SupabaseContextType = {
    supabase: state.supabase,
    isConnected: state.isConnected,
    isInitializing: state.isInitializing,
    connectionError: state.connectionError,
    testConnection,
  }

  return <SupabaseContext.Provider value={contextValue}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
