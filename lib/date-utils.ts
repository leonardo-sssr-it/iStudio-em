import { parseISO, isValid } from "date-fns"

// Funzioni esistenti...

/**
 * Normalizza una data di scadenza impostando l'orario alle 23:59:59
 * @param date Data da normalizzare (Date o string ISO)
 * @returns Data normalizzata come stringa ISO
 */
export function normalizeDeadlineDate(date: Date | string | null): string | null {
  if (!date) return null

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return null

    // Imposta l'orario a 23:59:59.999
    const normalized = new Date(dateObj)
    normalized.setHours(23, 59, 59, 999)

    return normalized.toISOString()
  } catch (error) {
    console.error("Errore nella normalizzazione della data:", error)
    return null
  }
}

/**
 * Verifica se una data è una scadenza che deve essere normalizzata
 * @param tableName Nome della tabella
 * @param fieldName Nome del campo
 * @returns true se la data deve essere normalizzata
 */
export function isDeadlineField(tableName: string, fieldName: string): boolean {
  return (
    (tableName === "scadenze" && fieldName === "scadenza") || (tableName === "todolist" && fieldName === "scadenza")
  )
}
