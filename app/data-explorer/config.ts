// Configurazione delle tabelle per il Data Explorer
export interface TableFieldConfig {
  fieldOrder: string[]
  types: Record<string, string>
  requiredFields: string[]
  autoFields: string[]
  selectOptions?: Record<string, string[]>
  hiddenFields?: string[]
}

export const TABLE_FIELDS: Record<string, TableFieldConfig> = {
  todolist: {
    fieldOrder: [
      "id",
      "titolo",
      "descrizione",
      "scadenza",
      "priorita", // Campo nascosto come richiesto
      "completato",
      "notifica",
      "id_utente",
      "modifica",
    ],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "date",
      priorita: "string",
      completato: "boolean",
      notifica: "time",
      id_utente: "number",
      modifica: "datetime",
    },
    requiredFields: ["titolo", "id_utente"],
    autoFields: ["id", "modifica"],
    selectOptions: {
      priorita: ["bassa", "media", "alta", "urgente"],
    },
    hiddenFields: ["priorita"], // Campo nascosto come richiesto nel codice originale
  },

  utenti: {
    fieldOrder: ["id", "nome", "username", "email", "password", "ruolo", "attivo", "modifica"],
    types: {
      id: "number",
      nome: "string",
      username: "string",
      email: "email",
      password: "password",
      ruolo: "string",
      attivo: "boolean",
      modifica: "datetime",
    },
    requiredFields: ["nome", "username", "email"],
    autoFields: ["id", "modifica"],
    selectOptions: {
      ruolo: ["utente", "admin", "moderatore"],
    },
  },

  note: {
    fieldOrder: [
      "id",
      "titolo",
      "contenuto",
      "data_creazione",
      "modifica",
      "tags",
      "priorita",
      "notifica",
      "notebook_id",
      "id_utente",
      "synced",
      "completato",
    ],
    types: {
      id: "number",
      titolo: "string",
      contenuto: "text",
      data_creazione: "datetime",
      modifica: "datetime",
      tags: "array",
      priorita: "string",
      notifica: "datetime",
      notebook_id: "string",
      id_utente: "string",
      synced: "boolean",
      completato: "boolean",
    },
    requiredFields: ["titolo", "id_utente"],
    autoFields: ["id", "data_creazione", "modifica"],
    selectOptions: {
      priorita: ["bassa", "media", "alta"],
    },
  },

  pagine: {
    fieldOrder: [
      "id",
      "titolo",
      "estratto",
      "contenuto",
      "categoria",
      "tags",
      "immagine",
      "pubblicato",
      "privato",
      "attivo",
      "id_utente",
      "modifica",
    ],
    types: {
      id: "number",
      titolo: "string",
      estratto: "text",
      contenuto: "text",
      categoria: "string",
      tags: "json",
      immagine: "string",
      pubblicato: "datetime",
      privato: "boolean",
      attivo: "boolean",
      id_utente: "number",
      modifica: "datetime",
    },
    requiredFields: ["titolo", "id_utente"],
    autoFields: ["id", "modifica"],
    selectOptions: {
      categoria: ["blog", "pagina", "news", "tutorial"],
    },
  },

  temi: {
    fieldOrder: ["id", "nome", "colori", "attivo", "modifica"],
    types: {
      id: "number",
      nome: "string",
      colori: "json",
      attivo: "boolean",
      modifica: "datetime",
    },
    requiredFields: ["nome"],
    autoFields: ["id", "modifica"],
  },
}

// Helper functions per lavorare con le configurazioni
export function getTableConfig(tableName: string): TableFieldConfig | null {
  return TABLE_FIELDS[tableName] || null
}

export function getVisibleFields(tableName: string): string[] {
  const config = getTableConfig(tableName)
  if (!config) return []

  const hiddenFields = config.hiddenFields || []
  return config.fieldOrder.filter((field) => !hiddenFields.includes(field))
}

export function getEditableFields(tableName: string): string[] {
  const config = getTableConfig(tableName)
  if (!config) return []

  const autoFields = config.autoFields || []
  const hiddenFields = config.hiddenFields || []

  return config.fieldOrder.filter((field) => !autoFields.includes(field) && !hiddenFields.includes(field))
}

export function getFieldType(tableName: string, fieldName: string): string {
  const config = getTableConfig(tableName)
  return config?.types[fieldName] || "string"
}

export function getSelectOptions(tableName: string, fieldName: string): string[] {
  const config = getTableConfig(tableName)
  return config?.selectOptions?.[fieldName] || []
}

export function isRequiredField(tableName: string, fieldName: string): boolean {
  const config = getTableConfig(tableName)
  return config?.requiredFields.includes(fieldName) || false
}

export function isAutoField(tableName: string, fieldName: string): boolean {
  const config = getTableConfig(tableName)
  return config?.autoFields.includes(fieldName) || false
}
