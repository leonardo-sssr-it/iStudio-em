export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
      pagine: {
        Row: {
          id: number
          modifica: string
          id_utente: number
          attivo: boolean
          titolo: string
          estratto: string | null
          contenuto: string
          categoria: string | null
          tags: Json | null
          immagine: string | null
          pubblicato: string
          privato: boolean | null
        }
        Insert: {
          id?: number
          modifica?: string
          id_utente: number
          attivo?: boolean
          titolo: string
          estratto?: string | null
          contenuto: string
          categoria?: string | null
          tags?: Json | null
          immagine?: string | null
          pubblicato?: string
          privato?: boolean | null
        }
        Update: {
          id?: number
          modifica?: string
          id_utente?: number
          attivo?: boolean
          titolo?: string
          estratto?: string | null
          contenuto?: string
          categoria?: string | null
          tags?: Json | null
          immagine?: string | null
          pubblicato?: string
          privato?: boolean | null
        }
      }
      note: {
        Row: {
          id: number
          titolo: string
          contenuto: string
          creato_il: string | null
          modifica: string | null
          tags: string[] | null
          priorita: string | null
          notifica: string | null
          notebook_id: string | null
          id_utente: string | null
          synced: boolean | null
        }
        Insert: {
          id?: number
          titolo: string
          contenuto: string
          creato_il?: string | null
          modifica?: string | null
          tags?: string[] | null
          priorita?: string | null
          notifica?: string | null
          notebook_id?: string | null
          id_utente?: string | null
          synced?: boolean | null
        }
        Update: {
          id?: number
          titolo?: string
          contenuto?: string
          creato_il?: string | null
          modifica?: string | null
          tags?: string[] | null
          priorita?: string | null
          notifica?: string | null
          notebook_id?: string | null
          id_utente?: string | null
          synced?: boolean | null
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
