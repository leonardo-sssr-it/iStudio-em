"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type SupabaseContext = {
  supabase: ReturnType<typeof createClient<Database>> | null
  isConnected: boolean
  isInitializing: boolean
  resetClient?: () => Promise<void>
}

const Context = createContext<SupabaseContext>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
})

// Singleton per evitare istanze multiple
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient<Database>> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const resetClient = async () => {
    console.log("SupabaseProvider: Resetting client")
    supabaseInstance = null
    setSupabase(null)
    setIsConnected(false)
    setIsInitializing(true)

    // Re-initialize
    await initializeSupabase()
  }

  const initializeSupabase = async () => {
    try {
      // Se abbiamo già un'istanza, riutilizzala
      if (supabaseInstance) {
        console.log("SupabaseProvider: Riutilizzo istanza Supabase esistente")
        setSupabase(supabaseInstance)
        setIsConnected(true)
        setIsInitializing(false)
        return
      }

      // Ottieni le variabili d'ambiente
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      console.log("SupabaseProvider: Tentativo di connessione a Supabase:", { url: supabaseUrl })

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("SupabaseProvider: Variabili d'ambiente Supabase mancanti")
        setIsInitializing(false)
        return
      }

      // Crea il client Supabase
      const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // Disabilitiamo la persistenza automatica
          autoRefreshToken: false, // Disabilitiamo il refresh automatico
        },
      })

      // Salva l'istanza nel singleton
      supabaseInstance = client

      // Verifica la connessione
      console.log("SupabaseProvider: Verifica della connessione...")
      const { error } = await client.from("utenti").select("id").limit(1)

      if (error) {
        console.error("SupabaseProvider: Errore nella connessione a Supabase:", error)
        setIsConnected(false)
      } else {
        console.log("SupabaseProvider: Connessione a Supabase stabilita con successo")
        setSupabase(client)
        setIsConnected(true)
      }
    } catch (error) {
      console.error("SupabaseProvider: Errore nell'inizializzazione di Supabase:", error)
      setIsConnected(false)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    initializeSupabase()
  }, [])

  return <Context.Provider value={{ supabase, isConnected, isInitializing, resetClient }}>{children}</Context.Provider>
}

export const useSupabase = () => useContext(Context)
