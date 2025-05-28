"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-helpers"
import { useAuth } from "@/lib/auth-provider"

export function useDebugDeadlines() {
  const [userDeadlines, setUserDeadlines] = useState<any[]>([])
  const [generalDeadlines, setGeneralDeadlines] = useState<any[]>([])
  const [combinedItems, setCombinedItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const supabase = createClient()

        // Fetch user deadlines
        const { data: userDeadlinesData, error: userError } = await supabase
          .from("scadenze")
          .select("*")
          .eq("id_utente", user.id)

        if (userError) throw userError

        // Fetch general deadlines
        const { data: generalDeadlinesData, error: generalError } = await supabase
          .from("scadenze")
          .select("*")
          .eq("id_utente", 1) // Assuming 1 is the general user ID

        if (generalError) throw generalError

        // Combine items (simplified version of what useAgendaItems does)
        const combined = [
          ...userDeadlinesData.map((item) => ({ ...item, source: "user" })),
          ...generalDeadlinesData.map((item) => ({ ...item, source: "general" })),
        ]

        setUserDeadlines(userDeadlinesData || [])
        setGeneralDeadlines(generalDeadlinesData || [])
        setCombinedItems(combined)
      } catch (err) {
        console.error("Error fetching debug data:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  return {
    userDeadlines,
    generalDeadlines,
    combinedItems,
    isLoading,
    error,
  }
}
