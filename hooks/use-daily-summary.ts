"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { getDailySummary } from "../utils/api" // Assuming you have an API function

interface DailySummary {
  date: string
  totalTasks: number
  completedTasks: number
  // Add other relevant fields here based on your data structure
}

const useDailySummary = () => {
  const { user } = useUser()
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDailySummary = async () => {
    if (isLoading) {
      return // Evita chiamate multiple
    }

    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getDailySummary(user.id) // Pass user ID to the API
      setDailySummary(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch daily summary.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDailySummary()
    }
  }, [user])

  return { dailySummary, isLoading, error, refetch: fetchDailySummary }
}

export default useDailySummary
