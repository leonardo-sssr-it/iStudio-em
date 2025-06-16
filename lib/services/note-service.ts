import { createClient } from "@/lib/supabase-helpers"
import { NO_CACHE_HEADERS } from "@/lib/no-cache"
import type { Database } from "@/types/supabase"

export type Nota = Database["public"]["Tables"]["note"]["Row"]
export type NotaInsert = Database["public"]["Tables"]["note"]["Insert"]
export type NotaUpdate = Database["public"]["Tables"]["note"]["Update"]

export type NotaFilter = {
  id_utente?: number
  priorita?: string
  titolo?: string
  searchTerm?: string
  hasNotifica?: boolean
}

export type NotaSortOptions = {
  field: keyof Nota
  direction: "asc" | "desc"
}

// Validazione e sanitizzazione
const sanitizeString = (str: string): string => {
  return str.trim().replace(/\0/g, "")
}

const validateUserId = (userId: string | number): number => {
  const numericId = typeof userId === "string" ? Number.parseInt(userId, 10) : userId
  if (isNaN(numericId) || numericId <= 0) {
    throw new Error("ID utente non valido")
  }
  return numericId
}

const validateNotaInput = (nota: NotaInsert | NotaUpdate): string[] => {
  const errors: string[] = []

  // Validazione titolo
  if ("titolo" in nota) {
    if (!nota.titolo || typeof nota.titolo !== "string") {
      errors.push("Il titolo è obbligatorio")
    } else if (nota.titolo.length > 255) {
      errors.push("Il titolo non può superare i 255 caratteri")
    }
  }

  // Validazione contenuto
  if ("contenuto" in nota) {
    if (!nota.contenuto || typeof nota.contenuto !== "string") {
      errors.push("Il contenuto è obbligatorio")
    } else if (nota.contenuto.length > 50000) {
      errors.push("Il contenuto non può superare i 50.000 caratteri")
    }
  }

  // Validazione tags
  if (nota.tags) {
    if (!Array.isArray(nota.tags)) {
      errors.push("I tags devono essere un array")
    } else if (nota.tags.length > 20) {
      errors.push("Non puoi avere più di 20 tags")
    } else {
      for (const tag of nota.tags) {
        if (typeof tag !== "string" || tag.length > 50) {
          errors.push("Ogni tag deve essere una stringa di massimo 50 caratteri")
          break
        }
      }
    }
  }

  // Validazione priorità
  if (nota.priorita && typeof nota.priorita !== "string") {
    errors.push("La priorità deve essere una stringa")
  }

  // Validazione notifica (time with time zone)
  if (nota.notifica) {
    const notificaDate = new Date(nota.notifica)
    if (isNaN(notificaDate.getTime())) {
      errors.push("La data di notifica non è valida")
    }
  }

  return errors
}

/**
 * Servizio per la gestione delle note
 */
