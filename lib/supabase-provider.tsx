"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isConnected: boolean
  isInitializing: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
})

// Stato globale per prevenire istanze multiple
const globalSupabaseState = {
  client: null as SupabaseClient<Database> | null,
  isConnected: false,
  isInitializing: true,
  instanceId: 0,
  connectionCache: new Map<string, { result: boolean; timestamp: number }>(),
}

let renderCount = 0

export function SupabaseProvider({ children }: { children: ReactNode }) {
  renderCount++

  const [state, setState] = useState(() => ({
    supabase: globalSupabaseState.client,
    isConnected: globalSupabaseState.isConnected,
    isInitializing: globalSupabaseState.isInitializing,
  }))

  const initializingRef = useRef(false)
  const mountedRef = useRef(true)

  // Log ridotto (ogni 5 render)
  if (renderCount % 5 === 0) {
    console.log(
      `${new Date().toISOString()} SupabaseProvider: Render`,
      JSON.stringify({
        hasClient: !!state.supabase,
        isConnected: state.isConnected,
        isInitializing: state.isInitializing,
        renderCount,
      }),
    )
  }

  useEffect(() => {
    let isMounted = true

    const initializeSupabase = async () => {
      if (initializingRef.current) return
      initializingRef.current = true

      try {
        // Se abbiamo già un client globale, riutilizzalo
        if (globalSupabaseState.client && globalSupabaseState.isConnected) {
          console.log(
            `${new Date().toISOString()} SupabaseProvider: Riutilizzo istanza esistente (ID: ${globalSupabaseState.instanceId})`,
          )
          if (isMounted) {
            setState({
              supabase: globalSupabaseState.client,
              isConnected: globalSupabaseState.isConnected,
              isInitializing: false,
            })
          }
          return
        }

        console.log(`${new Date().toISOString()} SupabaseProvider: Inizializzazione...`)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Variabili ambiente Supabase mancanti")
        }

        // Crea nuovo client se non esiste
        if (!globalSupabaseState.client) {
          globalSupabaseState.instanceId++
          globalSupabaseState.client = createClient<Database>(supabaseUrl, supabaseKey, {
            auth: {
              persistSession: false, // Disabilitiamo la persistenza automatica
              autoRefreshToken: false,
            },
          })
        }

        // Test connessione con cache
        const cacheKey = "connection_test"
        const cached = globalSupabaseState.connectionCache.get(cacheKey)
        const now = Date.now()

        let isConnected = false

        if (cached && now - cached.timestamp < 60000) {
          // Cache valida per 1 minuto
          isConnected = cached.result
        } else {
          // Test connessione
          try {
            const { error } = await globalSupabaseState.client.from("utenti").select("id").limit(1)
            isConnected = !error
            globalSupabaseState.connectionCache.set(cacheKey, { result: isConnected, timestamp: now })
          } catch (error) {
            console.error(`${new Date().toISOString()} SupabaseProvider: Errore test connessione:`, error)
            isConnected = false
            globalSupabaseState.connectionCache.set(cacheKey, { result: false, timestamp: now })
          }
        }

        // Aggiorna stato globale
        globalSupabaseState.isConnected = isConnected
        globalSupabaseState.isInitializing = false

        if (isMounted) {
          setState({
            supabase: globalSupabaseState.client,
            isConnected,
            isInitializing: false,
          })
        }

        console.log(
          `${new Date().toISOString()} SupabaseProvider: Inizializzazione completata (connesso: ${isConnected})`,
        )
      } catch (error) {
        console.error(`${new Date().toISOString()} SupabaseProvider: Errore inizializzazione:`, error)

        globalSupabaseState.isConnected = false
        globalSupabaseState.isInitializing = false

        if (isMounted) {
          setState({
            supabase: globalSupabaseState.client,
            isConnected: false,
            isInitializing: false,
          })
        }
      } finally {
        initializingRef.current = false
      }
    }

    initializeSupabase()

    return () => {
      isMounted = false
      mountedRef.current = false
      // NON resettiamo globalSupabaseState qui per mantenerlo tra i remount
      console.log(`${new Date().toISOString()} SupabaseProvider: Componente smontato`)
    }
  }, [])

  return <SupabaseContext.Provider value={state}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
