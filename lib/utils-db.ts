import type { SupabaseClient } from "@supabase/supabase-js"
import { ExpiringCache } from "./cache/expiring-cache"
import { sanitizeIdentifier } from "./utils"
import { createSupabaseQuery, executeRpc } from "@/lib/supabase-helpers"

// Creazione della cache per i campi degli utenti (5 minuti di TTL)
const userFieldsCache = new ExpiringCache<string[]>(5 * 60 * 1000)
const columnsCache = new ExpiringCache<string[]>(5 * 60 * 1000)

/**
 * Formatta un valore per la visualizzazione
 * @param value Valore da formattare
 * @returns Valore formattato come stringa
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) return ""

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  // Riconosci e formatta le date in formato ISO
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    try {
      return new Date(value).toLocaleString()
    } catch (e) {
      return value
    }
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch (e) {
      return "[Oggetto complesso]"
    }
  }

  return String(value)
}

/**
 * Verifica quali campi di una tabella possono contenere ID utente
 * @param supabase Client Supabase
 * @param tableName Nome della tabella
 * @returns Array di nomi di campi che potrebbero contenere ID utente
 */
export const checkUserIdFields = async (supabase: SupabaseClient, tableName: string): Promise<string[]> => {
  if (!supabase) return []

  const sanitizedTableName = sanitizeIdentifier(tableName)
  if (!sanitizedTableName) return []

  // Verifica se il risultato è in cache
  const cacheKey = `user-fields-${sanitizedTableName}`
  const cachedFields = userFieldsCache.get(cacheKey)

  if (cachedFields) {
    return cachedFields
  }

  try {
    // Possibili nomi di campi per l'ID utente
    const possibleFields = ["id_utente", "id_att", "id_app", "id_pro", "id_sca", "id", "user_id", "utente_id"]

    // Ottieni le colonne della tabella
    const columns = await getTableColumns(supabase, sanitizedTableName)

    // Verifica quali campi possibili esistono nella tabella
    const result = possibleFields.filter((field) => columns.includes(field))

    // Salva in cache prima di restituire
    userFieldsCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.error(`Errore nel controllo dei campi utente per ${sanitizedTableName}:`, error)
    return []
  }
}

/**
 * Ottiene le colonne di una tabella
 * @param supabase Client Supabase
 * @param tableName Nome della tabella
 * @returns Array di nomi di colonne
 */
export async function getTableColumns(supabase: SupabaseClient, tableName: string): Promise<string[]> {
  if (!supabase || !tableName) return []

  // Verifica se il risultato è in cache
  const cacheKey = `columns-${tableName}`
  const cachedColumns = columnsCache.get(cacheKey)

  if (cachedColumns) {
    return cachedColumns
  }

  // Prova prima con la funzione RPC
  try {
    const { data, error } = await executeRpc(supabase, "get_columns", { table_name: tableName })

    if (!error && data) {
      const columns = data.map((col: any) => col.column_name)
      columnsCache.set(cacheKey, columns)
      return columns
    }
  } catch (error) {
    console.log(`RPC get_columns fallita per ${tableName}:`, error)
  }

  // Fallback: prova a ottenere una riga dalla tabella
  try {
    const { data, error } = await createSupabaseQuery(supabase, tableName).limit(1)

    if (!error && data && data.length > 0) {
      const columns = Object.keys(data[0])
      columnsCache.set(cacheKey, columns)
      return columns
    }
  } catch (error) {
    console.log(`Fallback select fallito per ${tableName}:`, error)
  }

  return []
}
