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

// Singleton globale per evitare istanze multiple
let globalSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let globalInstanceId = 0
let globalConnectionState = false

// Stato persistente per prevenire reset durante unmount/remount
const persistentState = {
  isConnected: false,
  isInitialized: false,
  lastConnectionCheck: 0,
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient<Database>> | null>(globalSupabaseInstance)
  const [isConnected, setIsConnected] = useState(globalConnectionState)
  const [isInitializing, setIsInitializing] = useState(!persistentState.isInitialized)
  const currentInstanceId = useRef(globalInstanceId)
  const initializationRef = useRef(false)
  const mountedRef = useRef(true)

  console.log("SupabaseProvider: Inizializzazione componente", {
    hasGlobalInstance: !!globalSupabaseInstance,
    globalConnectionState,
    persistentInitialized: persistentState.isInitialized,
  })

  const createSupabaseClient = async (forceNew = false) => {
    try {
      // Se abbiamo già un'istanza globale valida e non forziamo il rinnovo, riutilizzala
      if (!forceNew && globalSupabaseInstance && persistentState.isInitialized) {
        console.log("SupabaseProvider: Riutilizzo istanza globale esistente")
        return globalSupabaseInstance
      }

      console.log("SupabaseProvider: Creando nuova istanza Supabase")

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("SupabaseProvider: Variabili d'ambiente Supabase mancanti")
        return null
      }

      // Crea il client Supabase con configurazione ottimizzata
      const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
        global: {
          headers: {
            "X-Client-Info": "istudio-v0.4",
          },
        },
      })

      // Salva l'istanza nel singleton globale
      globalSupabaseInstance = client
      globalInstanceId++
      currentInstanceId.current = globalInstanceId

      console.log(`SupabaseProvider: Nuova istanza creata (ID: ${globalInstanceId})`)
      return client
    } catch (error) {
      console.error("SupabaseProvider: Errore nella creazione del client:", error)
      return null
    }
  }

  const testConnection = async (client: ReturnType<typeof createClient<Database>>) => {
    try {
      // Usa cache per evitare test ripetuti
      const now = Date.now()
      if (persistentState.isConnected && now - persistentState.lastConnectionCheck < 30000) {
        console.log("SupabaseProvider: Connessione già verificata di recente")
        return persistentState.isConnected
      }

      // Test semplice senza autenticazione
      const { error } = await client.from("utenti").select("id").limit(1).maybeSingle()

      const connected = !error || error.message.includes("multiple (or no) rows returned")

      // Aggiorna stato persistente
      persistentState.isConnected = connected
      persistentState.lastConnectionCheck = now
      globalConnectionState = connected

      if (!connected) {
        console.error("SupabaseProvider: Errore nel test di connessione:", error)
      }

      return connected
    } catch (error) {
      console.error("SupabaseProvider: Errore nel test di connessione:", error)
      persistentState.isConnected = false
      globalConnectionState = false
      return false
    }
  }

  const resetClient = async () => {
    console.log("SupabaseProvider: Reset del client richiesto")

    // Reset dello stato globale
    globalSupabaseInstance = null
    globalConnectionState = false
    persistentState.isConnected = false
    persistentState.isInitialized = false
    persistentState.lastConnectionCheck = 0

    // Reset dello stato locale
    setSupabase(null)
    setIsConnected(false)
    setIsInitializing(true)
    initializationRef.current = false

    // Crea una nuova istanza
    const newClient = await createSupabaseClient(true)
    if (newClient && mountedRef.current) {
      const connected = await testConnection(newClient)
      setSupabase(newClient)
      setIsConnected(connected)
      persistentState.isInitialized = true
    }

    if (mountedRef.current) {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    const initializeSupabase = async () => {
      // Evita inizializzazioni multiple
      if (initializationRef.current) {
        console.log("SupabaseProvider: Inizializzazione già in corso, skip")
        return
      }

      // Se abbiamo già un'istanza globale valida, usala
      if (globalSupabaseInstance && persistentState.isInitialized) {
        console.log("SupabaseProvider: Recupero istanza globale esistente")
        setSupabase(globalSupabaseInstance)
        setIsConnected(globalConnectionState)
        setIsInitializing(false)
        return
      }

      initializationRef.current = true
      console.log("SupabaseProvider: Inizializzazione...")

      try {
        const client = await createSupabaseClient()

        if (!client || !mountedRef.current) {
          if (mountedRef.current) {
            setIsInitializing(false)
          }
          return
        }

        // Test della connessione
        const connected = await testConnection(client)

        if (mountedRef.current) {
          setSupabase(client)
          setIsConnected(connected)
          persistentState.isInitialized = true
          globalConnectionState = connected
        }

        console.log(`SupabaseProvider: Inizializzazione completata (connesso: ${connected})`)
      } catch (error) {
        console.error("SupabaseProvider: Errore nell'inizializzazione:", error)
        if (mountedRef.current) {
          setIsConnected(false)
          globalConnectionState = false
        }
      } finally {
        if (mountedRef.current) {
          setIsInitializing(false)
        }
        initializationRef.current = false
      }
    }

    initializeSupabase()
  }, [])

  // Cleanup controllato - solo quando necessario
  useEffect(() => {
    return () => {
      mountedRef.current = false
      console.log("SupabaseProvider: Componente smontato")
      // NON resettiamo l'istanza globale qui per mantenerla tra i remount
    }
  }, [])

  return (
    <Context.Provider
      value={{
        supabase,
        isConnected,
        isInitializing,
        resetClient,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error("useSupabase deve essere usato all'interno di SupabaseProvider")
  }
  return context
}
