export type Database = {
  public: {
    Tables: {
      utenti: {
        Row: {
          id: string
          username: string
          email: string
          password: string
          nome: string | null
          cognome: string | null
          ruolo: string
          attivo: boolean
          ultimo_accesso: string | null
          data_creazione: string | null
        }
        Insert: {
          id?: string
          username: string
          email: string
          password: string
          nome?: string | null
          cognome?: string | null
          ruolo?: string
          attivo?: boolean
          ultimo_accesso?: string | null
          data_creazione?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password?: string
          nome?: string | null
          cognome?: string | null
          ruolo?: string
          attivo?: boolean
          ultimo_accesso?: string | null
          data_creazione?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}
