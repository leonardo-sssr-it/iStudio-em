"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "@/components/ui/use-toast"
import type { Nota, NotaInsert, NotaUpdate } from "@/lib/services/note-service"

export type NoteFilter = {
  priorita?: string
  searchTerm?: string
  hasNotifica?: boolean
}

export type NoteSortOptions = {
  field: keyof Nota
  direction: "asc" | "desc"
}

/**
 * Hook per la gestione delle note
 */
export function useNote() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<Nota[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Carica le note con filtri opzionali
   */
  const loadNote = useCallback(
    async (
      filter?: NoteFilter,
      sort: NoteSortOptions = { field: "modifica", direction: "desc" },
      limit?: number,
      offset?: number,
    ) => {
      if (!supabase || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        // Costruisci la query
        let query = supabase.from("note").select("*", { count: "exact" }).eq("id_utente", user.id)

        // Applica i filtri
        if (filter) {
          if (filter.priorita) {
            query = query.eq("priorita", filter.priorita)
          }

          if (filter.hasNotifica !== undefined) {
            if (filter.hasNotifica) {
              query = query.not("notifica", "is", null)
            } else {
              query = query.is("notifica", null)
            }
          }

          if (filter.searchTerm) {
            const term = filter.searchTerm.toLowerCase()
            query = query.or(`titolo.ilike.%${term}%,contenuto.ilike.%${term}%`)
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

        setNote(data || [])
        setTotalCount(count || 0)
      } catch (err) {
        console.error("Errore nel caricamento delle note:", err)
        setError(err as Error)
        toast({
          title: "Errore",
          description: `Impossibile caricare le note: ${(err as Error).message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [supabase, user?.id],
  )

  /**
   * Carica una singola nota per ID
   */
  const getNotaById = useCallback(
    async (id: number | string) => {
      if (!supabase || !user?.id) return null

      try {
        const { data, error } = await supabase.from("note").select("*").eq("id", id).eq("id_utente", user.id).single()

        if (error) throw error

        return data
      } catch (err) {
        console.error(`Errore nel caricamento della nota ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile caricare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, user?.id],
  )

  /**
   * Crea una nuova nota
   */
  const createNota = useCallback(
    async (nota: Omit<NotaInsert, "id_utente" | "creato_il" | "modifica">) => {
      if (!supabase || !user?.id) return null

      try {
        const now = new Date().toISOString()
        const newNota: NotaInsert = {
          ...nota,
          id_utente: user.id,
          creato_il: now,
          modifica: now,
          synced: false,
        }

        const { data, error } = await supabase.from("note").insert(newNota).select().single()

        if (error) throw error

        // Aggiorna la lista locale
        setNote((prev) => [data, ...prev])

        toast({
          title: "Successo",
          description: "Nota creata con successo",
        })

        return data
      } catch (err) {
        console.error("Errore nella creazione della nota:", err)
        toast({
          title: "Errore",
          description: `Impossibile creare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, user?.id],
  )

  /**
   * Aggiorna una nota esistente
   */
  const updateNota = useCallback(
    async (id: number | string, nota: NotaUpdate) => {
      if (!supabase || !user?.id) return null

      try {
        const notaToUpdate: NotaUpdate = {
          ...nota,
          modifica: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from("note")
          .update(notaToUpdate)
          .eq("id", id)
          .eq("id_utente", user.id)
          .select()
          .single()

        if (error) throw error

        // Aggiorna la lista locale
        setNote((prev) => prev.map((n) => (n.id === id ? data : n)))

        toast({
          title: "Successo",
          description: "Nota aggiornata con successo",
        })

        return data
      } catch (err) {
        console.error(`Errore nell'aggiornamento della nota ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile aggiornare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, user?.id],
  )

  /**
   * Elimina una nota
   */
  const deleteNota = useCallback(
    async (id: number | string) => {
      if (!supabase || !user?.id) return false

      try {
        const { error } = await supabase.from("note").delete().eq("id", id).eq("id_utente", user.id)

        if (error) throw error

        // Aggiorna la lista locale
        setNote((prev) => prev.filter((n) => n.id !== id))

        toast({
          title: "Successo",
          description: "Nota eliminata con successo",
        })

        return true
      } catch (err) {
        console.error(`Errore nell'eliminazione della nota ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile eliminare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return false
      }
    },
    [supabase, user?.id],
  )

  /**
   * Ottiene le priorità distinte
   */
  const getPriorita = useCallback(async () => {
    if (!supabase || !user?.id) return []

    try {
      const { data, error } = await supabase
        .from("note")
        .select("priorita")
        .eq("id_utente", user.id)
        .not("priorita", "is", null)

      if (error) throw error

      // Estrai priorità uniche
      return [...new Set(data.map((item) => item.priorita))].filter(Boolean) as string[]
    } catch (err) {
      console.error("Errore nel recupero delle priorità:", err)
      return []
    }
  }, [supabase, user?.id])

  // Carica le note all'inizializzazione
  useEffect(() => {
    if (supabase && user?.id) {
      loadNote()
    }
  }, [supabase, user?.id, loadNote])

  return {
    note,
    totalCount,
    loading,
    error,
    loadNote,
    getNotaById,
    createNota,
    updateNota,
    deleteNota,
    getPriorita,
  }
}
