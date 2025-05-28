/**
 * Utility per gestire gli header no-cache nelle richieste API
 * @module no-cache
 */

/**
 * Interfaccia per gli header HTTP standard per prevenire il caching
 */
export interface NoCacheHeaders {
  "Cache-Control": string
  Pragma: string
  Expires: string
}

/**
 * Header HTTP standard per disabilitare il caching del browser e CDN.
 * @description Questi header garantiscono che le risposte non vengano memorizzate nella cache
 * da browser, proxy o CDN, costringendo il client a richiedere sempre dati aggiornati dal server.
 */
export const NO_CACHE_HEADERS: NoCacheHeaders = Object.freeze({
  "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
  Pragma: "no-cache", // Per compatibilità con HTTP/1.0
  Expires: "0", // Data nel passato per forzare la scadenza immediata
})

/**
 * Aggiunge gli header no-cache a un oggetto di opzioni per fetch
 * @template T Tipo dell'oggetto opzioni esteso
 * @param {T} options - Opzioni esistenti per fetch (opzionale)
 * @returns {T & RequestInit} Opzioni con gli header no-cache aggiunti
 */
export function withNoCache<T extends RequestInit | undefined>(options?: T): T & RequestInit {
  return {
    ...options,
    headers: {
      ...options?.headers,
      ...NO_CACHE_HEADERS,
    },
  } as T & RequestInit
}

/**
 * Wrapper per fetch che aggiunge automaticamente gli header no-cache
 * @param url - URL della richiesta
 * @param options - Opzioni per fetch (opzionale)
 * @returns Promise con la risposta
 */
export async function fetchNoCache(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, withNoCache(options))
  } catch (error) {
    console.error(`Errore nella richiesta a ${url}:`, error)
    throw error
  }
}

/**
 * Funzione di utilità per aggiungere timeout alle promise
 * @param promise - Promise da eseguire con timeout
 * @param timeoutMs - Timeout in millisecondi
 * @param message - Messaggio di errore in caso di timeout
 * @returns Promise con timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout dopo ${timeoutMs}ms: ${message}`))
    }, timeoutMs)

    promise.then(
      (result) => {
        clearTimeout(timer)
        resolve(result)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/**
 * Esegue una funzione con tentativi multipli in caso di fallimento
 * @param fn Funzione da eseguire
 * @param retries Numero di tentativi
 * @param delayMs Ritardo tra i tentativi in ms
 * @param onRetry Callback opzionale da chiamare ad ogni nuovo tentativo
 * @returns Promise con il risultato della funzione
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < retries) {
        // Calcola il ritardo con backoff esponenziale
        const backoffDelay = delayMs * Math.pow(2, attempt)

        // Chiama il callback onRetry se fornito
        if (onRetry) {
          onRetry(attempt + 1, lastError)
        } else {
          console.warn(`Tentativo ${attempt + 1}/${retries + 1} fallito:`, error)
        }

        // Attendi prima del prossimo tentativo
        await new Promise((r) => setTimeout(r, backoffDelay))
      }
    }
  }

  throw lastError
}
