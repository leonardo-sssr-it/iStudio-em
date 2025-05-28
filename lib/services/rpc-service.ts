import type { SupabaseClient } from "@supabase/supabase-js"
import { NO_CACHE_HEADERS, withRetry } from "../no-cache"

/**
 * Servizio centralizzato per le chiamate RPC a Supabase
 */
export class RpcService {
  private static instance: RpcService | null = null
  private client: SupabaseClient | null = null

  private constructor() {}

  /**
   * Ottiene l'istanza singleton del servizio
   */
  public static getInstance(): RpcService {
    if (!RpcService.instance) {
      RpcService.instance = new RpcService()
    }
    return RpcService.instance
  }

  /**
   * Imposta il client Supabase
   * @param client Client Supabase
   */
  public setClient(client: SupabaseClient): void {
    this.client = client
  }

  /**
   * Esegue una chiamata RPC generica
   * @param procedure Nome della procedura RPC
   * @param params Parametri della procedura
   * @param retries Numero di tentativi in caso di errore
   * @returns Risultato della chiamata RPC
   */
  public async call<T = any>(procedure: string, params: Record<string, any> = {}, retries = 2): Promise<T> {
    if (!this.client) {
      throw new Error("Supabase client non inizializzato. Chiamare setClient prima di utilizzare il servizio RPC.")
    }

    return withRetry(async () => {
      try {
        const { data, error } = await this.client!.rpc(procedure, params, { headers: NO_CACHE_HEADERS })

        if (error) {
          console.error(`Errore nella chiamata RPC ${procedure}:`, error)
          throw error
        }

        return data as T
      } catch (error) {
        console.error(`Eccezione nella chiamata RPC ${procedure}:`, error)
        throw error
      }
    }, retries)
  }

  /**
   * Ottiene l'elenco delle tabelle
   * @returns Lista delle tabelle
   */
  public async getTables(): Promise<{ table_name: string }[]> {
    return this.call<{ table_name: string }[]>("get_tables")
  }

  /**
   * Ottiene le colonne di una tabella
   * @param tableName Nome della tabella
   * @returns Lista delle colonne
   */
  public async getColumns(tableName: string): Promise<any[]> {
    return this.call<any[]>("get_columns", { table_name: tableName })
  }

  /**
   * Ottiene i dati di una tabella con paginazione e ordinamento
   * @param tableName Nome della tabella
   * @param page Numero di pagina (0-based)
   * @param pageSize Dimensione della pagina
   * @param sortColumn Colonna per l'ordinamento
   * @param sortDirection Direzione dell'ordinamento
   * @returns Dati della tabella con conteggio totale
   */
  public async getTableData(
    tableName: string,
    page = 0,
    pageSize = 10,
    sortColumn: string | null = null,
    sortDirection: "asc" | "desc" = "asc",
  ): Promise<{ data: any[]; total_count: number }> {
    return this.call<{ data: any[]; total_count: number }>("get_table_data", {
      table_name: tableName,
      page_number: page,
      page_size: pageSize,
      sort_column: sortColumn,
      sort_direction: sortDirection,
    })
  }
}

/**
 * Hook per utilizzare il servizio RPC
 * @param supabase Client Supabase
 * @returns Servizio RPC
 */
export function useRpcService(supabase: SupabaseClient | null): RpcService {
  const rpcService = RpcService.getInstance()

  if (supabase) {
    rpcService.setClient(supabase)
  }

  return rpcService
}
