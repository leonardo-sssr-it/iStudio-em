// Configurazione delle variabili d'ambiente

// URL di Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

// Chiave API di Supabase
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Verifica se le variabili d'ambiente sono configurate
export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== ""

// Durata della sessione in millisecondi (7 giorni)
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000
