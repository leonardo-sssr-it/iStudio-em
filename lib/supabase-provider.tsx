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
  resetClient: () => void
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const initializationTimeout = useRef<NodeJS.Timeout | null>(null)

  // Funzione per testare la connessione
  const testConnection = useCallback(async (client: SupabaseClient<Database>) => {
    try {
      console.log("🔌 SupabaseProvider: Testing connection...")
      const { data, error } = await client.from("profiles").select("count").limit(1).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 è "no rows returned", che è OK per il test di connessione
        console.error("🔌 SupabaseProvider: Connection test failed:", error)
        return false
      }

      console.log("✅ SupabaseProvider: Connection test successful")
      return true
    } catch (error) {
      console.error("🔌 SupabaseProvider: Connection test error:", error)
      return false
    }
  }, [])

  // Funzione per inizializzare il client
  const initializeClient = useCallback(async () => {
    try {
      console.log("🚀 SupabaseProvider: Initializing Supabase client...")

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables")
      }

      const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // Disabilitiamo la persistenza automatica per evitare conflitti
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })

      console.log("🔧 SupabaseProvider: Client created, testing connection...")

      // Test della connessione
      const isConnectionWorking = await testConnection(client)

      if (isConnectionWorking) {
        setSupabase(client)
        setIsConnected(true)
        setConnectionError(null)
        console.log("✅ SupabaseProvider: Client initialized successfully")
      } else {
        throw new Error("Connection test failed")
      }
    } catch (error) {
      console.error("❌ SupabaseProvider: Initialization failed:", error)
      setConnectionError(error instanceof Error ? error.message : "Unknown error")
      setIsConnected(false)
      setSupabase(null)
    } finally {
      setIsInitializing(false)
    }
  }, [testConnection])

  // Funzione per resettare il client
  const resetClient = useCallback(() => {
    console.log("🔄 SupabaseProvider: Resetting client...")
    setSupabase(null)
    setIsConnected(false)
    setConnectionError(null)
    setIsInitializing(true)

    // Reinizializza dopo un breve delay
    setTimeout(() => {
      initializeClient()
    }, 1000)
  }, [initializeClient])

  // Effetto per l'inizializzazione
  useEffect(() => {
    console.log("🚀 SupabaseProvider: Starting initialization...")

    // Timeout di sicurezza per l'inizializzazione
    initializationTimeout.current = setTimeout(() => {
      if (isInitializing) {
        console.warn("⚠️ SupabaseProvider: Initialization timeout reached")
        setIsInitializing(false)
        setConnectionError("Initialization timeout")
      }
    }, 15000) // 15 secondi

    initializeClient()

    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current)
      }
    }
  }, [initializeClient])

  // Effetto per il monitoraggio periodico della connessione
  useEffect(() => {
    if (!supabase || !isConnected) return

    console.log("🔍 SupabaseProvider: Starting connection monitoring...")

    connectionCheckInterval.current = setInterval(async () => {
      const isStillConnected = await testConnection(supabase)

      if (!isStillConnected && isConnected) {
        console.warn("⚠️ SupabaseProvider: Connection lost, attempting to reconnect...")
        setIsConnected(false)
        setConnectionError("Connection lost")

        // Tentativo di riconnessione
        setTimeout(() => {
          resetClient()
        }, 2000)
      } else if (isStillConnected && !isConnected) {
        console.log("✅ SupabaseProvider: Connection restored")
        setIsConnected(true)
        setConnectionError(null)
      }
    }, 30000) // Controlla ogni 30 secondi

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
      }
    }
  }, [supabase, isConnected, testConnection, resetClient])

  const value = {
    supabase,
    isConnected,
    isInitializing,
    connectionError,
    resetClient,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}
