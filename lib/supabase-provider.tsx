"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isReady: boolean
  resetClient: () => void
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isReady: false,
  resetClient: () => {},
})

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isReady, setIsReady] = useState(false)
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializationAttemptedRef = useRef(false)

  const createSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("🚨 SupabaseProvider: Missing environment variables")
      console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey)
      return null
    }

    console.log("🔧 SupabaseProvider: Creating Supabase client...")

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

    return client
  }

  const testConnection = async (client: SupabaseClient<Database>) => {
    try {
      console.log("🔍 SupabaseProvider: Testing connection...")
      const { data, error } = await client.from("profiles").select("count").limit(1).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, che va bene
        console.error("❌ SupabaseProvider: Connection test failed:", error)
        return false
      }

      console.log("✅ SupabaseProvider: Connection test successful")
      return true
    } catch (error) {
      console.error("❌ SupabaseProvider: Connection test error:", error)
      return false
    }
  }

  const initializeSupabase = async () => {
    if (initializationAttemptedRef.current) {
      console.log("⏭️ SupabaseProvider: Initialization already attempted")
      return
    }

    initializationAttemptedRef.current = true
    console.log("🚀 SupabaseProvider: Starting initialization...")

    try {
      const client = createSupabaseClient()
      if (!client) {
        console.error("❌ SupabaseProvider: Failed to create client")
        return
      }

      // Test della connessione
      const isConnected = await testConnection(client)
      if (!isConnected) {
        console.error("❌ SupabaseProvider: Connection test failed")
        return
      }

      setSupabase(client)
      setIsReady(true)
      console.log("✅ SupabaseProvider: Initialization completed successfully")

      // Avvia il monitoraggio della connessione
      startConnectionMonitoring(client)
    } catch (error) {
      console.error("❌ SupabaseProvider: Initialization error:", error)
    }
  }

  const startConnectionMonitoring = (client: SupabaseClient<Database>) => {
    // Pulisci eventuali interval esistenti
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current)
    }

    console.log("📡 SupabaseProvider: Starting connection monitoring...")

    connectionCheckIntervalRef.current = setInterval(async () => {
      try {
        const isConnected = await testConnection(client)
        if (!isConnected) {
          console.warn("⚠️ SupabaseProvider: Connection lost, attempting to reconnect...")

          // Tenta di ricreare il client
          const newClient = createSupabaseClient()
          if (newClient) {
            const reconnected = await testConnection(newClient)
            if (reconnected) {
              setSupabase(newClient)
              console.log("✅ SupabaseProvider: Reconnection successful")
            }
          }
        }
      } catch (error) {
        console.error("❌ SupabaseProvider: Connection monitoring error:", error)
      }
    }, 30000) // Controlla ogni 30 secondi
  }

  const resetClient = () => {
    console.log("🔄 SupabaseProvider: Resetting client...")

    // Pulisci gli interval
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current)
      connectionCheckIntervalRef.current = null
    }

    // Reset dello stato
    setSupabase(null)
    setIsReady(false)
    initializationAttemptedRef.current = false

    // Reinizializza
    setTimeout(() => {
      initializeSupabase()
    }, 1000)
  }

  useEffect(() => {
    initializeSupabase()

    // Cleanup
    return () => {
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current)
      }
    }
  }, [])

  const value = {
    supabase,
    isReady,
    resetClient,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}
