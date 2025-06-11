"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"

interface AgendaItem {
  id: string
  title: string
  description: string
  date: Date
  userId: string
}

const useAgendaItems = () => {
  const { user } = useUser()
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAgendaItems = useCallback(async () => {
    if (isLoading) return // Evita chiamate multiple

    setIsLoading(true)
    setError(null)

    try {
      if (!user?.id) {
        return
      }

      const response = await fetch(`/api/agenda-items?userId=${user.id}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch agenda items: ${response.status}`)
      }

      const data = await response.json()
      setAgendaItems(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, isLoading])

  useEffect(() => {
    if (user?.id && !isLoading) {
      fetchAgendaItems()
    }
  }, [user?.id, fetchAgendaItems, isLoading])

  return { agendaItems, isLoading, error, fetchAgendaItems }
}

export default useAgendaItems
