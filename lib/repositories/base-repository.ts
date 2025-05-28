import type { SupabaseClient } from "@supabase/supabase-js"
import { NO_CACHE_HEADERS, withRetry } from "../no-cache"

/**
 * Classe base per i repository che interagiscono con Supabase
 */
export abstract class BaseRepository {
  protected client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * Esegue una query RPC con header no-cache e retry automatici
   * @param procedure Nome della procedura RPC
   * @param params Parametri della procedura
   * @param retries Numero di tentativi in caso di errore
   * @returns Risultato della query
   */
  protected async executeRpc<T = any>(procedure: string, params: Record<string, any> = {}, retries = 2): Promise<T> {
    return withRetry(async () => {
      const { data, error } = await this.client.rpc(procedure, params, { headers: NO_CACHE_HEADERS })

      if (error) throw error
      return data as T
    }, retries)
  }

  /**
   * Esegue una query SELECT con header no-cache e retry automatici
   * @param table Nome della tabella
   * @param columns Colonne da selezionare
   * @param query Funzione per personalizzare la query
   * @param retries Numero di tentativi in caso di errore
   * @returns Risultato della query
   */
  protected async executeSelect<T = any>(
    table: string,
    columns = "*",
    query?: (q: any) => any,
    retries = 2,
  ): Promise<T[]> {
    return withRetry(async () => {
      let queryBuilder = this.client.from(table).select(columns, { count: "exact" })

      if (query) {
        queryBuilder = query(queryBuilder)
      }

      const { data, error } = await queryBuilder.headers(NO_CACHE_HEADERS)

      if (error) throw error
      return data as T[]
    }, retries)
  }

  /**
   * Esegue una query con paginazione
   * @param table Nome della tabella
   * @param columns Colonne da selezionare
   * @param page Numero di pagina (0-based)
   * @param pageSize Dimensione della pagina
   * @param query Funzione per personalizzare la query
   * @returns Risultato della query con conteggio totale
   */
  protected async executePaginated<T = any>(
    table: string,
    columns = "*",
    page = 0,
    pageSize = 10,
    query?: (q: any) => any,
  ): Promise<{ data: T[]; count: number }> {
    return withRetry(async () => {
      let queryBuilder = this.client
        .from(table)
        .select(columns, { count: "exact" })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (query) {
        queryBuilder = query(queryBuilder)
      }

      const { data, error, count } = await queryBuilder.headers(NO_CACHE_HEADERS)

      if (error) throw error
      return {
        data: data as T[],
        count: count || 0,
      }
    }, 2)
  }
}
