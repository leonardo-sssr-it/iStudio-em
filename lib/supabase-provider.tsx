"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isInitialized: boolean
  resetClient: () => void
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isInitialized: false,
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
  const [isInitialized, setIsInitialized] = useState(false)
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializationAttemptRef = useRef(0)

  const createSupabaseClient = () => {
    console.log("🔧 SupabaseProvider: Creating new Supabase client...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ SupabaseProvider: Missing environment variables")
      console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
      console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey)
      return null
    }

    try {
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

      console.log("✅ SupabaseProvider: Client created successfully")
      return client
    } catch (error) {
      console.error("❌ SupabaseProvider: Error creating client:", error)
      return null
    }
  }

  const testConnection = async (client: SupabaseClient<Database>) => {
    try {
      console.log("🔍 SupabaseProvider: Testing connection...")
      const { data, error } = await client.from("utenti").select("count").limit(1).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, ma connessione OK
        console.warn("⚠️ SupabaseProvider: Connection test warning:", error.message)
        return false
      }

      console.log("✅ SupabaseProvider: Connection test successful")
      return true
    } catch (error) {
      console.error("❌ SupabaseProvider: Connection test failed:", error)
      return false
    }
  }

  const initializeSupabase = async () => {
    initializationAttemptRef.current++
    const attemptNumber = initializationAttemptRef.current

    console.log(`🚀 SupabaseProvider: Initialization attempt #${attemptNumber}`)

    const client = createSupabaseClient()
    if (!client) {
      console.error("❌ SupabaseProvider: Failed to create client")
      return
    }

    // Test della connessione
    const isConnected = await testConnection(client)
    if (!isConnected) {
      console.error("❌ SupabaseProvider: Connection test failed")

      // Retry dopo 5 secondi se è il primo tentativo
      if (attemptNumber === 1) {
        console.log("🔄 SupabaseProvider: Retrying in 5 seconds...")
        setTimeout(() => initializeSupabase(), 5000)
      }
      return
    }

    setSupabase(client)
    setIsInitialized(true)
    console.log("✅ SupabaseProvider: Initialization completed successfully")

    // Avvia il monitoraggio della connessione
    startConnectionMonitoring(client)
  }

  const startConnectionMonitoring = (client: SupabaseClient<Database>) => {
    // Pulisci eventuali interval esistenti
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current)
    }

    console.log("🔍 SupabaseProvider: Starting connection monitoring...")

    connectionCheckIntervalRef.current = setInterval(async () => {
      const isConnected = await testConnection(client)
      if (!isConnected) {
        console.warn("⚠️ SupabaseProvider: Connection lost, attempting to reconnect...")
        initializeSupabase()
      }
    }, 30000) // Controlla ogni 30 secondi
  }

  const resetClient = () => {
    console.log("🔄 SupabaseProvider: Resetting client...")

    // Pulisci interval
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current)
      connectionCheckIntervalRef.current = null
    }

    setSupabase(null)
    setIsInitialized(false)
    initializationAttemptRef.current = 0

    // Reinizializza dopo un breve delay
    setTimeout(() => initializeSupabase(), 1000)
  }

  useEffect(() => {
    initializeSupabase()

    // Cleanup
    return () => {
      console.log("🧹 SupabaseProvider: Cleaning up...")
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current)
      }
    }
  }, [])

  const value = {
    supabase,
    isInitialized,
    resetClient,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}
