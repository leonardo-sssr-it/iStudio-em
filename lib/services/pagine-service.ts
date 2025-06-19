import { createClient } from "@/lib/supabase-helpers"
import { NO_CACHE_HEADERS } from "@/lib/no-cache"
import type { Database } from "@/types/supabase"

export type Pagina = Database["public"]["Tables"]["pagine"]["Row"]
export type PaginaInsert = Database["public"]["Tables"]["pagine"]["Insert"]
export type PaginaUpdate = Database["public"]["Tables"]["pagine"]["Update"]

export type PaginaFilter = {
  id_utente?: number
  attivo?: boolean
  categoria?: string
  titolo?: string
  privato?: boolean
  searchTerm?: string
}

export type PaginaSortOptions = {
  field: keyof Pagina
  direction: "asc" | "desc"
}

/**
 * Servizio per la gestione delle pagine
 */
export class PagineService {
  /**
   * Ottiene tutte le pagine con filtri opzionali
   * @param filter Filtri da applicare
   * @param sort Opzioni di ordinamento
   * @param limit Limite di risultati
   * @param offset Offset per la paginazione
   * @returns Lista di pagine filtrate e ordinate
   */
  static async getPagine(
    filter?: PaginaFilter,
    sort: PaginaSortOptions = { field: "pubblicato", direction: "desc" },
    limit?: number,
    offset?: number,
  ): Promise<{ data: Pagina[] | null; count: number | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Inizia la query base
      let query = supabase.from("pagine").select("*", { count: "exact" })

      // Applica i filtri
      if (filter) {
        if (filter.id_utente !== undefined) {
          query = query.eq("id_utente", filter.id_utente)
        }

        if (filter.attivo !== undefined) {
          query = query.eq("attivo", filter.attivo)
        }

        if (filter.categoria) {
          query = query.eq("categoria", filter.categoria)
        }

        if (filter.privato !== undefined) {
          query = query.eq("privato", filter.privato)
        }

        // Ricerca full-text
        if (filter.searchTerm) {
          const term = filter.searchTerm.toLowerCase()
          query = query.or(`titolo.ilike.%${term}%,contenuto.ilike.%${term}%,estratto.ilike.%${term}%`)
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
      console.error("Errore nel recupero delle pagine:", error)
      return { data: null, count: null, error: error as Error }
    }
  }

  /**
   * Ottiene una singola pagina per ID
   * @param id ID della pagina
   * @param userId ID utente per verifica permessi (opzionale)
   * @returns Pagina trovata o null
   */
  static async getPaginaById(
    id: number | string,
    userId?: number | string,
  ): Promise<{ data: Pagina | null; error: Error | null }> {
    try {
      const supabase = createClient()

      let query = supabase.from("pagine").select("*").eq("id", id).single()

      // Se fornito userId, verifica che la pagina appartenga all'utente
      if (userId !== undefined) {
        query = query.eq("id_utente", userId)
      }

      const { data, error } = await query.headers(NO_CACHE_HEADERS)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error(`Errore nel recupero della pagina con ID ${id}:`, error)
      return { data: null, error: error as Error }
    }
  }

  /**
   * Crea una nuova pagina
   * @param pagina Dati della pagina da creare
   * @returns Pagina creata
   */
  static async createPagina(pagina: PaginaInsert): Promise<{ data: Pagina | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Imposta i campi obbligatori se non forniti
      const now = new Date().toISOString()
      const paginaToInsert: PaginaInsert = {
        ...pagina,
        modifica: pagina.modifica || now,
        pubblicato: pagina.pubblicato || now,
        attivo: pagina.attivo !== undefined ? pagina.attivo : true,
      }

      const { data, error } = await supabase.from("pagine").insert(paginaToInsert).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error("Errore nella creazione della pagina:", error)
      return { data: null, error: error as Error }
    }
  }

  /**
   * Aggiorna una pagina esistente
   * @param id ID della pagina da aggiornare
   * @param pagina Dati da aggiornare
   * @param userId ID utente per verifica permessi (opzionale)
   * @returns Pagina aggiornata
   */
  static async updatePagina(
    id: number | string,
    pagina: PaginaUpdate,
    userId?: number | string,
  ): Promise<{ data: Pagina | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Imposta il timestamp di modifica
      const paginaToUpdate: PaginaUpdate = {
        ...pagina,
        modifica: new Date().toISOString(),
      }

      // Inizia la query di aggiornamento
      let query = supabase.from("pagine").update(paginaToUpdate).eq("id", id)

      // Se fornito userId, verifica che la pagina appartenga all'utente
      if (userId !== undefined) {
        query = query.eq("id_utente", userId)
      }

      const { data, error } = await query.select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error(`Errore nell'aggiornamento della pagina con ID ${id}:`, error)
      return { data: null, error: error as Error }
    }
  }

  /**
   * Elimina una pagina
   * @param id ID della pagina da eliminare
   * @param userId ID utente per verifica permessi (opzionale)
   * @returns Successo o errore
   */
  static async deletePagina(
    id: number | string,
    userId?: number | string,
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = createClient()

      // Inizia la query di eliminazione
      let query = supabase.from("pagine").delete().eq("id", id)

      // Se fornito userId, verifica che la pagina appartenga all'utente
      if (userId !== undefined) {
        query = query.eq("id_utente", userId)
      }

      const { error } = await query

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error(`Errore nell'eliminazione della pagina con ID ${id}:`, error)
      return { success: false, error: error as Error }
    }
  }

  /**
   * Cambia lo stato attivo di una pagina
   * @param id ID della pagina
   * @param attivo Nuovo stato attivo
   * @param userId ID utente per verifica permessi (opzionale)
   * @returns Pagina aggiornata
   */
  static async togglePaginaStatus(
    id: number | string,
    attivo: boolean,
    userId?: number | string,
  ): Promise<{ data: Pagina | null; error: Error | null }> {
    return this.updatePagina(id, { attivo, modifica: new Date().toISOString() }, userId)
  }

  /**
   * Ottiene le categorie distinte delle pagine
   * @param userId ID utente per filtrare le categorie (opzionale)
   * @returns Lista di categorie distinte
   */
  static async getCategorie(userId?: number | string): Promise<{ data: string[] | null; error: Error | null }> {
    try {
      const supabase = createClient()

      let query = supabase.from("pagine").select("categoria").not("categoria", "is", null)

      // Se fornito userId, filtra per utente
      if (userId !== undefined) {
        query = query.eq("id_utente", userId)
      }

      const { data, error } = await query.headers(NO_CACHE_HEADERS)

      if (error) throw error

      // Estrai categorie uniche
      const categorie = [...new Set(data.map((item) => item.categoria))].filter(Boolean) as string[]

      return { data: categorie, error: null }
    } catch (error) {
      console.error("Errore nel recupero delle categorie:", error)
      return { data: null, error: error as Error }
    }
  }
}
