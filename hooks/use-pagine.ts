"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "@/components/ui/use-toast"
import type { Pagina, PaginaInsert, PaginaUpdate } from "@/lib/services/pagine-service"

export type PagineFilter = {
  attivo?: boolean
  categoria?: string
  searchTerm?: string
  privato?: boolean
}

export type PagineSortOptions = {
  field: keyof Pagina
  direction: "asc" | "desc"
}

/**
 * Hook per la gestione delle pagine
 */
export function usePagine() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pagine, setPagine] = useState<Pagina[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Carica le pagine con filtri opzionali
   */
  const loadPagine = useCallback(
    async (
      filter?: PagineFilter,
      sort: PagineSortOptions = { field: "pubblicato", direction: "desc" },
      limit?: number,
      offset?: number,
    ) => {
      if (!supabase || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        // Costruisci la query
        let query = supabase.from("pagine").select("*", { count: "exact" }).eq("id_utente", user.id)

        // Applica i filtri
        if (filter) {
          if (filter.attivo !== undefined) {
            query = query.eq("attivo", filter.attivo)
          }

          if (filter.categoria) {
            query = query.eq("categoria", filter.categoria)
          }

          if (filter.privato !== undefined) {
            query = query.eq("privato", filter.privato)
          }

          if (filter.searchTerm) {
            const term = filter.searchTerm.toLowerCase()
            query = query.or(`titolo.ilike.%${term}%,contenuto.ilike.%${term}%,estratto.ilike.%${term}%`)
          }
        }

        // Applica ordinamento
        query = query.order(sort.field, { ascending: sort.direction === "asc" })

        // Applica paginazione
        if (limit !== undefined) {
          query = query.limit(limit)
        }

        if (offset !== undefined) {
          query = query.range(offset, offset + (limit || 10) - 1)
        }

        // Esegui la query
        const { data, error, count } = await query

        if (error) throw error

        setPagine(data || [])
        setTotalCount(count || 0)
      } catch (err) {
        console.error("Errore nel caricamento delle pagine:", err)
        setError(err as Error)
        toast({
          title: "Errore",
          description: `Impossibile caricare le pagine: ${(err as Error).message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [supabase, user?.id],
  )

  /**
   * Carica una singola pagina per ID
   */
  const getPaginaById = useCallback(
    async (id: number | string) => {
      if (!supabase || !user?.id) return null

      try {
        const { data, error } = await supabase.from("pagine").select("*").eq("id", id).eq("id_utente", user.id).single()

        if (error) throw error

        return data
      } catch (err) {
        console.error(`Errore nel caricamento della pagina ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile caricare la pagina: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, user?.id],
  )

  /**
   * Crea una nuova pagina
   */
  const createPagina = useCallback(
    async (pagina: Omit<PaginaInsert, "id_utente" | "modifica">) => {
      if (!supabase || !user?.id) return null

      try {
        const now = new Date().toISOString()
        const newPagina: PaginaInsert = {
          ...pagina,
          id_utente: user.id,
          modifica: now,
          pubblicato: pagina.pubblicato || now,
          attivo: pagina.attivo !== undefined ? pagina.attivo : true,
        }

        const { data, error } = await supabase.from("pagine").insert(newPagina).select().single()

        if (error) throw error

        // Aggiorna la lista locale
        setPagine((prev) => [data, ...prev])

        toast({
          title: "Successo",
          description: "Pagina creata con successo",
        })

        return data
      } catch (err) {
        console.error("Errore nella creazione della pagina:", err)
        toast({
          title: "Errore",
          description: `Impossibile creare la pagina: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, user?.id],
  )

  /**
   * Aggiorna una pagina esistente
   */
  const updatePagina = useCallback(
    async (id: number | string, pagina: PaginaUpdate) => {
      if (!supabase || !user?.id) return null

      try {
        const paginaToUpdate: PaginaUpdate = {
          ...pagina,
          modifica: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from("pagine")
          .update(paginaToUpdate)
          .eq("id", id)
          .eq("id_utente", user.id)
          .select()
          .single()

        if (error) throw error

        // Aggiorna la lista locale
        setPagine((prev) => prev.map((p) => (p.id === id ? data : p)))

        toast({
          title: "Successo",
          description: "Pagina aggiornata con successo",
        })

        return data
      } catch (err) {
        console.error(`Errore nell'aggiornamento della pagina ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile aggiornare la pagina: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, user?.id],
  )

  /**
   * Elimina una pagina
   */
  const deletePagina = useCallback(
    async (id: number | string) => {
      if (!supabase || !user?.id) return false

      try {
        const { error } = await supabase.from("pagine").delete().eq("id", id).eq("id_utente", user.id)

        if (error) throw error

        // Aggiorna la lista locale
        setPagine((prev) => prev.filter((p) => p.id !== id))

        toast({
          title: "Successo",
          description: "Pagina eliminata con successo",
        })

        return true
      } catch (err) {
        console.error(`Errore nell'eliminazione della pagina ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile eliminare la pagina: ${(err as Error).message}`,
          variant: "destructive",
        })
        return false
      }
    },
    [supabase, user?.id],
  )

  /**
   * Cambia lo stato attivo di una pagina
   */
  const togglePaginaStatus = useCallback(
    async (id: number | string, attivo: boolean) => {
      return updatePagina(id, { attivo })
    },
    [updatePagina],
  )

  /**
   * Ottiene le categorie distinte
   */
  const getCategorie = useCallback(async () => {
    if (!supabase || !user?.id) return []

    try {
      const { data, error } = await supabase
        .from("pagine")
        .select("categoria")
        .eq("id_utente", user.id)
        .not("categoria", "is", null)

      if (error) throw error

      // Estrai categorie uniche
      return [...new Set(data.map((item) => item.categoria))].filter(Boolean) as string[]
    } catch (err) {
      console.error("Errore nel recupero delle categorie:", err)
      return []
    }
  }, [supabase, user?.id])

  // Carica le pagine all'inizializzazione
  useEffect(() => {
    if (supabase && user?.id) {
      loadPagine()
    }
  }, [supabase, user?.id, loadPagine])

  return {
    pagine,
    totalCount,
    loading,
    error,
    loadPagine,
    getPaginaById,
    createPagina,
    updatePagina,
    deletePagina,
    togglePaginaStatus,
    getCategorie,
  }
}
