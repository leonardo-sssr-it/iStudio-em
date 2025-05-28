import type { SupabaseClient } from "@supabase/supabase-js"
import { BaseRepository } from "./base-repository"
import { sanitizeIdentifier } from "../utils"
import { RpcService } from "../services/rpc-service"
import { createSupabaseQuery } from "@/lib/supabase-helpers"
import { ExpiringCache } from "../cache/expiring-cache"

/**
 * Interfaccia per le informazioni sulle tabelle
 */
export interface TableInfo {
  name: string
  schema?: string
  type?: string
}

/**
 * Interfaccia per le informazioni sulle colonne
 */
export interface ColumnInfo {
  name: string
  type: string
  is_nullable: boolean
  is_identity: boolean
  is_primary: boolean
}

/**
 * Repository per la gestione delle tabelle
 */
export class TablesRepository extends BaseRepository {
  private rpcService: RpcService
  private columnsCache: ExpiringCache<ColumnInfo[]>

  constructor(client: SupabaseClient) {
    super(client)
    this.rpcService = RpcService.getInstance()
    this.rpcService.setClient(client)
    // Inizializza la cache per le colonne (5 minuti di TTL)
    this.columnsCache = new ExpiringCache<ColumnInfo[]>(5 * 60 * 1000)
  }

  /**
   * Ottieni l'elenco delle tabelle
   * @returns Lista delle tabelle
   */
  async getTables(): Promise<TableInfo[]> {
    try {
      // Approccio 1: Prova a utilizzare la funzione RPC
      try {
        const data = await this.rpcService.getTables()
        return data.map((item) => ({
          name: item.table_name,
        }))
      } catch (error) {
        console.log("RPC get_tables non disponibile, utilizzo metodo alternativo")
        return await this.getTablesAlternative()
      }
    } catch (error) {
      console.error("Errore nel recupero delle tabelle:", error)
      return []
    }
  }

