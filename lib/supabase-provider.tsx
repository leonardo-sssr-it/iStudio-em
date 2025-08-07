"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type SupabaseContext = {
  supabase: ReturnType<typeof createClient<Database>> | null
  isConnected: boolean
  isInitializing: boolean
  resetClient: () => Promise<void>
}

const Context = createContext<SupabaseContext>({
  supabase: null,
  isConnected: false,
  isInitializing: true,
  resetClient: async () => {},
})

// Singleton per evitare istanze multiple - MA con possibilità di reset
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let instanceId = 0

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient<Database>> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const currentInstanceId = useRef(0)

  const createSupabaseClient = async (forceNew = false) => {
    try {
      // Se forziamo una nuova istanza o non ne abbiamo una, creala
      if (forceNew || !supabaseInstance) {
        console.log("SupabaseProvider: Creando nuova istanza Supabase")
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error("SupabaseProvider: Variabili d'ambiente Supabase mancanti")
          setIsInitializing(false)
          return null
        }

        // Crea il client Supabase con configurazione ottimizzata
        const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          },
          global: {
            headers: {
              'X-Client-Info': 'istudio-v0.4'
            }
          }
        })

        // Salva l'istanza nel singleton
        supabaseInstance = client
        instanceId++
        currentInstanceId.current = instanceId
        
        console.log(`SupabaseProvider: Nuova istanza creata (ID: ${instanceId})`)
      } else {
        console.log(`SupabaseProvider: Riutilizzo istanza esistente (ID: ${instanceId})`)
      }

      return supabaseInstance
    } catch (error) {
      console.error("SupabaseProvider: Errore nella creazione del client:", error)
      return null
    }
  }

  const testConnection = async (client: ReturnType<typeof createClient<Database>>) => {
    try {
      console.log("SupabaseProvider: Test connessione...")
      
      // Test semplice senza autenticazione
      const { error } = await client
        .from("utenti")
        .select("id")
        .limit(1)
        .maybeSingle()

      if (error && !error.message.includes("multiple (or no) rows returned")) {
        console.error("SupabaseProvider: Errore nel test di connessione:", error)
        return false
      }

      console.log("SupabaseProvider: Connessione testata con successo")
      return true
    } catch (error) {
      console.error("SupabaseProvider: Errore nel test di connessione:", error)
      return false
    }
  }

  const resetClient = async () => {
    console.log("SupabaseProvider: Reset del client richiesto")
    
    // Invalida l'istanza corrente
    supabaseInstance = null
    setSupabase(null)
    setIsConnected(false)
    setIsInitializing(true)

    // Crea una nuova istanza
    const newClient = await createSupabaseClient(true)
    if (newClient) {
      const connected = await testConnection(newClient)
      setSupabase(newClient)
      setIsConnected(connected)
    }
    
    setIsInitializing(false)
  }

  useEffect(() => {
    const initializeSupabase = async () => {
      console.log("SupabaseProvider: Inizializzazione...")
      
      try {
        const client = await createSupabaseClient()
        
        if (!client) {
          setIsInitializing(false)
          return
        }

        // Test della connessione
        const connected = await testConnection(client)
        
        setSupabase(client)
        setIsConnected(connected)
        
        console.log(`SupabaseProvider: Inizializzazione completata (connesso: ${connected})`)
      } catch (error) {
        console.error("SupabaseProvider: Errore nell'inizializzazione:", error)
        setIsConnected(false)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeSupabase()
  }, [])

  // Cleanup quando il componente viene smontato
  useEffect(() => {
    return () => {
      console.log("SupabaseProvider: Cleanup")
    }
  }, [])

  return (
    <Context.Provider value={{ 
      supabase, 
      isConnected, 
      isInitializing,
      resetClient 
    }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabase deve essere usato all\'interno di SupabaseProvider')
  }
  return context
}
