"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import type { Nota } from "@/lib/services/note-service"
import { useAppConfig } from "@/hooks/use-app-config"

export default function NotaDetailPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { config } = useAppConfig()

  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState<Nota | null>(null)
  const [error, setError] = useState<string | null>(null)

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  // Ottieni le priorità dalla configurazione
  const priorityOptions = config?.priorita || []

  // Carica la nota
  useEffect(() => {
    async function loadNota() {
      if (!supabase || !id || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        const { data: notaData, error: notaError } = await supabase
          .from("note")
          .select("*")
          .eq("id", id)
          .eq("id_utente", user.id)
          .single()

        if (notaError) throw notaError

        setNota(notaData)
      } catch (err: any) {
        console.error("Errore nel caricamento della nota:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadNota()
  }, [supabase, id, user?.id])

  // Formatta la data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return dateString
    }
  }

  // Ottieni il colore della priorità
  const getPriorityColor = (priorita: string | null) => {
    if (!priorita) return "bg-gray-100 text-gray-800"
    
    const priority = priorityOptions.find(p => p.value === priorita)
    if (priority?.color) {
      return `bg-${priority.color}-100 text-${priority.color}-800`
    }
    
    // Fallback colors
    switch (priorita.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "bassa":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
