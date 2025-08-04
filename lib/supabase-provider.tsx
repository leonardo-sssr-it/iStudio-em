"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

interface SupabaseContextType {
  supabase: SupabaseClient<Database> | null
  isConnected: boolean
  isInitializing: boolean
  connectionError: string | null
  resetClient: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
  connectionError: null,
  resetClient: async () => {},
})

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const initializationAttempted = useRef(false)
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)

  const testConnection = useCallback(async (client: SupabaseClient<Database>): Promise<boolean> => {
    try {
      console.log("SupabaseProvider: Testing database connection...")

      // Test basic connectivity with a simple query
      const { data, error } = await client.from("utenti").select("id").limit(1).maybeSingle()

      if (error) {
        // If it's a "no rows" error, that's actually fine - it means we can connect
        if (error.message.includes("multiple (or no) rows returned")) {
          console.log("SupabaseProvider: Connection test successful (no rows returned)")
          return true
        }
        console.error("SupabaseProvider: Connection test failed:", error.message)
        return false
      }

      console.log("SupabaseProvider: Connection test successful")
      return true
    } catch (error) {
      console.error("SupabaseProvider: Connection test error:", error)
      return false
    }
  }, [])

  const initializeClient = useCallback(async () => {
    if (initializationAttempted.current) {
      console.log("SupabaseProvider: Initialization already attempted")
      return
    }

    initializationAttempted.current = true
    console.log("SupabaseProvider: Starting client initialization...")

    try {
      // Verify environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables")
      }

      console.log("SupabaseProvider: Environment variables verified")
      console.log("SupabaseProvider: Supabase URL:", supabaseUrl)

      // Create client
      const client = createClient()
      console.log("SupabaseProvider: Client created successfully")

      // Test connection
      const connectionSuccessful = await testConnection(client)

      if (connectionSuccessful) {
        setSupabase(client)
        setIsConnected(true)
        setConnectionError(null)
        console.log("SupabaseProvider: Client initialized and connected successfully")
      } else {
        throw new Error("Failed to establish database connection")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown initialization error"
      console.error("SupabaseProvider: Initialization failed:", errorMessage)
      setConnectionError(errorMessage)
      setIsConnected(false)
      setSupabase(null)
    } finally {
      setIsInitializing(false)
    }
  }, [testConnection])

  const resetClient = useCallback(async () => {
    console.log("SupabaseProvider: Resetting client...")

    // Clear connection check interval
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current)
      connectionCheckInterval.current = null
    }

    // Reset state
    setSupabase(null)
    setIsConnected(false)
    setConnectionError(null)
    setIsInitializing(true)
    initializationAttempted.current = false

    // Reinitialize
    await initializeClient()
  }, [initializeClient])

  const startConnectionMonitoring = useCallback(() => {
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current)
    }

    console.log("SupabaseProvider: Starting connection monitoring...")

    connectionCheckInterval.current = setInterval(async () => {
      if (supabase && isConnected) {
        const isStillConnected = await testConnection(supabase)
        if (!isStillConnected) {
          console.warn("SupabaseProvider: Connection lost, attempting to reconnect...")
          setIsConnected(false)
          await resetClient()
        }
      }
    }, 30000) // Check every 30 seconds
  }, [supabase, isConnected, testConnection, resetClient])

  // Initialize client on mount
  useEffect(() => {
    console.log("SupabaseProvider: Component mounted, initializing...")
    initializeClient()

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
      }
    }
  }, [initializeClient])

  // Start monitoring when connected
  useEffect(() => {
    if (isConnected && supabase) {
      startConnectionMonitoring()
    }

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
        connectionCheckInterval.current = null
      }
    }
  }, [isConnected, supabase, startConnectionMonitoring])

  const contextValue: SupabaseContextType = {
    supabase,
    isConnected,
    isInitializing,
    connectionError,
    resetClient,
  }

  return <SupabaseContext.Provider value={contextValue}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    console.error("useSupabase: SupabaseContext is undefined. Make sure SupabaseProvider is wrapping your component.")
    // Return a safe default instead of throwing
    return {
      supabase: null,
      isConnected: false,
      isInitializing: true,
      connectionError: "Context not available",
      resetClient: async () => {},
    }
  }
  return context
}
