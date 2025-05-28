/**
 * Gestione sicura delle sessioni
 */

// Durata della sessione in millisecondi (30 minuti)
const SESSION_DURATION = 30 * 60 * 1000

// Chiavi per sessionStorage
const SESSION_KEY = "supabase_session_data"
const SESSION_EXPIRY_KEY = "supabase_session_expiry"
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minuti prima della scadenza

/**
 * Salva le credenziali di sessione in modo sicuro
 */
export const saveSession = (url: string, key: string): void => {
  try {
    // Crea un oggetto sessione con timestamp di scadenza
    const expiryTime = Date.now() + SESSION_DURATION

    // Salva i dati di sessione
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ url, key }))
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString())
  } catch (error) {
    console.error("Errore nel salvataggio della sessione:", error)
  }
}

/**
 * Recupera le credenziali di sessione se valide
 */
export const getSession = (): { url: string; key: string } | null => {
  try {
    // Verifica se la sessione è scaduta
    const expiryTime = sessionStorage.getItem(SESSION_EXPIRY_KEY)
    if (!expiryTime) return null

    const expiryTimestamp = Number.parseInt(expiryTime)
    const now = Date.now()

    if (expiryTimestamp < now) {
      // Sessione scaduta, pulisci i dati
      clearSession()
      return null
    }

    // Recupera i dati di sessione
    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (!sessionData) return null

    // Estendi la sessione se si avvicina alla scadenza
    if (expiryTimestamp - now < SESSION_REFRESH_THRESHOLD) {
      sessionStorage.setItem(SESSION_EXPIRY_KEY, (now + SESSION_DURATION).toString())
    }

    return JSON.parse(sessionData)
  } catch (error) {
    console.error("Errore nel recupero della sessione:", error)
    return null
  }
}

/**
 * Cancella i dati di sessione
 */
export const clearSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_EXPIRY_KEY)
  } catch (error) {
    console.error("Errore nella cancellazione della sessione:", error)
  }
}

/**
 * Verifica se esiste una sessione valida
 */
export const hasValidSession = (): boolean => {
  try {
    const expiryTime = sessionStorage.getItem(SESSION_EXPIRY_KEY)
    if (!expiryTime || Number.parseInt(expiryTime) < Date.now()) {
      return false
    }

    const sessionData = sessionStorage.getItem(SESSION_KEY)
    return sessionData !== null
  } catch (error) {
    console.error("Errore nella verifica della sessione:", error)
    return false
  }
}
