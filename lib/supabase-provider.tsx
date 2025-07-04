"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type SupabaseContext = {
  supabase: ReturnType<typeof createClient<Database>> | null
  isConnected: boolean
  isInitializing: boolean
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

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Se abbiamo già un'istanza, riutilizzala
        if (supabaseInstance) {
          console.log("Riutilizzo istanza Supabase esistente")
          setSupabase(supabaseInstance)
          setIsConnected(true)
          setIsInitializing(false)
          return
        }

        // Ottieni le variabili d'ambiente
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        console.log("Tentativo di connessione a Supabase:", { url: supabaseUrl })

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("Variabili d'ambiente Supabase mancanti")
          setIsInitializing(false)
          return
        }

        // Crea il client Supabase
        const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        })

        // Salva l'istanza nel singleton
        supabaseInstance = client

        // Verifica la connessione
        console.log("Verifica della connessione...")
        const { error } = await client.from("utenti").select("id").limit(1)

        if (error) {
          console.error("Errore nella connessione a Supabase:", error)
          setIsConnected(false)
        } else {
          console.log("Connessione a Supabase stabilita con successo")
          setSupabase(client)
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Errore nell'inizializzazione di Supabase:", error)
        setIsConnected(false)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeSupabase()
  }, [])

  return <Context.Provider value={{ supabase, isConnected, isInitializing }}>{children}</Context.Provider>
}

export const useSupabase = () => useContext(Context)
