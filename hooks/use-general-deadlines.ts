"use client"

import { useCallback, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { trpc } from "../utils/trpc"

const useGeneralDeadlines = () => {
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { data: session } = useSession()
  const user = session?.user

  const utils = trpc.useContext()

  const fetchDeadlines = useCallback(async () => {
    if (isLoading) return // Evita chiamate multiple

    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const fetchedDeadlines = await utils.deadline.getGeneralDeadlines.query()
      setDeadlines(fetchedDeadlines)
      setError(null)
    } catch (err: any) {
      setError(err)
      console.error("Failed to fetch deadlines:", err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, user?.id, utils.deadline.getGeneralDeadlines])

  useEffect(() => {
    fetchDeadlines()
  }, [fetchDeadlines])

  return { deadlines, isLoading, error, refetch: fetchDeadlines }
}

export default useGeneralDeadlines
