"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"

export function useDebugConfig() {
  const { supabase } = useSupabase()
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDebugConfig = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("configurazione").select("debug").eq("id", 1).single()

        if (error) {
          console.error("Errore nel recupero della configurazione debug:", error)
          setIsDebugEnabled(false)
        } else {
          setIsDebugEnabled(data?.debug === true)
        }
      } catch (error) {
        console.error("Errore nel recupero della configurazione debug:", error)
        setIsDebugEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDebugConfig()
  }, [supabase])

  return { isDebugEnabled, isLoading }
}
