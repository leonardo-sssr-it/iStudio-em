"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { PaginaForm } from "@/components/pagine/pagina-form"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import type { Pagina } from "@/lib/services/pagine-service"

export default function EditPaginaPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState<Pagina | null>(null)

  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = id === "new"

  // Carica la pagina
  useEffect(() => {
    async function loadPagina() {
      if (!supabase || !user?.id || isNew) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("pagine").select("*").eq("id", id).eq("id_utente", user.id).single()

        if (error) throw error

        setPagina(data)
      } catch (error: any) {
        console.error("Errore nel caricamento della pagina:", error)
        toast({
          title: "Errore",
          description: `Impossibile caricare la pagina: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPagina()
  }, [supabase, id, user?.id, isNew])

  // Salva la pagina
  const handleSave = async (paginaData: any) => {
    if (!supabase || !user?.id) return null

    try {
      const now = new Date().toISOString()

      if (isNew) {
        // Crea nuova pagina
        const newPagina = {
          ...paginaData,
          id_utente: user.id,
          modifica: now,
        }

        const { data, error } = await supabase.from("pagine").insert(newPagina).select().single()

        if (error) throw error

        return data
      } else {
        // Aggiorna pagina esistente
        const { data, error } = await supabase
          .from("pagine")
          .update({
            ...paginaData,
            modifica: now,
          })
          .eq("id", id)
          .eq("id_utente", user.id)
          .select()
          .single()

        if (error) throw error

        return data
      }
    } catch (error: any) {
      console.error("Errore nel salvataggio della pagina:", error)
      toast({
        title: "Errore",
        description: `Impossibile salvare la pagina: ${error.message}`,
        variant: "destructive",
      })
      return null
    }
  }

  // Elimina la pagina
  const handleDelete = async (paginaId: number) => {
    if (!supabase || !user?.id) return false

    try {
      const { error } = await supabase.from("pagine").delete().eq("id", paginaId).eq("id_utente", user.id)

      if (error) throw error

      return true
    } catch (error: any) {
      console.error("Errore nell'eliminazione della pagina:", error)
      toast({
        title: "Errore",
        description: `Impossibile eliminare la pagina: ${error.message}`,
        variant: "destructive",
      })
      return false
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <PaginaForm pagina={pagina} onSave={handleSave} onDelete={handleDelete} isNew={isNew} />
    </div>
  )
}