export class NoteService {
  /**
   * Ottiene tutte le note con filtri opzionali
   */
  static async getNote(
    filter?: NotaFilter,
    sort: NotaSortOptions = { field: "modifica", direction: "desc" },
    limit?: number,
    offset?: number,
  ): Promise<{ data: Nota[] | null; count: number | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Validazione parametri
      if (limit && (limit < 1 || limit > 100)) {
        throw new Error("Il limite deve essere tra 1 e 100")
      }

      if (offset && offset < 0) {
        throw new Error("L'offset non può essere negativo")
      }

      // Inizia la query base
      let query = supabase.from("note").select("*", { count: "exact" })

      // Applica i filtri
      if (filter) {
        if (filter.id_utente !== undefined) {
          // Validazione ID utente come bigint
          const validUserId = validateUserId(filter.id_utente)
          query = query.eq("id_utente", validUserId)
        }

        if (filter.priorita) {
          query = query.eq("priorita", sanitizeString(filter.priorita))
        }

        if (filter.hasNotifica !== undefined) {
          if (filter.hasNotifica) {
            query = query.not("notifica", "is", null)
          } else {
            query = query.is("notifica", null)
          }
        }

        // Ricerca full-text con sanitizzazione
        if (filter.searchTerm) {
          const term = sanitizeString(filter.searchTerm.toLowerCase())
          if (term.length > 100) {
            throw new Error("Il termine di ricerca è troppo lungo")
          }
          query = query.or(`titolo.ilike.%${term}%,contenuto.ilike.%${term}%`)
        }

        // Ricerca per titolo specifico
        if (filter.titolo) {
          const titolo = sanitizeString(filter.titolo)
          query = query.ilike("titolo", `%${titolo}%`)
        }
      }

      // Validazione campo di ordinamento
      const validSortFields: (keyof Nota)[] = ["id", "titolo", "creato_il", "modifica", "priorita"]
      if (!validSortFields.includes(sort.field)) {
        throw new Error("Campo di ordinamento non valido")
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
   */
  static async getNotaById(
    id: number | string,
    userId: string | number,
  ): Promise<{ data: Nota | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Validazione ID
      const numericId = Number(id)
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error("ID nota non valido")
      }

      // Validazione ID utente come bigint
      const validUserId = validateUserId(userId)

      const { data, error } = await supabase
        .from("note")
        .select("*")
        .eq("id", numericId)
        .eq("id_utente", validUserId)
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
   */
  static async createNota(nota: NotaInsert): Promise<{ data: Nota | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Validazione input
      const validationErrors = validateNotaInput(nota)
      if (validationErrors.length > 0) {
        throw new Error(`Errori di validazione: ${validationErrors.join(", ")}`)
      }

      // Validazione ID utente come bigint
      if (nota.id_utente !== undefined) {
        nota.id_utente = validateUserId(nota.id_utente)
      }

      // Sanitizzazione
      const sanitizedNota: NotaInsert = {
        ...nota,
        titolo: sanitizeString(nota.titolo || ""),
        contenuto: sanitizeString(nota.contenuto || ""),
        tags: nota.tags?.map((tag) => sanitizeString(tag)) || null,
        priorita: nota.priorita ? sanitizeString(nota.priorita) : null,
      }

      // Imposta i campi obbligatori se non forniti
      const now = new Date().toISOString()
      const notaToInsert: NotaInsert = {
        ...sanitizedNota,
        creato_il: sanitizedNota.creato_il || now,
        modifica: sanitizedNota.modifica || now,
        synced: sanitizedNota.synced !== undefined ? sanitizedNota.synced : false,
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
   */
  static async updateNota(
    id: number | string,
    nota: NotaUpdate,
    userId: string | number,
  ): Promise<{ data: Nota | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Validazione ID
      const numericId = Number(id)
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error("ID nota non valido")
      }

      // Validazione ID utente come bigint
      const validUserId = validateUserId(userId)

      // Validazione input
      const validationErrors = validateNotaInput(nota)
      if (validationErrors.length > 0) {
        throw new Error(`Errori di validazione: ${validationErrors.join(", ")}`)
      }

      // Sanitizzazione
      const sanitizedNota: NotaUpdate = {
        ...nota,
        titolo: nota.titolo ? sanitizeString(nota.titolo) : undefined,
        contenuto: nota.contenuto ? sanitizeString(nota.contenuto) : undefined,
        tags: nota.tags?.map((tag) => sanitizeString(tag)) || undefined,
        priorita: nota.priorita ? sanitizeString(nota.priorita) : undefined,
      }

      // Imposta il timestamp di modifica
      const notaToUpdate: NotaUpdate = {
        ...sanitizedNota,
        modifica: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("note")
        .update(notaToUpdate)
        .eq("id", numericId)
        .eq("id_utente", validUserId)
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
   */
  static async deleteNota(
    id: number | string,
    userId: string | number,
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = createClient()

      // Validazione ID
      const numericId = Number(id)
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error("ID nota non valido")
      }

      // Validazione ID utente come bigint
      const validUserId = validateUserId(userId)

      const { error } = await supabase.from("note").delete().eq("id", numericId).eq("id_utente", validUserId)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error(`Errore nell'eliminazione della nota con ID ${id}:`, error)
      return { success: false, error: error as Error }
    }
  }

  /**
   * Ottiene le priorità distinte delle note
   */
  static async getPriorita(userId: string | number): Promise<{ data: string[] | null; error: Error | null }> {
    try {
      const supabase = createClient()

      // Validazione ID utente come bigint
      const validUserId = validateUserId(userId)

      const { data, error } = await supabase
        .from("note")
        .select("priorita")
        .eq("id_utente", validUserId)
        .not("priorita", "is", null)
        .headers(NO_CACHE_HEADERS)

      if (error) throw error

      // Estrai priorità uniche e sanitizza
      const priorita = [...new Set(data.map((item) => sanitizeString(item.priorita || "")))].filter(Boolean)

      return { data: priorita, error: null }
    } catch (error) {
      console.error("Errore nel recupero delle priorità:", error)
      return { data: null, error: error as Error }
    }
  }
}
