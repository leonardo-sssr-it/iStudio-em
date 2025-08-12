"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isConnected: boolean
  isInitializing: boolean
  error: string | null
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
  error: null,
})

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

// Stato globale persistente per prevenire reset durante unmount/remount
const globalState = {
  supabase: null as SupabaseClient<Database> | null,
  isConnected: false,
  isInitializing: true,
  error: null as string | null,
  instanceId: 0,
  connectionCache: new Map<string, boolean>(),
  lastConnectionTest: 0,
}

let renderCount = 0

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  renderCount++
  const [state, setState] = useState(() => ({
    supabase: globalState.supabase,
    isConnected: globalState.isConnected,
    isInitializing: globalState.isInitializing,
    error: globalState.error,
  }))

  const initializingRef = useRef(false)
  const mountedRef = useRef(true)

  // Funzione per aggiornare sia lo stato locale che globale
  const updateState = (newState: Partial<typeof state>) => {
    Object.assign(globalState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }
  }

  const testConnection = async (supabase: SupabaseClient<Database>): Promise<boolean> => {
    const now = Date.now()
    const cacheKey = "connection_test"

    // Cache del test di connessione per 30 secondi
    if (globalState.connectionCache.has(cacheKey) && now - globalState.lastConnectionTest < 30000) {
      return globalState.connectionCache.get(cacheKey)!
    }

    try {
      const { data, error } = await supabase.from("utenti").select("count").limit(1).single()
      const isConnected = !error

      globalState.connectionCache.set(cacheKey, isConnected)
      globalState.lastConnectionTest = now

      return isConnected
    } catch (error) {
      globalState.connectionCache.set(cacheKey, false)
      globalState.lastConnectionTest = now
      return false
    }
  }

  useEffect(() => {
    const initializeSupabase = async () => {
      if (initializingRef.current || globalState.supabase) {
        if (globalState.supabase) {
          console.log(
            `${new Date().toISOString()} SupabaseProvider: Riutilizzo istanza esistente (ID: ${globalState.instanceId})`,
          )
          updateState({
            supabase: globalState.supabase,
            isConnected: globalState.isConnected,
            isInitializing: false,
            error: globalState.error,
          })
        }
        return
      }

      initializingRef.current = true
      console.log(`${new Date().toISOString()} SupabaseProvider: Inizializzazione...`)

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Variabili ambiente Supabase mancanti")
        }

        const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })

        globalState.instanceId++
        globalState.supabase = supabase

        const isConnected = await testConnection(supabase)

        updateState({
          supabase,
          isConnected,
          isInitializing: false,
          error: null,
        })

        console.log(
          `${new Date().toISOString()} SupabaseProvider: Inizializzazione completata (connesso: ${isConnected})`,
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
        console.error(`${new Date().toISOString()} SupabaseProvider: Errore inizializzazione:`, errorMessage)

        updateState({
          supabase: null,
          isConnected: false,
          isInitializing: false,
          error: errorMessage,
        })
      } finally {
        initializingRef.current = false
      }
    }

    initializeSupabase()

    // Cleanup solo su unmount del componente, non durante la navigazione
    return () => {
      mountedRef.current = false
      // Non resettiamo globalState qui per mantenere lo stato durante la navigazione
      if (renderCount % 10 === 0) {
        // Log ridotto
        console.log(`${new Date().toISOString()} SupabaseProvider: Cleanup`)
      }
    }
  }, [])

  return <SupabaseContext.Provider value={state}>{children}</SupabaseContext.Provider>
}
