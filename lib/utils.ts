import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Unisce classi CSS con supporto per condizioni e tailwind
 * @param inputs Classi CSS da unire
 * @returns Stringa di classi CSS unite
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatta una data in formato italiano
 * @param date Data da formattare
 * @returns Data formattata in italiano
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Formatta una data e ora in formato italiano
 * @param date Data da formattare
 * @returns Data e ora formattata in italiano
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Genera un ID univoco
 * @returns ID univoco
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Ritarda l'esecuzione di una funzione
 * @param ms Millisecondi di ritardo
 * @returns Promise che si risolve dopo il ritardo
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Tronca una stringa se supera la lunghezza massima
 * @param str Stringa da troncare
 * @param maxLength Lunghezza massima
 * @returns Stringa troncata
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return ""
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str
}

/**
 * Sanitizza un identificatore per prevenire SQL injection
 * @param identifier Identificatore da sanitizzare
 * @returns Identificatore sanitizzato o stringa vuota se non valido
 */
export function sanitizeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== "string") return ""

  // Rimuovi caratteri speciali e mantieni solo lettere, numeri e underscore
  return identifier.replace(/[^a-zA-Z0-9_]/g, "")
}

/**
 * Capitalizza la prima lettera di una stringa
 * @param str Stringa da capitalizzare
 * @returns Stringa con la prima lettera maiuscola
 */
export function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Formatta un numero come valuta
 * @param value Valore da formattare
 * @param currency Valuta (default: EUR)
 * @returns Valore formattato come valuta
 */
export function formatCurrency(value: number | string | null | undefined, currency = "EUR"): string {
  if (value === null || value === undefined) return ""
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(numValue)
}

/**
 * Converte un oggetto in parametri di query URL
 * @param params Oggetto con i parametri
 * @returns Stringa di query URL
 */
export function objectToQueryString(params: Record<string, any>): string {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&")
}

/**
 * Estrae i parametri di query da un URL
 * @param url URL da cui estrarre i parametri
 * @returns Oggetto con i parametri di query
 */
export function getQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const queryString = url.split("?")[1]
  if (!queryString) return params

  const pairs = queryString.split("&")
  for (const pair of pairs) {
    const [key, value] = pair.split("=")
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value)
    }
  }

  return params
}

/**
 * Verifica se un oggetto è vuoto
 * @param obj Oggetto da verificare
 * @returns True se l'oggetto è vuoto
 */
export function isEmptyObject(obj: any): boolean {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

/**
 * Rimuove i duplicati da un array
 * @param array Array da cui rimuovere i duplicati
 * @param key Chiave da usare per il confronto (per array di oggetti)
 * @returns Array senza duplicati
 */
export function removeDuplicates<T>(array: T[], key?: keyof T): T[] {
  if (!array || !array.length) return []

  if (key) {
    const seen = new Set()
    return array.filter((item) => {
      const value = item[key]
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })
  }

  return [...new Set(array)]
}

/**
 * Raggruppa un array di oggetti per una chiave
 * @param array Array da raggruppare
 * @param key Chiave da usare per il raggruppamento
 * @returns Oggetto con i gruppi
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    },
    {} as Record<string, T[]>,
  )
}

/**
 * Ordina un array di oggetti per una chiave
 * @param array Array da ordinare
 * @param key Chiave da usare per l'ordinamento
 * @param direction Direzione dell'ordinamento (asc o desc)
 * @returns Array ordinato
 */
export function sortBy<T>(array: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const valueA = a[key]
    const valueB = b[key]

    if (valueA === valueB) return 0

    // Gestione dei valori null o undefined
    if (valueA === null || valueA === undefined) return direction === "asc" ? -1 : 1
    if (valueB === null || valueB === undefined) return direction === "asc" ? 1 : -1

    // Confronto in base al tipo
    if (typeof valueA === "string" && typeof valueB === "string") {
      return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return direction === "asc" ? valueA - valueB : valueB - valueA
    }

    if (valueA instanceof Date && valueB instanceof Date) {
      return direction === "asc" ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime()
    }

    // Fallback per altri tipi
    const stringA = String(valueA)
    const stringB = String(valueB)
    return direction === "asc" ? stringA.localeCompare(stringB) : stringB.localeCompare(stringA)
  })
}

/**
 * Filtra un array di oggetti in base a una condizione
 * @param array Array da filtrare
 * @param predicate Funzione di filtro
 * @returns Array filtrato
 */
export function filterBy<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return array.filter(predicate)
}

/**
 * Converte una stringa in formato snake_case
 * @param str Stringa da convertire
 * @returns Stringa in formato snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .toLowerCase()
}

/**
 * Converte una stringa in formato camelCase
 * @param str Stringa da convertire
 * @returns Stringa in formato camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/\s+/g, "")
    .replace(/[-_]+/g, "")
}

/**
 * Converte una stringa in formato kebab-case
 * @param str Stringa da convertire
 * @returns Stringa in formato kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase()
}

/**
 * Converte una stringa in formato PascalCase
 * @param str Stringa da convertire
 * @returns Stringa in formato PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, "")
    .replace(/[-_]+/g, "")
}

/**
 * Verifica se il dispositivo è touch
 * @returns True se il dispositivo è touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}
