import { createClient } from "@/lib/supabase-helpers"
import { NO_CACHE_HEADERS } from "@/lib/no-cache"
import type { Database } from "@/types/supabase"

export type Nota = Database["public"]["Tables"]["note"]["Row"]
export type NotaInsert = Database["public"]["Tables"]["note"]["Insert"]
export type NotaUpdate = Database["public"]["Tables"]["note"]["Update"]

export type NotaFilter = {
  id_utente?: string
  priorita?: string
  titolo?: string
  searchTerm?: string
  hasNotifica?: boolean
}

export type NotaSortOptions = {
  field: keyof Nota
  direction: "asc" | "desc"
}

/**
 * Servizio per la gestione delle note
 */
export class NoteService {
  /**
   * Ottiene tutte le note con filtri opzionali
   * @param filter Filtri da applicare
   * @param sort Opzioni di ordinamento
   * @param limit Limite di risultati
   * @param offset Offset per la paginazione
   * @returns Lista di note filtrate e ordinate
   */
  static async getNote(
    filter?: NotaFilter,
    sort: NotaSortOptions = { field: "modifica", direction: "desc" },
    limit?: number,
    offset?: number,
  ): Promise<{ data: Nota[] | null; count: number | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Inizia la query base
      let query = supabase.from("note").select("*", { count: "exact" })

      // Applica i filtri
      if (filter) {
        if (filter.id_utente !== undefined) {
          query = query.eq("id_utente", filter.id_utente)
        }

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

        // Ricerca full-text
        if (filter.searchTerm) {
          const term = filter.searchTerm.toLowerCase()
          query = query.or(`titolo.ilike.%${term}%,contenuto.ilike.%${term}%`)
        }

        // Ricerca per titolo specifico
        if (filter.titolo) {
          query = query.ilike("titolo", `%${filter.titolo}%`)
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

      // Esegui la query con no-cache
      const { data, error, count } = await query.headers(NO_CACHE_HEADERS)

      if (error) throw error

      return { data, count, error: null }
    } catch (error) {
      console.error("Errore nel recupero delle note:", error)
      return { data: null, count: null, error: error as Error }
    }
  }

  /**
   * Ottiene una singola nota per ID
   * @param id ID della nota
   * @param userId ID utente per verifica permessi
   * @returns Nota trovata o null
   */
  static async getNotaById(id: number | string, userId: string): Promise<{ data: Nota | null; error: Error | null }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("note")
        .select("*")
        .eq("id", id)
        .eq("id_utente", userId)
        .single()
        .headers(NO_CACHE_HEADERS)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error(`Errore nel recupero della nota con ID ${id}:`, error)
      return { data: null, error: error as Error }
    }
  }

  /**
   * Crea una nuova nota
   * @param nota Dati della nota da creare
   * @returns Nota creata
   */
  static async createNota(nota: NotaInsert): Promise<{ data: Nota | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Imposta i campi obbligatori se non forniti
      const now = new Date().toISOString()
      const notaToInsert: NotaInsert = {
        ...nota,
        creato_il: nota.creato_il || now,
        modifica: nota.modifica || now,
        synced: nota.synced !== undefined ? nota.synced : false,
      }

      const { data, error } = await supabase.from("note").insert(notaToInsert).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error("Errore nella creazione della nota:", error)
      return { data: null, error: error as Error }
    }
  }

  /**
   * Aggiorna una nota esistente
   * @param id ID della nota da aggiornare
   * @param nota Dati da aggiornare
   * @param userId ID utente per verifica permessi
   * @returns Nota aggiornata
   */
  static async updateNota(
    id: number | string,
    nota: NotaUpdate,
    userId: string,
  ): Promise<{ data: Nota | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Imposta il timestamp di modifica
      const notaToUpdate: NotaUpdate = {
        ...nota,
        modifica: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("note")
        .update(notaToUpdate)
        .eq("id", id)
        .eq("id_utente", userId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error(`Errore nell'aggiornamento della nota con ID ${id}:`, error)
      return { data: null, error: error as Error }
    }
  }

  /**
   * Elimina una nota
   * @param id ID della nota da eliminare
   * @param userId ID utente per verifica permessi
   * @returns Successo o errore
   */
  static async deleteNota(id: number | string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("note").delete().eq("id", id).eq("id_utente", userId)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error(`Errore nell'eliminazione della nota con ID ${id}:`, error)
      return { success: false, error: error as Error }
    }
  }

  /**
   * Ottiene le priorità distinte delle note
   * @param userId ID utente per filtrare le priorità
   * @returns Lista di priorità distinte
   */
  static async getPriorita(userId: string): Promise<{ data: string[] | null; error: Error | null }> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("note")
        .select("priorita")
        .eq("id_utente", userId)
        .not("priorita", "is", null)
        .headers(NO_CACHE_HEADERS)

      if (error) throw error

      // Estrai priorità uniche
      const priorita = [...new Set(data.map((item) => item.priorita))].filter(Boolean) as string[]

      return { data: priorita, error: null }
    } catch (error) {
      console.error("Errore nel recupero delle priorità:", error)
      return { data: null, error: error as Error }
    }
  }
}
