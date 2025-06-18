// Configurazione dei campi predefiniti per ogni tipo di tabella

// Definizione del tipo per la configurazione delle tabelle
export interface TableFieldConfig {
  displayName: string // Nome visualizzato nell'interfaccia
  fields: string[] // Campi da visualizzare
  sortField?: string // Campo predefinito per l'ordinamento
  dateFields?: string[] // Campi data per la formattazione
  keyField?: string // Campo chiave primaria
}

// Configurazione predefinita per tabelle generiche
const defaultConfig: TableFieldConfig = {
  displayName: "Elementi",
  fields: ["id", "modifica"],
  sortField: "modifica",
  dateFields: ["modifica"],
  keyField: "id",
}

// Configurazione specifica per tipo di tabella
const tableConfigs: Record<string, TableFieldConfig> = {
  // Tabella utenti
  utenti: {
    displayName: "Utenti",
    fields: ["id", "email", "nome", "cognome", "ruolo", "attivo", "data_creazione"],
    sortField: "cognome",
    dateFields: ["data_creazione", "modifica"],
    keyField: "id",
  },

  // Tabella attività
  attivita: {
    displayName: "Attività",
    fields: ["id", "titolo", "id_utente", "data_inizio", "data_fine", "stato", "priorita", "attivo"],
    sortField: "data_inizio",
    dateFields: ["data_inizio", "data_fine", "modifica", "notifica"],
    keyField: "id",
  },

  // Tabella progetti
  progetti: {
    displayName: "Progetti",
    fields: ["id", "titolo", "avanzamento", "id_utente", "data_inizio", "data_fine", "priorita", "stato"],
    sortField: "data_inizio",
    dateFields: ["data_inizio", "data_fine", "modifica", "notifica"],
    keyField: "id",
  },

  // Tabella appuntamenti
  appuntamenti: {
    displayName: "Appuntamenti",
    fields: ["id", "titolo", "id_utente", "data_inizio", "data_fine", "stato"],
    sortField: "data",
    dateFields: ["modifica", "data_inizio", "data_fine", "notifica"],
    keyField: "id",
  },

  // Tabella todolist
  todolist: {
    displayName: "ToDoList",
    fields: ["id", "titolo", "id_utente", "tipo", "scadenza", "priorita"],
    sortField: "scadenza",
    dateFields: ["scadenza", "modifica", "notifica"],
    keyField: "id",
  },

  // Tabella note
  note: {
    displayName: "Note",
    fields: ["id", "titolo", "id_utente", "priorita"],
    sortField: "priorita",
    dateFields: ["data_creazione", "modifica", "notifica"],
    keyField: "id",
  },

  // Tabella scadenze
  scadenze: {
    displayName: "Scadenze",
    fields: ["id", "titolo", "descrizione", "id_utente", "scadenza", "stato"],
    sortField: "scadenza",
    dateFields: ["scadenza", "modifica", "notifica"],
    keyField: "id",
  },

  // Tabella pagine
  pagine: {
    displayName: "Pagine",
    fields: ["id", "titolo", "contenuto", "id_utente", "pubblicato", "privato", "attivo"],
    sortField: "it",
    dateFields: ["pubblicato", "modifica"],
    keyField: "id",
  },

  // Tabella clienti
  clienti: {
    displayName: "Clienti",
    fields: ["id", "cognome", "nome", "id_utente", "attivo"],
    sortField: "id_utente",
    dateFields: ["modifica"],
    keyField: "id",
  },
}

/**
 * Ottiene la configurazione per una tabella specifica
 * @param tableName Nome della tabella
 * @returns Configurazione dei campi per la tabella
 */
export function getTableConfig(tableName: string): TableFieldConfig {
  // Rimuovi eventuali prefissi o suffissi dal nome della tabella
  const cleanTableName = tableName.replace(" (storage bucket)", "").toLowerCase()

  // Cerca una configurazione specifica per questa tabella
  return (
    tableConfigs[cleanTableName] || {
      ...defaultConfig,
      displayName: tableName,
    }
  )
}

/**
 * Formatta un valore di data per la visualizzazione
 * @param value Valore data (string o Date)
 * @returns Data formattata
 */
export function formatDateValue(value: string | Date): string {
  if (!value) return ""

  try {
    const date = typeof value === "string" ? new Date(value) : value
    return date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch (e) {
    return String(value)
  }
}