  /**
   * Metodi alternativi per ottenere le tabelle se l'RPC fallisce
   */
  private async getTablesAlternative(): Promise<TableInfo[]> {
    // Approccio 2: Prova a ottenere le tabelle direttamente da information_schema
    try {
      const { data, error } = await this.client
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .neq("table_type", "VIEW")
        .not("table_name", "like", "pg_%")
        .order("table_name")

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          name: item.table_name,
        }))
      }
    } catch (schemaError) {
      console.log("Accesso a information_schema fallito, utilizzo metodo alternativo")
    }

    // Approccio 3: Ottieni le tabelle dal sistema di storage
    try {
      const { data, error } = await this.client.storage.listBuckets()

      if (!error && data) {
        return data.map((bucket) => ({
          name: bucket.name + " (storage bucket)",
          type: "storage",
        }))
      }
    } catch (storageError) {
      console.log("Accesso allo storage fallito, utilizzo metodo alternativo")
    }

    // Approccio 4: Prova con alcune tabelle comuni
    return await this.tryCommonTables()
  }

  /**
   * Prova a verificare l'esistenza di tabelle comuni
   */
  private async tryCommonTables(): Promise<TableInfo[]> {
    const commonTables = ["users", "profiles", "auth", "storage", "buckets", "objects", "utenti", "attivita"]
    const foundTables: TableInfo[] = []

    for (const table of commonTables) {
      try {
        const { data, error } = await this.client.from(table).select("*", { count: "exact", head: true }).limit(1)

        if (!error) {
          foundTables.push({
            name: table,
            type: "table",
          })
        }
      } catch (e) {
        // Ignora errori per tabelle che non esistono
      }
    }

    return foundTables
  }

  /**
   * Ottieni le colonne di una tabella
   * @param tableName Nome della tabella
   * @returns Lista delle colonne
   */
  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    // Rimuoviamo " (storage bucket)" se presente
    const cleanTableName = tableName.replace(" (storage bucket)", "")

    // Verifica se i risultati sono in cache
    const cacheKey = `columns_${cleanTableName}`
    const cachedColumns = this.columnsCache.get(cacheKey)

    if (cachedColumns) {
      return cachedColumns
    }

    try {
      // Se è un bucket di storage, restituisci colonne predefinite
      if (tableName.includes("storage bucket")) {
        const storageColumns = this.getStorageBucketColumns()
        this.columnsCache.set(cacheKey, storageColumns)
        return storageColumns
      }

      // Approccio 1: Prova a utilizzare la funzione RPC
      try {
        const data = await this.rpcService.getColumns(cleanTableName)
        const columns = data.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          is_nullable: col.is_nullable === "YES",
          is_identity: col.is_identity === "YES",
          is_primary: col.is_primary === true,
        }))

        this.columnsCache.set(cacheKey, columns)
        return columns
      } catch (error) {
        console.log("RPC get_columns non disponibile, utilizzo metodo alternativo:", error)
      }

      // Approccio 2: Prova a ottenere una riga dalla tabella per vedere le colonne
      try {
        const { data, error } = await createSupabaseQuery(this.client, cleanTableName).limit(1)

        if (!error && data && data.length > 0) {
          const columns = Object.keys(data[0]).map((key) => ({
            name: key,
            type: typeof data[0][key] === "number" ? "numeric" : typeof data[0][key] === "boolean" ? "boolean" : "text",
            is_nullable: true,
            is_identity: key === "id",
            is_primary: key === "id",
          }))

          this.columnsCache.set(cacheKey, columns)
          return columns
        }
      } catch (fallbackError) {
        console.log("Fallback select fallito:", fallbackError)
      }

      // Approccio 3: Prova a ottenere le colonne da information_schema
      const columns = await this.getColumnsFromInformationSchema(cleanTableName)
      if (columns.length > 0) {
        this.columnsCache.set(cacheKey, columns)
        return columns
      }

      // Se arriviamo qui, non siamo riusciti a trovare colonne
      return []
    } catch (error) {
      console.error("Errore nel recupero delle colonne:", error)
      return []
    }
  }

  /**
   * Ottiene le colonne predefinite per i bucket di storage
   */
  private getStorageBucketColumns(): ColumnInfo[] {
    return [
      { name: "id", type: "uuid", is_nullable: false, is_identity: false, is_primary: true },
      { name: "name", type: "text", is_nullable: false, is_identity: false, is_primary: false },
      { name: "owner", type: "text", is_nullable: true, is_identity: false, is_primary: false },
      { name: "created_at", type: "timestamp", is_nullable: false, is_identity: false, is_primary: false },
      { name: "updated_at", type: "timestamp", is_nullable: false, is_identity: false, is_primary: false },
      { name: "public", type: "boolean", is_nullable: false, is_identity: false, is_primary: false },
    ]
  }

  /**
   * Ottiene le colonne da information_schema
   */
  private async getColumnsFromInformationSchema(tableName: string): Promise<ColumnInfo[]> {
    try {
      const { data, error } = await createSupabaseQuery(
        this.client,
        "information_schema.columns",
        `
        column_name,
        data_type,
        is_nullable,
        column_default
      `,
      )
        .eq("table_schema", "public")
        .eq("table_name", tableName)
        .order("ordinal_position")

      if (!error && data && data.length > 0) {
        return data.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          is_nullable: col.is_nullable === "YES",
          is_identity: col.column_default?.includes("nextval") || false,
          is_primary: col.column_name === "id", // Assunzione semplificata
        }))
      }
    } catch (schemaError) {
      console.log("Accesso a information_schema.columns fallito:", schemaError)
    }

    return []
  }

  /**
   * Ottieni i dati di una tabella con paginazione e ordinamento
   * @param tableName Nome della tabella
   * @param page Numero di pagina (0-based)
   * @param pageSize Dimensione della pagina
   * @param sortColumn Colonna per l'ordinamento
   * @param sortDirection Direzione dell'ordinamento
   * @returns Dati della tabella con conteggio totale
   */
  async getTableData(
    tableName: string,
    page = 0,
    pageSize = 10,
    sortColumn: string | null = null,
    sortDirection: "asc" | "desc" = "asc",
  ): Promise<{ data: any[]; count: number }> {
    // Sanitizza i parametri per prevenire SQL injection
    const sanitizedTableName = sanitizeIdentifier(tableName.replace(" (storage bucket)", ""))
    const sanitizedSortDirection = sortDirection === "desc" ? "desc" : "asc"

    // Limita la dimensione della pagina per evitare problemi di performance
    const safePageSize = Math.min(pageSize, 100)

    // Se è un bucket di storage, recuperiamo i file
    if (tableName.includes("storage bucket")) {
      return this.getStorageBucketData(sanitizedTableName, page, safePageSize, sortColumn, sanitizedSortDirection)
    }

    try {
      // Approccio 1: Prova a utilizzare la funzione RPC
      try {
        const result = await this.rpcService.getTableData(
          sanitizedTableName,
          page,
          safePageSize,
          sortColumn ? sanitizeIdentifier(sortColumn) : null,
          sanitizedSortDirection,
        )

        return {
          data: result.data || [],
          count: result.total_count || 0,
        }
      } catch (rpcError) {
        console.log("RPC get_table_data fallita, utilizzo metodo alternativo")
      }

      // Approccio 2: Utilizziamo la query standard
      return await this.getTableDataStandard(sanitizedTableName, page, safePageSize, sortColumn, sanitizedSortDirection)
    } catch (error) {
      console.error("Errore nel recupero dei dati tabella:", error)
      return { data: [], count: 0 }
    }
  }

  /**
   * Ottiene i dati di un bucket di storage
   */
  private async getStorageBucketData(
    bucketName: string,
    page: number,
    pageSize: number,
    sortColumn: string | null,
    sortDirection: "asc" | "desc",
  ): Promise<{ data: any[]; count: number }> {
    try {
      const { data, error } = await this.client.storage.from(bucketName).list("", {
        limit: pageSize,
        offset: page * pageSize,
        sortBy: { column: sortColumn || "name", order: sortDirection },
      })

      if (error) throw error

      // Otteniamo il conteggio totale
      const { data: countData, error: countError } = await this.client.storage
        .from(bucketName)
        .list("", { limit: 1000 })

      if (countError) throw countError

      return {
        data: data || [],
        count: countData?.length || 0,
      }
    } catch (error) {
      console.error("Errore nel recupero dei dati storage:", error)
      return { data: [], count: 0 }
    }
  }

  /**
   * Ottiene i dati di una tabella con paginazione e ordinamento standard
   */
  private async getTableDataStandard(
    tableName: string,
    page: number,
    pageSize: number,
    sortColumn: string | null,
    sortDirection: "asc" | "desc",
  ): Promise<{ data: any[]; count: number }> {
    try {
      // Utilizziamo la funzione helper
      let query = createSupabaseQuery(this.client, tableName, "*", { count: "exact" }).range(
        page * pageSize,
        (page + 1) * pageSize - 1,
      )

      // Aggiungiamo ordinamento se specificato e il campo è valido
      if (sortColumn && typeof sortColumn === "string") {
        const sanitizedSortColumn = sanitizeIdentifier(sortColumn)
        if (sanitizedSortColumn) {
          query = query.order(sanitizedSortColumn, { ascending: sortDirection === "asc" })
        }
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
      }
    } catch (error) {
      console.error("Query standard fallita:", error)
      return { data: [], count: 0 }
    }
  }
}
