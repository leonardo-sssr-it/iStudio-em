import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { NO_CACHE_HEADERS } from "./no-cache"
import { sanitizeIdentifier } from "./utils"

// Singleton per il client Supabase
let supabaseInstance: SupabaseClient | null = null

/**
 * Crea o restituisce un'istanza singleton del client Supabase
 * @returns Client Supabase configurato
 */
export function createClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Variabili d'ambiente Supabase mancanti")
  }

  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseInstance
}

/**
 * Crea una query Supabase con headers no-cache
 * @param supabase Client Supabase
 * @param table Nome della tabella
 * @param columns Colonne da selezionare (default: "*")
 * @param options Opzioni aggiuntive per la query
 * @returns Query Supabase con headers no-cache
 */
export function createSupabaseQuery(
  supabase: SupabaseClient,
  table: string,
  columns = "*",
  options: { count?: "exact" | "planned" | "estimated"; head?: boolean } = {},
) {
  // Sanitizza il nome della tabella per prevenire SQL injection
  const sanitizedTable = sanitizeIdentifier(table)

  if (!sanitizedTable) {
    throw new Error(`Nome tabella non valido: ${table}`)
  }

  return supabase.from(sanitizedTable).select(columns, {
    ...options,
    headers: NO_CACHE_HEADERS,
  })
}

/**
 * Esegue una chiamata RPC con headers no-cache
 * @param supabase Client Supabase
 * @param procedure Nome della procedura RPC
 * @param params Parametri della procedura
 * @returns Risultato della chiamata RPC
 */
export function executeRpc<T = any>(supabase: SupabaseClient, procedure: string, params: Record<string, any> = {}) {
  // Sanitizza il nome della procedura per prevenire SQL injection
  const sanitizedProcedure = sanitizeIdentifier(procedure)

  if (!sanitizedProcedure) {
    throw new Error(`Nome procedura non valido: ${procedure}`)
  }

  return supabase.rpc(sanitizedProcedure, params, { headers: NO_CACHE_HEADERS })
}

/**
 * Ottiene i dati di un bucket di storage con headers no-cache
 * @param supabase Client Supabase
 * @param bucketName Nome del bucket
 * @param path Percorso all'interno del bucket (default: "")
 * @param options Opzioni per la query
 * @returns Risultato della query
 */
export function listStorageItems(
  supabase: SupabaseClient,
  bucketName: string,
  path = "",
  options: { limit?: number; offset?: number; sortBy?: { column: string; order: "asc" | "desc" } } = {},
) {
  // Sanitizza il nome del bucket per prevenire injection
  const sanitizedBucket = sanitizeIdentifier(bucketName)

  if (!sanitizedBucket) {
    throw new Error(`Nome bucket non valido: ${bucketName}`)
  }

  return supabase.storage.from(sanitizedBucket).list(path, options)
}

/**
 * Esegue una query con gestione degli errori e timeout
 * @param queryFn Funzione che esegue la query
 * @param timeoutMs Timeout in millisecondi
 * @returns Risultato della query
 */
export async function executeQueryWithTimeout<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  timeoutMs = 10000,
): Promise<{ data: T | null; error: any }> {
  try {
    // Crea una promise che si risolve dopo il timeout
    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) => {
      setTimeout(() => {
        reject({ data: null, error: new Error(`Timeout dopo ${timeoutMs}ms`) })
      }, timeoutMs)
    })

    // Esegui la query con timeout
    return await Promise.race([queryFn(), timeoutPromise])
  } catch (error) {
    return { data: null, error }
  }
}
