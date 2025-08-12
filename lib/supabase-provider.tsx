"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
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

// Stato globale per prevenire reset durante unmount/remount
let globalSupabaseState = {
  instance: null as SupabaseClient<Database> | null,
  isConnected: false,
  isInitializing: true,
  instanceId: 0,
  connectionCache: new Map<string, boolean>(),
  lastConnectionTest: 0,
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(globalSupabaseState.instance)
  const [isConnected, setIsConnected] = useState<boolean>(globalSupabaseState.isConnected)
  const [isInitializing, setIsInitializing] = useState<boolean>(globalSupabaseState.isInitializing)
  const initializingRef = useRef<boolean>(false)
  const renderCountRef = useRef(0)

  // Incrementa render count per debug
  renderCountRef.current++

  // Log ridotti - solo ogni 5 render
  if (renderCountRef.current % 5 === 1) {
    console.log(`SupabaseProvider: Render #${renderCountRef.current}`, {
      hasInstance: !!supabase,
      isConnected,
      isInitializing,
      globalInstanceId: globalSupabaseState.instanceId,
    })
  }

  useEffect(() => {
    const initializeSupabase = async () => {
      // Se già inizializzato e abbiamo un'istanza globale, riutilizzala
      if (globalSupabaseState.instance && !globalSupabaseState.isInitializing) {
        setSupabase(globalSupabaseState.instance)
        setIsConnected(globalSupabaseState.isConnected)
        setIsInitializing(false)
        return
      }

      // Previeni inizializzazioni multiple simultanee
      if (initializingRef.current) return
      initializingRef.current = true

      try {
        console.log("SupabaseProvider: Inizializzazione...")

        // Riutilizza istanza esistente se disponibile
        if (globalSupabaseState.instance) {
          console.log(`SupabaseProvider: Riutilizzo istanza esistente (ID: ${globalSupabaseState.instanceId})`)
          setSupabase(globalSupabaseState.instance)
          setIsConnected(globalSupabaseState.isConnected)
          setIsInitializing(false)
          return
        }

        // Crea nuova istanza
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Variabili ambiente Supabase mancanti")
        }

        const newInstance = createClient<Database>(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false, // Gestiamo le sessioni manualmente
            autoRefreshToken: false,
          },
        })

        // Incrementa ID istanza
        globalSupabaseState.instanceId++

        // Test connessione con cache
        const cacheKey = `${supabaseUrl}_${Date.now()}`
        const now = Date.now()

        // Cache test connessione per 30 secondi
        if (
          now - globalSupabaseState.lastConnectionTest < 30000 &&
          globalSupabaseState.connectionCache.has("last_test")
        ) {
          const cachedResult = globalSupabaseState.connectionCache.get("last_test")
          globalSupabaseState.isConnected = cachedResult || false
        } else {
          try {
            const { error } = await newInstance.from("utenti").select("id").limit(1)
            globalSupabaseState.isConnected = !error
            globalSupabaseState.connectionCache.set("last_test", globalSupabaseState.isConnected)
            globalSupabaseState.lastConnectionTest = now
          } catch (e) {
            globalSupabaseState.isConnected = false
            globalSupabaseState.connectionCache.set("last_test", false)
          }
        }

        // Aggiorna stato globale
        globalSupabaseState.instance = newInstance
        globalSupabaseState.isInitializing = false

        // Aggiorna stato locale
        setSupabase(newInstance)
        setIsConnected(globalSupabaseState.isConnected)
        setIsInitializing(false)

        console.log(`SupabaseProvider: Inizializzazione completata (connesso: ${globalSupabaseState.isConnected})`)
      } catch (error) {
        console.error("SupabaseProvider: Errore inizializzazione:", error)
        globalSupabaseState.isConnected = false
        globalSupabaseState.isInitializing = false
        setIsConnected(false)
        setIsInitializing(false)
      } finally {
        initializingRef.current = false
      }
    }

    initializeSupabase()
  }, [])

  // Cleanup controllato - solo su unmount definitivo
  useEffect(() => {
    return () => {
      // Log ridotto per cleanup
      if (renderCountRef.current % 10 === 0) {
        console.log("SupabaseProvider: Cleanup")
      }
      // Non resettare lo stato globale durante la navigazione
      // Il cleanup completo avviene solo su logout esplicito
    }
  }, [])

  const value: SupabaseContextType = {
    supabase,
    isConnected,
    isInitializing,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase deve essere usato all'interno di SupabaseProvider")
  }
  return context
}

// Funzione per reset esplicito (da usare solo su logout)
export const resetSupabaseState = () => {
  console.log("SupabaseProvider: Reset esplicito dello stato")
  globalSupabaseState = {
    instance: null,
    isConnected: false,
    isInitializing: true,
    instanceId: 0,
    connectionCache: new Map(),
    lastConnectionTest: 0,
  }
}
