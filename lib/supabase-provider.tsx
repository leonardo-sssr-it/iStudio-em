"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null
  isConnected: boolean
  isInitializing: boolean
}

const Context = createContext<SupabaseContext>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Crea il client Supabase usando useMemo per evitare ricreazioni
  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Variabili d'ambiente Supabase mancanti")
      return null
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  useEffect(() => {
    const verifyConnection = async () => {
      if (!supabase) {
        setIsInitializing(false)
        return
      }

      try {
        // Test della connessione con retry
        let retries = 3
        let connected = false

        while (retries > 0 && !connected) {
          try {
            const { error } = await supabase.from("configurazione").select("id").limit(1)
            if (!error) {
              connected = true
              console.log("Connessione a Supabase stabilita con successo")
            } else {
              console.warn(`Tentativo di connessione fallito, riprovo... (${retries} tentativi rimasti)`)
              retries--
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
              }
            }
          } catch {
            retries--
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          }
        }

        setIsConnected(connected)
      } catch (error) {
        console.error("Errore nella verifica connessione Supabase:", error)
        setIsConnected(false)
      } finally {
        setIsInitializing(false)
      }
    }

    verifyConnection()
  }, [supabase])

  return <Context.Provider value={{ supabase, isConnected, isInitializing }}>{children}</Context.Provider>
}

export const useSupabase = () => useContext(Context)
