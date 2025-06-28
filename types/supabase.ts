export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      configurazione: {
        Row: {
          id: string
          versione: string | null
          tema_default: string | null
          lingua_default: string | null
          fuso_orario: string | null
          priorita: Json | null
          stati: Json | null
          categorie: Json | null
          tags_predefiniti: Json | null
          impostazioni_notifiche: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          versione?: string | null
          tema_default?: string | null
          lingua_default?: string | null
          fuso_orario?: string | null
          priorita?: Json | null
          stati?: Json | null
          categorie?: Json | null
          tags_predefiniti?: Json | null
          impostazioni_notifiche?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          versione?: string | null
          tema_default?: string | null
          lingua_default?: string | null
          fuso_orario?: string | null
          priorita?: Json | null
          stati?: Json | null
          categorie?: Json | null
          tags_predefiniti?: Json | null
          impostazioni_notifiche?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      note: {
        Row: {
          id: number
          titolo: string
          contenuto: string | null
          id_utente: string
          priorita: string | null
          stato: string | null
          data_creazione: string
          data_modifica: string
          tags: string[] | null
          categoria: string | null
          scadenza: string | null
          completata: boolean | null
        }
        Insert: {
          id?: number
          titolo: string
          contenuto?: string | null
          id_utente: string
          priorita?: string | null
          stato?: string | null
          data_creazione?: string
          data_modifica?: string
          tags?: string[] | null
          categoria?: string | null
          scadenza?: string | null
          completata?: boolean | null
        }
        Update: {
          id?: number
          titolo?: string
          contenuto?: string | null
          id_utente?: string
          priorita?: string | null
          stato?: string | null
          data_creazione?: string
          data_modifica?: string
          tags?: string[] | null
          categoria?: string | null
          scadenza?: string | null
          completata?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "note_id_utente_fkey"
            columns: ["id_utente"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      pagine: {
        Row: {
          id: number
          titolo: string
          contenuto: string | null
          id_utente: string
          data_creazione: string
          data_modifica: string
          pubblicata: boolean | null
          slug: string | null
          meta_description: string | null
          tags: string[] | null
        }
        Insert: {
          id?: number
          titolo: string
          contenuto?: string | null
          id_utente: string
          data_creazione?: string
          data_modifica?: string
          pubblicata?: boolean | null
          slug?: string | null
          meta_description?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: number
          titolo?: string
          contenuto?: string | null
          id_utente?: string
          data_creazione?: string
          data_modifica?: string
          pubblicata?: boolean | null
          slug?: string | null
          meta_description?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pagine_id_utente_fkey"
            columns: ["id_utente"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      utenti: {
        Row: {
          id: string
          email: string
          nome: string | null
          cognome: string | null
          ruolo: string | null
          data_creazione: string
          ultimo_accesso: string | null
          attivo: boolean | null
          avatar_url: string | null
          preferenze: Json | null
        }
        Insert: {
          id: string
          email: string
          nome?: string | null
          cognome?: string | null
          ruolo?: string | null
          data_creazione?: string
          ultimo_accesso?: string | null
          attivo?: boolean | null
          avatar_url?: string | null
          preferenze?: Json | null
        }
        Update: {
          id?: string
          email?: string
          nome?: string | null
          cognome?: string | null
          ruolo?: string | null
          data_creazione?: string
          ultimo_accesso?: string | null
          attivo?: boolean | null
          avatar_url?: string | null
          preferenze?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
