// Configurazione delle tabelle per il data explorer
export interface TableFieldConfig {
  fieldOrder: string[]
  types: Record<string, string>
  requiredFields: string[]
  autoFields: string[]
}

export const TABLE_FIELDS: Record<string, TableFieldConfig> = {
  todolist: {
    fieldOrder: ["id", "titolo", "descrizione", "stato", "data_scadenza", "utente_id", "created_at", "updated_at"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      stato: "select",
      data_scadenza: "date",
      utente_id: "number",
      created_at: "datetime",
      updated_at: "datetime",
    },
    requiredFields: ["titolo", "utente_id"],
    autoFields: ["id", "created_at", "updated_at"],
  },
  utenti: {
    fieldOrder: ["id", "nome", "username", "email", "ruolo", "created_at", "updated_at"],
    types: {
      id: "number",
      nome: "string",
      username: "string",
      email: "email",
      ruolo: "select",
      created_at: "datetime",
      updated_at: "datetime",
    },
    requiredFields: ["nome", "username", "email"],
    autoFields: ["id", "created_at", "updated_at"],
  },
  note: {
    fieldOrder: ["id", "titolo", "contenuto", "utente_id", "created_at", "updated_at"],
    types: {
      id: "number",
      titolo: "string",
      contenuto: "text",
      utente_id: "number",
      created_at: "datetime",
      updated_at: "datetime",
    },
    requiredFields: ["titolo", "utente_id"],
    autoFields: ["id", "created_at", "updated_at"],
  },
  pagine: {
    fieldOrder: ["id", "titolo", "contenuto", "slug", "pubblicata", "utente_id", "created_at", "updated_at"],
    types: {
      id: "number",
      titolo: "string",
      contenuto: "text",
      slug: "string",
      pubblicata: "boolean",
      utente_id: "number",
      created_at: "datetime",
      updated_at: "datetime",
    },
    requiredFields: ["titolo", "slug", "utente_id"],
    autoFields: ["id", "created_at", "updated_at"],
  },
  temi: {
    fieldOrder: ["id", "nome", "descrizione", "css_vars", "is_default", "created_at"],
    types: {
      id: "number",
      nome: "string",
      descrizione: "text",
      css_vars: "json",
      is_default: "boolean",
      created_at: "datetime",
    },
    requiredFields: ["nome", "css_vars"],
    autoFields: ["id", "created_at"],
  },
}

// Configurazioni specifiche per stati e ruoli
export const FIELD_OPTIONS = {
  stato: [
    { value: "da_fare", label: "Da fare" },
    { value: "in_corso", label: "In corso" },
    { value: "completato", label: "Completato" },
    { value: "annullato", label: "Annullato" },
  ],
  ruolo: [
    { value: "user", label: "Utente" },
    { value: "admin", label: "Amministratore" },
  ],
}
