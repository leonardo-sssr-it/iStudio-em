/**
 * Interfaccia per una voce nella cache
 */
interface CacheEntry<T> {
  value: T
  expires: number
}

/**
 * Cache con scadenza automatica delle voci
 */
export class ExpiringCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly ttl: number

  /**
   * Crea una nuova cache con scadenza
   * @param ttlMs Tempo di vita delle voci in millisecondi (default: 60000ms = 1 minuto)
   */
  constructor(ttlMs = 60000) {
    this.ttl = ttlMs
  }

  /**
   * Ottiene un valore dalla cache
   * @param key Chiave del valore
   * @returns Il valore se presente e non scaduto, undefined altrimenti
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Imposta un valore nella cache
   * @param key Chiave del valore
   * @param value Valore da memorizzare
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    })
  }

  /**
   * Verifica se una chiave è presente nella cache e non è scaduta
   * @param key Chiave da verificare
   * @returns true se la chiave è presente e non scaduta, false altrimenti
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Elimina una voce dalla cache
   * @param key Chiave della voce da eliminare
   * @returns true se la voce è stata eliminata, false altrimenti
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Svuota la cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Ottiene il numero di voci nella cache (incluse quelle scadute)
   * @returns Numero di voci nella cache
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Pulisce le voci scadute dalla cache
   * @returns Numero di voci eliminate
   */
  cleanup(): number {
    const now = Date.now()
    let deleted = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
        deleted++
      }
    }

    return deleted
  }
}
