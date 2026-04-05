// Tipi per le configurazioni delle tabelle
export interface FieldConfig {
  type: "text" | "number" | "boolean" | "date" | "datetime" | "select" | "textarea" | "json" | "array"
  required?: boolean
  hidden?: boolean
  readonly?: boolean
  options?: string[] // Per campi select
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface TableConfig {
  name: string
  displayName: string
  fields: Record<string, FieldConfig>
  primaryKey: string
  orderBy?: string
  searchFields?: string[]
}

// Configurazioni per tutte le tabelle
export const TABLE_FIELDS: Record<string, TableConfig> = {
  utenti: {
    name: "utenti",
    displayName: "Utenti",
    primaryKey: "id",
    orderBy: "username",
    searchFields: ["username", "email", "nome", "cognome"],
    fields: {
      id: {
        type: "number",
        readonly: true,
        hidden: true,
      },
      username: {
        type: "text",
        required: true,
        placeholder: "Nome utente",
      },
      email: {
        type: "text",
        required: true,
        placeholder: "Email",
        validation: {
          pattern: "^[^@]+@[^@]+\\.[^@]+$",
        },
      },
      password: {
        type: "text",
        required: true,
        placeholder: "Password",
        hidden: true,
      },
      nome: {
        type: "text",
        placeholder: "Nome",
      },
      cognome: {
        type: "text",
        placeholder: "Cognome",
      },
      ruolo: {
        type: "select",
        required: true,
        options: ["admin", "utente", "guest"],
      },
      attivo: {
        type: "boolean",
        required: true,
      },
      ultimo_accesso: {
        type: "datetime",
        readonly: true,
      },
      data_creazione: {
        type: "datetime",
        readonly: true,
      },
    },
  },
  note: {
    name: "note",
    displayName: "Note",
    primaryKey: "id",
    orderBy: "modifica",
    searchFields: ["titolo", "contenuto"],
    fields: {
      id: {
        type: "number",
        readonly: true,
        hidden: true,
      },
      titolo: {
        type: "text",
        required: true,
        placeholder: "Titolo della nota",
      },
      contenuto: {
        type: "textarea",
        required: true,
        placeholder: "Contenuto della nota",
      },
      creato_il: {
        type: "datetime",
        readonly: true,
      },
      modifica: {
        type: "datetime",
        readonly: true,
      },
      tags: {
        type: "array",
        placeholder: "Tags (separati da virgola)",
      },
      priorita: {
        type: "select",
        options: ["bassa", "media", "alta", "urgente"],
        hidden: true, // Come richiesto nel codice originale
      },
      notifica: {
        type: "datetime",
        placeholder: "Data notifica",
      },
      notebook_id: {
        type: "text",
        placeholder: "ID Notebook",
      },
      id_utente: {
        type: "text",
        readonly: true,
      },
      synced: {
        type: "boolean",
      },
    },
  },
  pagine: {
    name: "pagine",
    displayName: "Pagine",
    primaryKey: "id",
    orderBy: "modifica",
    searchFields: ["titolo", "estratto", "contenuto"],
    fields: {
      id: {
        type: "number",
        readonly: true,
        hidden: true,
      },
      modifica: {
        type: "datetime",
        readonly: true,
      },
      id_utente: {
        type: "number",
        required: true,
        readonly: true,
      },
      attivo: {
        type: "boolean",
        required: true,
      },
      titolo: {
        type: "text",
        required: true,
        placeholder: "Titolo della pagina",
      },
      estratto: {
        type: "textarea",
        placeholder: "Estratto della pagina",
      },
      contenuto: {
        type: "textarea",
        required: true,
        placeholder: "Contenuto della pagina",
      },
      categoria: {
        type: "text",
        placeholder: "Categoria",
      },
      tags: {
        type: "json",
        placeholder: "Tags (JSON)",
      },
      immagine: {
        type: "text",
        placeholder: "URL immagine",
      },
      pubblicato: {
        type: "datetime",
        required: true,
      },
      privato: {
        type: "boolean",
      },
    },
  },
  configurazione: {
    name: "configurazione",
    displayName: "Configurazione",
    primaryKey: "id",
    fields: {
      id: {
        type: "text",
        readonly: true,
        hidden: true,
      },
      versione: {
        type: "text",
        placeholder: "Versione",
      },
      nome_app: {
        type: "text",
        placeholder: "Nome applicazione",
      },
      tema_default: {
        type: "text",
        placeholder: "Tema di default",
      },
      lingua_default: {
        type: "text",
        placeholder: "Lingua di default",
      },
      fuso_orario: {
        type: "text",
        placeholder: "Fuso orario",
      },
      debug: {
        type: "boolean",
      },
      priorita: {
        type: "json",
        placeholder: "Priorità (JSON)",
      },
      stati: {
        type: "json",
        placeholder: "Stati (JSON)",
      },
      categorie: {
        type: "json",
        placeholder: "Categorie (JSON)",
      },
      tags_predefiniti: {
        type: "json",
        placeholder: "Tags predefiniti (JSON)",
      },
      impostazioni_notifiche: {
        type: "json",
        placeholder: "Impostazioni notifiche (JSON)",
      },
      created_at: {
        type: "datetime",
        readonly: true,
      },
      updated_at: {
        type: "datetime",
        readonly: true,
      },
    },
  },
  // Configurazione per todolist (se esiste)
  todolist: {
    name: "todolist",
    displayName: "Todo List",
    primaryKey: "id",
    orderBy: "created_at",
    searchFields: ["titolo", "descrizione"],
    fields: {
      id: {
        type: "number",
        readonly: true,
        hidden: true,
      },
      titolo: {
        type: "text",
        required: true,
        placeholder: "Titolo del task",
      },
      descrizione: {
        type: "textarea",
        placeholder: "Descrizione del task",
      },
      completato: {
        type: "boolean",
      },
      priorita: {
        type: "select",
        options: ["bassa", "media", "alta", "urgente"],
        hidden: true, // Come richiesto nel codice originale
      },
      scadenza: {
        type: "datetime",
        placeholder: "Data scadenza",
      },
      id_utente: {
        type: "number",
        readonly: true,
      },
      created_at: {
        type: "datetime",
        readonly: true,
      },
      updated_at: {
        type: "datetime",
        readonly: true,
      },
    },
  },
}

// Helper functions
export function getTableConfig(tableName: string): TableConfig | undefined {
  return TABLE_FIELDS[tableName]
}

export function getVisibleFields(tableName: string): Record<string, FieldConfig> {
  const config = getTableConfig(tableName)
  if (!config) return {}

  return Object.fromEntries(Object.entries(config.fields).filter(([_, fieldConfig]) => !fieldConfig.hidden))
}

export function getEditableFields(tableName: string): Record<string, FieldConfig> {
  const config = getTableConfig(tableName)
  if (!config) return {}

  return Object.fromEntries(
    Object.entries(config.fields).filter(([_, fieldConfig]) => !fieldConfig.hidden && !fieldConfig.readonly),
  )
}

export function getRequiredFields(tableName: string): string[] {
  const config = getTableConfig(tableName)
  if (!config) return []

  return Object.entries(config.fields)
    .filter(([_, fieldConfig]) => fieldConfig.required && !fieldConfig.readonly)
    .map(([fieldName]) => fieldName)
}

export function getSearchableFields(tableName: string): string[] {
  const config = getTableConfig(tableName)
  return config?.searchFields || []
}

export function getFieldType(tableName: string, fieldName: string): string {
  const config = getTableConfig(tableName)
  return config?.fields[fieldName]?.type || "text"
}

export function getFieldOptions(tableName: string, fieldName: string): string[] {
  const config = getTableConfig(tableName)
  return config?.fields[fieldName]?.options || []
}

export function isFieldRequired(tableName: string, fieldName: string): boolean {
  const config = getTableConfig(tableName)
  return config?.fields[fieldName]?.required || false
}

export function isFieldReadonly(tableName: string, fieldName: string): boolean {
  const config = getTableConfig(tableName)
  return config?.fields[fieldName]?.readonly || false
}

export function isFieldHidden(tableName: string, fieldName: string): boolean {
  const config = getTableConfig(tableName)
  return config?.fields[fieldName]?.hidden || false
}
