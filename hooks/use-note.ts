"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

// Cache per le note
const noteCache = new Map<string, { data: Nota[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minuti

/**
 * Hook per la gestione delle note con ottimizzazioni performance
 */
export function useNote() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<Nota[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  // Usa sempre user.id come stringa
  const userId = useMemo(() => {
    if (!user?.id) return null
    return user.id.toString()
  }, [user?.id])

  // Memoizza la chiave di cache
  const cacheKey = useMemo(() => `notes_${userId}`, [userId])

  /**
   * Verifica se i dati in cache sono ancora validi
   */
  const isCacheValid = useCallback((key: string): boolean => {
    const cached = noteCache.get(key)
    if (!cached) return false
    return Date.now() - cached.timestamp < CACHE_DURATION
  }, [])

  /**
   * Carica le note con filtri opzionali e caching
   */
  const loadNote = useCallback(
    async (
      filter?: NoteFilter,
      sort: NoteSortOptions = { field: "modifica", direction: "desc" },
      limit?: number,
      offset?: number,
      forceRefresh = false,
    ) => {
      if (!supabase || !userId) return

      // Controlla cache solo per query semplici (senza filtri complessi)
      const isSimpleQuery = !filter && !limit && !offset && sort.field === "modifica" && sort.direction === "desc"

      if (isSimpleQuery && !forceRefresh && isCacheValid(cacheKey)) {
        const cached = noteCache.get(cacheKey)
        if (cached) {
          setNote(cached.data)
          setTotalCount(cached.data.length)
          return
        }
      }

      setLoading(true)
      setError(null)

      try {
        // Costruisci la query - usa sempre userId come stringa
        let query = supabase.from("note").select("*", { count: "exact" }).eq("id_utente", userId)

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
            const term = filter.searchTerm.toLowerCase().trim()
            if (term.length >= 2) {
              // Minimo 2 caratteri per la ricerca
              query = query.or(`titolo.ilike.%${term}%,contenuto.ilike.%${term}%`)
            }
          }
        }

        // Applica ordinamento
        query = query.order(sort.field, { ascending: sort.direction === "asc" })

        // Applica paginazione
        if (limit !== undefined && limit > 0) {
          query = query.limit(Math.min(limit, 100)) // Massimo 100 elementi
        }

        if (offset !== undefined && offset >= 0) {
          query = query.range(offset, offset + (limit || 10) - 1)
        }

        // Esegui la query
        const { data, error, count } = await query

        if (error) throw error

        const noteData = data || []
        setNote(noteData)
        setTotalCount(count || 0)

        // Aggiorna cache solo per query semplici
        if (isSimpleQuery) {
          noteCache.set(cacheKey, {
            data: noteData,
            timestamp: Date.now(),
          })
        }
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
    [supabase, userId, cacheKey, isCacheValid],
  )

  /**
   * Carica una singola nota per ID con caching
   */
  const getNotaById = useCallback(
    async (id: number | string) => {
      if (!supabase || !userId) return null

      try {
        // Controlla prima nella cache locale
        const cached = noteCache.get(cacheKey)
        if (cached && isCacheValid(cacheKey)) {
          const cachedNota = cached.data.find((n) => n.id === Number(id))
          if (cachedNota) return cachedNota
        }

        const { data, error } = await supabase.from("note").select("*").eq("id", id).eq("id_utente", userId).single()

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
    [supabase, userId, cacheKey, isCacheValid],
  )

  /**
   * Crea una nuova nota con aggiornamento ottimistico
   */
  const createNota = useCallback(
    async (nota: Omit<NotaInsert, "id_utente" | "creato_il" | "modifica">) => {
      if (!supabase || !userId) return null

      try {
        const now = new Date().toISOString()
        const newNota: NotaInsert = {
          ...nota,
          id_utente: userId, // Usa sempre come stringa
          creato_il: now,
          modifica: now,
          synced: false,
        }

        // Aggiornamento ottimistico
        const tempId = Date.now()
        const tempNota = { ...newNota, id: tempId } as Nota
        setNote((prev) => [tempNota, ...prev])

        const { data, error } = await supabase.from("note").insert(newNota).select().single()

        if (error) throw error

        // Sostituisci la nota temporanea con quella reale
        setNote((prev) => prev.map((n) => (n.id === tempId ? data : n)))

        // Invalida cache
        noteCache.delete(cacheKey)

        toast({
          title: "Successo",
          description: "Nota creata con successo",
        })

        return data
      } catch (err) {
        // Rimuovi la nota temporanea in caso di errore
        setNote((prev) => prev.filter((n) => n.id !== Date.now()))

        console.error("Errore nella creazione della nota:", err)
        toast({
          title: "Errore",
          description: `Impossibile creare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, userId, cacheKey],
  )

  /**
   * Aggiorna una nota esistente con aggiornamento ottimistico
   */
  const updateNota = useCallback(
    async (id: number | string, nota: NotaUpdate) => {
      if (!supabase || !userId) return null

      try {
        const notaToUpdate: NotaUpdate = {
          ...nota,
          modifica: new Date().toISOString(),
        }

        // Aggiornamento ottimistico
        setNote((prev) => prev.map((n) => (n.id === Number(id) ? ({ ...n, ...notaToUpdate } as Nota) : n)))

        const { data, error } = await supabase
          .from("note")
          .update(notaToUpdate)
          .eq("id", id)
          .eq("id_utente", userId)
          .select()
          .single()

        if (error) throw error

        // Aggiorna con i dati reali dal server
        setNote((prev) => prev.map((n) => (n.id === Number(id) ? data : n)))

        // Invalida cache
        noteCache.delete(cacheKey)

        toast({
          title: "Successo",
          description: "Nota aggiornata con successo",
        })

        return data
      } catch (err) {
        // Ricarica i dati in caso di errore
        loadNote(undefined, undefined, undefined, undefined, true)

        console.error(`Errore nell'aggiornamento della nota ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile aggiornare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return null
      }
    },
    [supabase, userId, cacheKey, loadNote],
  )

  /**
   * Elimina una nota con aggiornamento ottimistico
   */
  const deleteNota = useCallback(
    async (id: number | string) => {
      if (!supabase || !userId) return false

      try {
        // Aggiornamento ottimistico
        const originalNote = note
        setNote((prev) => prev.filter((n) => n.id !== Number(id)))

        const { error } = await supabase.from("note").delete().eq("id", id).eq("id_utente", userId)

        if (error) throw error

        // Invalida cache
        noteCache.delete(cacheKey)

        toast({
          title: "Successo",
          description: "Nota eliminata con successo",
        })

        return true
      } catch (err) {
        // Ripristina le note originali in caso di errore
        setNote(note)

        console.error(`Errore nell'eliminazione della nota ${id}:`, err)
        toast({
          title: "Errore",
          description: `Impossibile eliminare la nota: ${(err as Error).message}`,
          variant: "destructive",
        })
        return false
      }
    },
    [supabase, userId, cacheKey, note],
  )

  /**
   * Ottiene le priorità distinte con caching
   */
  const getPriorita = useCallback(async () => {
    if (!supabase || !userId) return []

    try {
      const priorityKey = `priorities_${userId}`

      // Controlla cache
      if (isCacheValid(priorityKey)) {
        const cached = noteCache.get(priorityKey)
        if (cached) return cached.data as string[]
      }

      const { data, error } = await supabase
        .from("note")
        .select("priorita")
        .eq("id_utente", userId)
        .not("priorita", "is", null)

      if (error) throw error

      // Estrai priorità uniche
      const priorita = [...new Set(data.map((item) => item.priorita))].filter(Boolean) as string[]

      // Aggiorna cache
      noteCache.set(priorityKey, {
        data: priorita as any,
        timestamp: Date.now(),
      })

      return priorita
    } catch (err) {
      console.error("Errore nel recupero delle priorità:", err)
      return []
    }
  }, [supabase, userId, isCacheValid])

  // Carica le note all'inizializzazione
  useEffect(() => {
    if (supabase && userId) {
      loadNote()
    }
  }, [supabase, userId, loadNote])

  // Cleanup cache quando l'utente cambia
  useEffect(() => {
    return () => {
      if (cacheKey) {
        noteCache.delete(cacheKey)
      }
    }
  }, [cacheKey])

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
