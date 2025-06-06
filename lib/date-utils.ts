import { setHours, setMinutes, setSeconds, setMilliseconds, isValid, parseISO } from "date-fns"

/**
 * Normalizza una data impostando l'orario.
 * Per le date di inizio, imposta l'orario a 00:00:00.000.
 * Per le date di fine/scadenza, imposta l'orario a 23:59:59.999.
 * Interpreta la data di input come se fosse UTC per evitare shift dovuti alla timezone locale.
 * @param dateInput La data da normalizzare (stringa ISO, Date object, o numero).
 * @param type 'start' per inizio giornata, 'end' per fine giornata.
 * @returns La data normalizzata come oggetto Date, o undefined se l'input non è valido.
 */
export function normalizeDate(
  dateInput: string | Date | number | null | undefined,
  type: "start" | "end",
): Date | undefined {
  if (dateInput === null || dateInput === undefined) return undefined

  let date: Date
  if (typeof dateInput === "string") {
    // Se è una stringa, prova a parsare come ISO.
    // Per evitare problemi di timezone, se la stringa è solo data (YYYY-MM-DD),
    // la interpretiamo come UTC per mantenere il giorno corretto.
    if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateInput + "T00:00:00.000Z")
    } else {
      date = parseISO(dateInput) // parseISO gestisce stringhe ISO complete
    }
  } else {
    date = new Date(dateInput)
  }

  if (!isValid(date)) return undefined

  // Crea una nuova istanza per evitare di modificare l'oggetto originale
  const normalized = new Date(date.valueOf())

  if (type === "start") {
    return setMilliseconds(setSeconds(setMinutes(setHours(normalized, 0), 0), 0), 0)
  } else {
    // type === 'end'
    return setMilliseconds(setSeconds(setMinutes(setHours(normalized, 23), 59), 59), 999)
  }
}

/**
 * Formatta una data in una stringa leggibile in italiano (DD/MM/YYYY HH:mm).
 * Se la data non è valida o è nulla, restituisce una stringa vuota o un placeholder.
 * @param dateInput La data da formattare.
 * @param placeholder Il placeholder da usare se la data non è valida.
 * @returns La stringa formattata o il placeholder.
 */
export function formatDateDisplay(dateInput: string | Date | null | undefined, placeholder = "-"): string {
  if (!dateInput) return placeholder

  const date = new Date(dateInput)
  if (!isValid(date)) return placeholder

  try {
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (e) {
    return placeholder
  }
}
