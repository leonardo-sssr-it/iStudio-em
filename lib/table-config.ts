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
    fields: ["id", "email", "username", "nome", "cognome", "ruolo", "attivo", "data_creazione"],
    sortField: "cognome",
    dateFields: ["data_creazione", "modifica", "ultimo_accesso"],
    keyField: "id",
  },

  // Tabella attività
  attivita: {
    displayName: "Attività",
    fields: ["id", "titolo", "id_utente", "data_inizio", "data_fine", "stato", "priorita", "attivo"],
    sortField: "data_inizio",
    dateFields: ["data_inizio", "data_fine", "modifica", "notifica", "data_creazione"],
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
    fields: ["id", "titolo", "id_utente", "data_inizio", "data_fine", "luogo", "stato"],
    sortField: "data_inizio",
    dateFields: ["modifica", "data_inizio", "data_fine", "data_creazione"],
    keyField: "id",
  },

  // Tabella todolist
  todolist: {
    displayName: "ToDoList",
    fields: ["id", "titolo", "descrizione", "id_utente", "scadenza", "priorita", "completato", "stato"],
    sortField: "scadenza",
    dateFields: ["scadenza", "modifica", "notifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella scadenze
  scadenze: {
    displayName: "Scadenze",
    fields: ["id", "titolo", "descrizione", "id_utente", "scadenza", "stato", "attivo"],
    sortField: "scadenza",
    dateFields: ["scadenza", "modifica", "notifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella pagine
  pagine: {
    displayName: "Pagine",
    fields: ["id", "titolo", "categoria", "id_utente", "pubblicato", "privato", "attivo"],
    sortField: "modifica",
    dateFields: ["pubblicato", "modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella clienti
  clienti: {
    displayName: "Clienti",
    fields: ["id", "cognome", "nome", "email", "societa", "id_utente", "attivo"],
    sortField: "cognome",
    dateFields: ["modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella configurazione
  configurazione: {
    displayName: "Configurazione",
    fields: ["id", "titolo", "versione", "autore", "manutenzione", "debug"],
    sortField: "modifica",
    dateFields: ["modifica"],
    keyField: "id",
  },

  // Tabella temi
  temi: {
    displayName: "Temi",
    fields: ["id", "nome_tema", "carattere_tipo", "colore_background", "is_dark", "attivo"],
    sortField: "nome_tema",
    dateFields: ["modifica"],
    keyField: "id",
  },

  // Tabella notifiche
  notifiche: {
    displayName: "Notifiche",
    fields: ["id", "titolo", "messaggio", "tipo", "id_utente", "letta"],
    sortField: "modifica",
    dateFields: ["modifica"],
    keyField: "id",
  },

  // Tabella media
  media: {
    displayName: "Media",
    fields: ["id", "titolo", "tipo", "mime_type", "id_utente", "attivo", "visibilita"],
    sortField: "modifica",
    dateFields: ["modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella primanota
  primanota: {
    displayName: "Prima Nota",
    fields: ["id", "data_op", "descr_op", "importo_op", "segno_op", "economico_op", "finanziario_op"],
    sortField: "data_op",
    dateFields: ["data_op", "modifica"],
    keyField: "id",
  },

  // Tabella note
  note: {
    displayName: "Note",
    fields: ["id", "titolo", "id_utente", "priorita", "synced"],
    sortField: "modifica",
    dateFields: ["modifica", "data_creazione", "notifica"],
    keyField: "id",
  },

  // Tabella aziende
  aziende: {
    displayName: "Aziende",
    fields: ["id", "ragione_sociale", "codice_azienda", "partita_iva", "email", "citta", "attivo"],
    sortField: "ragione_sociale",
    dateFields: ["modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella cantieri
  cantieri: {
    displayName: "Cantieri",
    fields: ["id", "codice_cantiere", "descrizione", "id_cliente", "stato", "avanzamento_percentuale", "data_inizio"],
    sortField: "data_inizio",
    dateFields: ["data_inizio", "data_fine_prevista", "data_fine_effettiva", "modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella contabilita
  contabilita: {
    displayName: "Contabilità",
    fields: ["id", "descrizione", "importo", "segno", "data_documento", "tipo_documento", "stato_pagamento"],
    sortField: "data_documento",
    dateFields: ["data_documento", "data_pagamento", "data_scadenza", "data_registrazione", "modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella giornaliere
  giornaliere: {
    displayName: "Giornaliere",
    fields: ["id", "data_giornata", "id_dipendente", "id_cantiere", "ore_lavorate", "stato", "tipo_attivita"],
    sortField: "data_giornata",
    dateFields: ["data_giornata", "data_registrazione", "data_approvazione", "modifica"],
    keyField: "id",
  },

  // Tabella notespese
  notespese: {
    displayName: "Note Spese",
    fields: ["id", "descrizione", "importo", "tipo_spesa", "data_nota", "id_dipendente", "stato"],
    sortField: "data_nota",
    dateFields: ["data_nota", "data_pagamento", "data_approvazione", "data_rimborso", "modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella log_sistema
  log_sistema: {
    displayName: "Log Sistema",
    fields: ["id", "timestamp", "azione", "entita", "username", "esito", "descrizione"],
    sortField: "timestamp",
    dateFields: ["timestamp"],
    keyField: "id",
  },

  // Tabella conti
  conti: {
    displayName: "Piano dei Conti",
    fields: ["id", "codice_conto", "descrizione_conto", "tipo_conto", "categoria", "attivo", "utilizzabile"],
    sortField: "codice_conto",
    dateFields: ["modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella anagrafiche
  anagrafiche: {
    displayName: "Anagrafiche",
    fields: ["id", "tipo", "nome", "cognome", "ragione_sociale", "email", "qualifica", "attivo"],
    sortField: "cognome",
    dateFields: ["data_assunzione", "data_cessazione", "modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella ruoli
  ruoli: {
    displayName: "Ruoli",
    fields: ["id", "nome", "codice", "livello", "descrizione", "attivo"],
    sortField: "livello",
    dateFields: ["modifica", "data_creazione"],
    keyField: "id",
  },

  // Tabella sessioni
  sessioni: {
    displayName: "Sessioni",
    fields: ["sid", "expire"],
    sortField: "expire",
    dateFields: ["expire"],
    keyField: "sid",
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
