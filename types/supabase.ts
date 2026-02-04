export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      anagrafiche: {
        Row: {
          attivo: boolean | null
          banca: string | null
          cap: string | null
          categoria: string | null
          citta: string | null
          codice_fiscale: string | null
          cognome: string | null
          costo_orario: number | null
          data_assunzione: string | null
          data_cessazione: string | null
          data_creazione: string | null
          email: string | null
          iban: string | null
          id: number
          id_azienda: number | null
          indirizzo: string | null
          matricola: string | null
          metadata: Json | null
          modifica: string | null
          nome: string | null
          note: string | null
          partita_iva: string | null
          pec: string | null
          provincia: string | null
          qualifica: string | null
          ragione_sociale: string | null
          settore: string | null
          telefono: string | null
          tipo: string
        }
        Insert: {
          attivo?: boolean | null
          banca?: string | null
          cap?: string | null
          categoria?: string | null
          citta?: string | null
          codice_fiscale?: string | null
          cognome?: string | null
          costo_orario?: number | null
          data_assunzione?: string | null
          data_cessazione?: string | null
          data_creazione?: string | null
          email?: string | null
          iban?: string | null
          id?: number
          id_azienda?: number | null
          indirizzo?: string | null
          matricola?: string | null
          metadata?: Json | null
          modifica?: string | null
          nome?: string | null
          note?: string | null
          partita_iva?: string | null
          pec?: string | null
          provincia?: string | null
          qualifica?: string | null
          ragione_sociale?: string | null
          settore?: string | null
          telefono?: string | null
          tipo: string
        }
        Update: {
          attivo?: boolean | null
          banca?: string | null
          cap?: string | null
          categoria?: string | null
          citta?: string | null
          codice_fiscale?: string | null
          cognome?: string | null
          costo_orario?: number | null
          data_assunzione?: string | null
          data_cessazione?: string | null
          data_creazione?: string | null
          email?: string | null
          iban?: string | null
          id?: number
          id_azienda?: number | null
          indirizzo?: string | null
          matricola?: string | null
          metadata?: Json | null
          modifica?: string | null
          nome?: string | null
          note?: string | null
          partita_iva?: string | null
          pec?: string | null
          provincia?: string | null
          qualifica?: string | null
          ragione_sociale?: string | null
          settore?: string | null
          telefono?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anagrafiche_id_azienda_fkey"
            columns: ["id_azienda"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
        ]
      }
      appuntamenti: {
        Row: {
          attivo: boolean | null
          data_creazione: string | null
          data_fine: string | null
          data_inizio: string | null
          descrizione: string | null
          id: number
          id_att: number | null
          id_cli: number | null
          id_pro: number | null
          id_utente: number | null
          luogo: string | null
          modifica: string
          note: string | null
          notifica: string[] | null
          stato: string | null
          tags: Json | null
          titolo: string | null
        }
        Insert: {
          attivo?: boolean | null
          data_creazione?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          id?: number
          id_att?: number | null
          id_cli?: number | null
          id_pro?: number | null
          id_utente?: number | null
          luogo?: string | null
          modifica: string
          note?: string | null
          notifica?: string[] | null
          stato?: string | null
          tags?: Json | null
          titolo?: string | null
        }
        Update: {
          attivo?: boolean | null
          data_creazione?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          id?: number
          id_att?: number | null
          id_cli?: number | null
          id_pro?: number | null
          id_utente?: number | null
          luogo?: string | null
          modifica?: string
          note?: string | null
          notifica?: string[] | null
          stato?: string | null
          tags?: Json | null
          titolo?: string | null
        }
        Relationships: []
      }
      attivita: {
        Row: {
          attivo: boolean | null
          data_creazione: string | null
          data_fine: string | null
          data_inizio: string | null
          descrizione: string | null
          id: number
          id_app: number | null
          id_cli: number | null
          id_pro: number | null
          id_utente: number | null
          luogo: string | null
          modifica: string
          note: string | null
          notifica: string | null
          priorita: string | null
          stato: string | null
          tags: Json | null
          titolo: string | null
        }
        Insert: {
          attivo?: boolean | null
          data_creazione?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          id?: number
          id_app?: number | null
          id_cli?: number | null
          id_pro?: number | null
          id_utente?: number | null
          luogo?: string | null
          modifica: string
          note?: string | null
          notifica?: string | null
          priorita?: string | null
          stato?: string | null
          tags?: Json | null
          titolo?: string | null
        }
        Update: {
          attivo?: boolean | null
          data_creazione?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          id?: number
          id_app?: number | null
          id_cli?: number | null
          id_pro?: number | null
          id_utente?: number | null
          luogo?: string | null
          modifica?: string
          note?: string | null
          notifica?: string | null
          priorita?: string | null
          stato?: string | null
          tags?: Json | null
          titolo?: string | null
        }
        Relationships: []
      }
      aziende: {
        Row: {
          attivo: boolean | null
          cap: string | null
          citta: string | null
          codice_ateco: string | null
          codice_azienda: string
          codice_fiscale: string | null
          data_creazione: string | null
          email: string | null
          id: number
          id_utente_referente: number | null
          impostazioni: Json | null
          indirizzo: string | null
          modifica: string | null
          note: string | null
          partita_iva: string | null
          pec: string | null
          provincia: string | null
          ragione_sociale: string
          regime_fiscale: string | null
          telefono: string | null
        }
        Insert: {
          attivo?: boolean | null
          cap?: string | null
          citta?: string | null
          codice_ateco?: string | null
          codice_azienda: string
          codice_fiscale?: string | null
          data_creazione?: string | null
          email?: string | null
          id?: number
          id_utente_referente?: number | null
          impostazioni?: Json | null
          indirizzo?: string | null
          modifica?: string | null
          note?: string | null
          partita_iva?: string | null
          pec?: string | null
          provincia?: string | null
          ragione_sociale: string
          regime_fiscale?: string | null
          telefono?: string | null
        }
        Update: {
          attivo?: boolean | null
          cap?: string | null
          citta?: string | null
          codice_ateco?: string | null
          codice_azienda?: string
          codice_fiscale?: string | null
          data_creazione?: string | null
          email?: string | null
          id?: number
          id_utente_referente?: number | null
          impostazioni?: Json | null
          indirizzo?: string | null
          modifica?: string | null
          note?: string | null
          partita_iva?: string | null
          pec?: string | null
          provincia?: string | null
          ragione_sociale?: string
          regime_fiscale?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aziende_id_utente_referente_fkey"
            columns: ["id_utente_referente"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      cantieri: {
        Row: {
          attivo: boolean | null
          avanzamento_percentuale: number | null
          budget_previsto: number | null
          budget_utilizzato: number | null
          cap: string | null
          citta: string | null
          codice_cantiere: string
          coordinate_gps: unknown
          data_creazione: string | null
          data_fine_effettiva: string | null
          data_fine_prevista: string | null
          data_inizio: string | null
          descrizione: string
          id: number
          id_azienda: number | null
          id_cliente: number | null
          id_responsabile: number | null
          impostazioni: Json | null
          indirizzo: string | null
          modifica: string | null
          note: string | null
          provincia: string | null
          stato: string | null
          tags: string[] | null
        }
        Insert: {
          attivo?: boolean | null
          avanzamento_percentuale?: number | null
          budget_previsto?: number | null
          budget_utilizzato?: number | null
          cap?: string | null
          citta?: string | null
          codice_cantiere: string
          coordinate_gps?: unknown
          data_creazione?: string | null
          data_fine_effettiva?: string | null
          data_fine_prevista?: string | null
          data_inizio?: string | null
          descrizione: string
          id?: number
          id_azienda?: number | null
          id_cliente?: number | null
          id_responsabile?: number | null
          impostazioni?: Json | null
          indirizzo?: string | null
          modifica?: string | null
          note?: string | null
          provincia?: string | null
          stato?: string | null
          tags?: string[] | null
        }
        Update: {
          attivo?: boolean | null
          avanzamento_percentuale?: number | null
          budget_previsto?: number | null
          budget_utilizzato?: number | null
          cap?: string | null
          citta?: string | null
          codice_cantiere?: string
          coordinate_gps?: unknown
          data_creazione?: string | null
          data_fine_effettiva?: string | null
          data_fine_prevista?: string | null
          data_inizio?: string | null
          descrizione?: string
          id?: number
          id_azienda?: number | null
          id_cliente?: number | null
          id_responsabile?: number | null
          impostazioni?: Json | null
          indirizzo?: string | null
          modifica?: string | null
          note?: string | null
          provincia?: string | null
          stato?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cantieri_id_azienda_fkey"
            columns: ["id_azienda"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cantieri_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cantieri_id_responsabile_fkey"
            columns: ["id_responsabile"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      clienti: {
        Row: {
          attivo: boolean
          cap: string | null
          citta: string | null
          cittasocieta: string | null
          codicefiscale: string | null
          cognome: string
          data_creazione: string | null
          email: string
          id: number
          id_utente: number
          indirizzo: string | null
          indirizzosocieta: string | null
          modifica: string
          nome: string
          note: string | null
          partitaiva: string | null
          qr: string | null
          rappresentante: boolean | null
          recapiti: string | null
          societa: string | null
        }
        Insert: {
          attivo: boolean
          cap?: string | null
          citta?: string | null
          cittasocieta?: string | null
          codicefiscale?: string | null
          cognome: string
          data_creazione?: string | null
          email: string
          id?: number
          id_utente: number
          indirizzo?: string | null
          indirizzosocieta?: string | null
          modifica: string
          nome: string
          note?: string | null
          partitaiva?: string | null
          qr?: string | null
          rappresentante?: boolean | null
          recapiti?: string | null
          societa?: string | null
        }
        Update: {
          attivo?: boolean
          cap?: string | null
          citta?: string | null
          cittasocieta?: string | null
          codicefiscale?: string | null
          cognome?: string
          data_creazione?: string | null
          email?: string
          id?: number
          id_utente?: number
          indirizzo?: string | null
          indirizzosocieta?: string | null
          modifica?: string
          nome?: string
          note?: string | null
          partitaiva?: string | null
          qr?: string | null
          rappresentante?: boolean | null
          recapiti?: string | null
          societa?: string | null
        }
        Relationships: []
      }
      configurazione: {
        Row: {
          autore: string | null
          debug: boolean | null
          descrizione: string | null
          etichette: Json | null
          feed1: string | null
          feed2: string | null
          feed3: string | null
          gruppi: Json | null
          id: number
          manutenzione: boolean | null
          modifica: string
          moduli: Json | null
          motto: string | null
          priorita: Json | null
          ruoli: Json | null
          seriale1: string[] | null
          seriale2: string[] | null
          seriale3: string[] | null
          sidebar_coll: boolean | null
          sidebar_pos: string | null
          statoapp: Json | null
          statoatt: Json | null
          statopro: Json | null
          tags: Json | null
          titolo: string | null
          URLcookies: string | null
          URLfavicon: string | null
          URLlicenza: string | null
          URLprivacy: string | null
          URLsito: string | null
          URLtermini: string | null
          versione: string | null
        }
        Insert: {
          autore?: string | null
          debug?: boolean | null
          descrizione?: string | null
          etichette?: Json | null
          feed1?: string | null
          feed2?: string | null
          feed3?: string | null
          gruppi?: Json | null
          id?: number
          manutenzione?: boolean | null
          modifica: string
          moduli?: Json | null
          motto?: string | null
          priorita?: Json | null
          ruoli?: Json | null
          seriale1?: string[] | null
          seriale2?: string[] | null
          seriale3?: string[] | null
          sidebar_coll?: boolean | null
          sidebar_pos?: string | null
          statoapp?: Json | null
          statoatt?: Json | null
          statopro?: Json | null
          tags?: Json | null
          titolo?: string | null
          URLcookies?: string | null
          URLfavicon?: string | null
          URLlicenza?: string | null
          URLprivacy?: string | null
          URLsito?: string | null
          URLtermini?: string | null
          versione?: string | null
        }
        Update: {
          autore?: string | null
          debug?: boolean | null
          descrizione?: string | null
          etichette?: Json | null
          feed1?: string | null
          feed2?: string | null
          feed3?: string | null
          gruppi?: Json | null
          id?: number
          manutenzione?: boolean | null
          modifica?: string
          moduli?: Json | null
          motto?: string | null
          priorita?: Json | null
          ruoli?: Json | null
          seriale1?: string[] | null
          seriale2?: string[] | null
          seriale3?: string[] | null
          sidebar_coll?: boolean | null
          sidebar_pos?: string | null
          statoapp?: Json | null
          statoatt?: Json | null
          statopro?: Json | null
          tags?: Json | null
          titolo?: string | null
          URLcookies?: string | null
          URLfavicon?: string | null
          URLlicenza?: string | null
          URLprivacy?: string | null
          URLsito?: string | null
          URLtermini?: string | null
          versione?: string | null
        }
        Relationships: []
      }
      contabilita: {
        Row: {
          aliquota_iva: number | null
          allegati: Json | null
          causale: string | null
          data_competenza_fine: string | null
          data_competenza_inizio: string | null
          data_creazione: string | null
          data_documento: string
          data_pagamento: string | null
          data_registrazione: string | null
          data_scadenza: string | null
          descrizione: string
          id: number
          id_anagrafica: number | null
          id_azienda: number | null
          id_cantiere: number | null
          id_conto: number | null
          id_giornaliera: number | null
          id_nota_spese: number | null
          id_progetto: number | null
          id_utente: number | null
          imponibile: number | null
          importo: number
          importo_iva: number | null
          modalita_pagamento: string | null
          modifica: string | null
          note: string | null
          numero_documento: string | null
          segno: string
          stato_pagamento: string | null
          tipo_documento: string | null
          tipo_movimento: string | null
        }
        Insert: {
          aliquota_iva?: number | null
          allegati?: Json | null
          causale?: string | null
          data_competenza_fine?: string | null
          data_competenza_inizio?: string | null
          data_creazione?: string | null
          data_documento: string
          data_pagamento?: string | null
          data_registrazione?: string | null
          data_scadenza?: string | null
          descrizione: string
          id?: number
          id_anagrafica?: number | null
          id_azienda?: number | null
          id_cantiere?: number | null
          id_conto?: number | null
          id_giornaliera?: number | null
          id_nota_spese?: number | null
          id_progetto?: number | null
          id_utente?: number | null
          imponibile?: number | null
          importo: number
          importo_iva?: number | null
          modalita_pagamento?: string | null
          modifica?: string | null
          note?: string | null
          numero_documento?: string | null
          segno: string
          stato_pagamento?: string | null
          tipo_documento?: string | null
          tipo_movimento?: string | null
        }
        Update: {
          aliquota_iva?: number | null
          allegati?: Json | null
          causale?: string | null
          data_competenza_fine?: string | null
          data_competenza_inizio?: string | null
          data_creazione?: string | null
          data_documento?: string
          data_pagamento?: string | null
          data_registrazione?: string | null
          data_scadenza?: string | null
          descrizione?: string
          id?: number
          id_anagrafica?: number | null
          id_azienda?: number | null
          id_cantiere?: number | null
          id_conto?: number | null
          id_giornaliera?: number | null
          id_nota_spese?: number | null
          id_progetto?: number | null
          id_utente?: number | null
          imponibile?: number | null
          importo?: number
          importo_iva?: number | null
          modalita_pagamento?: string | null
          modifica?: string | null
          note?: string | null
          numero_documento?: string | null
          segno?: string
          stato_pagamento?: string | null
          tipo_documento?: string | null
          tipo_movimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contabilita_id_anagrafica_fkey"
            columns: ["id_anagrafica"]
            isOneToOne: false
            referencedRelation: "anagrafiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contabilita_id_azienda_fkey"
            columns: ["id_azienda"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contabilita_id_cantiere_fkey"
            columns: ["id_cantiere"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contabilita_id_conto_fkey"
            columns: ["id_conto"]
            isOneToOne: false
            referencedRelation: "conti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contabilita_id_progetto_fkey"
            columns: ["id_progetto"]
            isOneToOne: false
            referencedRelation: "progetti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contabilita_id_utente_fkey"
            columns: ["id_utente"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      conti: {
        Row: {
          attivo: boolean | null
          categoria: string | null
          centro_costo: boolean | null
          codice_conto: string
          data_creazione: string | null
          descrizione_conto: string
          gruppo_bilancio: string | null
          id: number
          id_azienda: number | null
          id_padre: number | null
          livello: number | null
          modifica: string | null
          note: string | null
          sezione_cee: string | null
          tipo_conto: string
          utilizzabile: boolean | null
        }
        Insert: {
          attivo?: boolean | null
          categoria?: string | null
          centro_costo?: boolean | null
          codice_conto: string
          data_creazione?: string | null
          descrizione_conto: string
          gruppo_bilancio?: string | null
          id?: number
          id_azienda?: number | null
          id_padre?: number | null
          livello?: number | null
          modifica?: string | null
          note?: string | null
          sezione_cee?: string | null
          tipo_conto: string
          utilizzabile?: boolean | null
        }
        Update: {
          attivo?: boolean | null
          categoria?: string | null
          centro_costo?: boolean | null
          codice_conto?: string
          data_creazione?: string | null
          descrizione_conto?: string
          gruppo_bilancio?: string | null
          id?: number
          id_azienda?: number | null
          id_padre?: number | null
          livello?: number | null
          modifica?: string | null
          note?: string | null
          sezione_cee?: string | null
          tipo_conto?: string
          utilizzabile?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conti_id_azienda_fkey"
            columns: ["id_azienda"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conti_id_padre_fkey"
            columns: ["id_padre"]
            isOneToOne: false
            referencedRelation: "conti"
            referencedColumns: ["id"]
          },
        ]
      }
      giornaliere: {
        Row: {
          allegati: Json | null
          approvata_da: number | null
          condizioni_meteo: string | null
          coordinate_checkin: unknown
          coordinate_checkout: unknown
          costo_giornata: number | null
          costo_straordinario: number | null
          data_approvazione: string | null
          data_giornata: string
          data_registrazione: string | null
          descrizione_attivita: string | null
          id: number
          id_azienda: number | null
          id_cantiere: number
          id_dipendente: number
          id_movimento_contabile: number | null
          id_utente_registrazione: number | null
          materiali_utilizzati: Json | null
          mezzi_utilizzati: string[] | null
          modifica: string | null
          motivo_rifiuto: string | null
          note: string | null
          ora_fine: string | null
          ora_inizio: string | null
          ore_lavorate: number
          ore_straordinario: number | null
          ore_viaggio: number | null
          stato: string | null
          temperatura: number | null
          tipo_attivita: string | null
        }
        Insert: {
          allegati?: Json | null
          approvata_da?: number | null
          condizioni_meteo?: string | null
          coordinate_checkin?: unknown
          coordinate_checkout?: unknown
          costo_giornata?: number | null
          costo_straordinario?: number | null
          data_approvazione?: string | null
          data_giornata: string
          data_registrazione?: string | null
          descrizione_attivita?: string | null
          id?: number
          id_azienda?: number | null
          id_cantiere: number
          id_dipendente: number
          id_movimento_contabile?: number | null
          id_utente_registrazione?: number | null
          materiali_utilizzati?: Json | null
          mezzi_utilizzati?: string[] | null
          modifica?: string | null
          motivo_rifiuto?: string | null
          note?: string | null
          ora_fine?: string | null
          ora_inizio?: string | null
          ore_lavorate: number
          ore_straordinario?: number | null
          ore_viaggio?: number | null
          stato?: string | null
          temperatura?: number | null
          tipo_attivita?: string | null
        }
        Update: {
          allegati?: Json | null
          approvata_da?: number | null
          condizioni_meteo?: string | null
          coordinate_checkin?: unknown
          coordinate_checkout?: unknown
          costo_giornata?: number | null
          costo_straordinario?: number | null
          data_approvazione?: string | null
          data_giornata?: string
          data_registrazione?: string | null
          descrizione_attivita?: string | null
          id?: number
          id_azienda?: number | null
          id_cantiere?: number
          id_dipendente?: number
          id_movimento_contabile?: number | null
          id_utente_registrazione?: number | null
          materiali_utilizzati?: Json | null
          mezzi_utilizzati?: string[] | null
          modifica?: string | null
          motivo_rifiuto?: string | null
          note?: string | null
          ora_fine?: string | null
          ora_inizio?: string | null
          ore_lavorate?: number
          ore_straordinario?: number | null
          ore_viaggio?: number | null
          stato?: string | null
          temperatura?: number | null
          tipo_attivita?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giornaliere_approvata_da_fkey"
            columns: ["approvata_da"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giornaliere_id_azienda_fkey"
            columns: ["id_azienda"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giornaliere_id_cantiere_fkey"
            columns: ["id_cantiere"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giornaliere_id_dipendente_fkey"
            columns: ["id_dipendente"]
            isOneToOne: false
            referencedRelation: "anagrafiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giornaliere_id_movimento_contabile_fkey"
            columns: ["id_movimento_contabile"]
            isOneToOne: false
            referencedRelation: "contabilita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giornaliere_id_utente_registrazione_fkey"
            columns: ["id_utente_registrazione"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      log_sistema: {
        Row: {
          azione: string
          codice_errore: string | null
          correlation_id: string | null
          dati_dopo: Json | null
          dati_prima: Json | null
          descrizione: string | null
          durata_ms: number | null
          endpoint: string | null
          entita: string | null
          esito: string
          id: number
          id_record: number | null
          id_utente: number | null
          ip_address: unknown
          messaggio_errore: string | null
          metadata: Json | null
          metodo_http: string | null
          ruolo: string | null
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
          username: string | null
        }
        Insert: {
          azione: string
          codice_errore?: string | null
          correlation_id?: string | null
          dati_dopo?: Json | null
          dati_prima?: Json | null
          descrizione?: string | null
          durata_ms?: number | null
          endpoint?: string | null
          entita?: string | null
          esito: string
          id?: number
          id_record?: number | null
          id_utente?: number | null
          ip_address?: unknown
          messaggio_errore?: string | null
          metadata?: Json | null
          metodo_http?: string | null
          ruolo?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          username?: string | null
        }
        Update: {
          azione?: string
          codice_errore?: string | null
          correlation_id?: string | null
          dati_dopo?: Json | null
          dati_prima?: Json | null
          descrizione?: string | null
          durata_ms?: number | null
          endpoint?: string | null
          entita?: string | null
          esito?: string
          id?: number
          id_record?: number | null
          id_utente?: number | null
          ip_address?: unknown
          messaggio_errore?: string | null
          metadata?: Json | null
          metodo_http?: string | null
          ruolo?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_sistema_id_utente_fkey"
            columns: ["id_utente"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          attivo: boolean | null
          categoria_media: string | null
          data_creazione: string | null
          descrizione: string | null
          dimensioni: Json | null
          id: number
          id_app: number | null
          id_att: number | null
          id_cli: number | null
          id_parent: number | null
          id_pro: number | null
          id_sca: number | null
          id_utente: number | null
          metadata: Json | null
          mime_type: string | null
          modifica: string
          note: string | null
          slug: string | null
          tags: string[] | null
          tipo: string | null
          titolo: string | null
          URLmedia: string | null
          visibilita: string | null
        }
        Insert: {
          alt_text?: string | null
          attivo?: boolean | null
          categoria_media?: string | null
          data_creazione?: string | null
          descrizione?: string | null
          dimensioni?: Json | null
          id?: number
          id_app?: number | null
          id_att?: number | null
          id_cli?: number | null
          id_parent?: number | null
          id_pro?: number | null
          id_sca?: number | null
          id_utente?: number | null
          metadata?: Json | null
          mime_type?: string | null
          modifica?: string
          note?: string | null
          slug?: string | null
          tags?: string[] | null
          tipo?: string | null
          titolo?: string | null
          URLmedia?: string | null
          visibilita?: string | null
        }
        Update: {
          alt_text?: string | null
          attivo?: boolean | null
          categoria_media?: string | null
          data_creazione?: string | null
          descrizione?: string | null
          dimensioni?: Json | null
          id?: number
          id_app?: number | null
          id_att?: number | null
          id_cli?: number | null
          id_parent?: number | null
          id_pro?: number | null
          id_sca?: number | null
          id_utente?: number | null
          metadata?: Json | null
          mime_type?: string | null
          modifica?: string
          note?: string | null
          slug?: string | null
          tags?: string[] | null
          tipo?: string | null
          titolo?: string | null
          URLmedia?: string | null
          visibilita?: string | null
        }
        Relationships: []
      }
      note: {
        Row: {
          contenuto: string
          data_creazione: string | null
          id: number
          id_utente: number
          modifica: string | null
          notebook_id: number | null
          notifica: string | null
          priorita: number | null
          synced: boolean | null
          tags: Json[] | null
          titolo: string
        }
        Insert: {
          contenuto: string
          data_creazione?: string | null
          id?: number
          id_utente: number
          modifica?: string | null
          notebook_id?: number | null
          notifica?: string | null
          priorita?: number | null
          synced?: boolean | null
          tags?: Json[] | null
          titolo: string
        }
        Update: {
          contenuto?: string
          data_creazione?: string | null
          id?: number
          id_utente?: number
          modifica?: string | null
          notebook_id?: number | null
          notifica?: string | null
          priorita?: number | null
          synced?: boolean | null
          tags?: Json[] | null
          titolo?: string
        }
        Relationships: []
      }
      notespese: {
        Row: {
          aliquota_iva: number | null
          allegati: Json | null
          approvata_da: number | null
          data_approvazione: string | null
          data_creazione: string | null
          data_nota: string
          data_pagamento: string | null
          data_rimborso: string | null
          descrizione: string
          id: number
          id_azienda: number | null
          id_cantiere: number | null
          id_conto: number | null
          id_dipendente: number
          id_movimento_rimborso: number | null
          id_progetto: number | null
          id_utente_inserimento: number | null
          imponibile: number | null
          importo: number
          importo_rimborsato: number | null
          iva: number | null
          km_percorsi: number | null
          modalita_pagamento: string | null
          modifica: string | null
          motivo_rifiuto: string | null
          note: string | null
          numero_documento: string | null
          numero_nota: string | null
          rimborsabile: boolean | null
          stato: string | null
          tariffa_km: number | null
          tipo_documento: string | null
          tipo_spesa: string
        }
        Insert: {
          aliquota_iva?: number | null
          allegati?: Json | null
          approvata_da?: number | null
          data_approvazione?: string | null
          data_creazione?: string | null
          data_nota: string
          data_pagamento?: string | null
          data_rimborso?: string | null
          descrizione: string
          id?: number
          id_azienda?: number | null
          id_cantiere?: number | null
          id_conto?: number | null
          id_dipendente: number
          id_movimento_rimborso?: number | null
          id_progetto?: number | null
          id_utente_inserimento?: number | null
          imponibile?: number | null
          importo: number
          importo_rimborsato?: number | null
          iva?: number | null
          km_percorsi?: number | null
          modalita_pagamento?: string | null
          modifica?: string | null
          motivo_rifiuto?: string | null
          note?: string | null
          numero_documento?: string | null
          numero_nota?: string | null
          rimborsabile?: boolean | null
          stato?: string | null
          tariffa_km?: number | null
          tipo_documento?: string | null
          tipo_spesa: string
        }
        Update: {
          aliquota_iva?: number | null
          allegati?: Json | null
          approvata_da?: number | null
          data_approvazione?: string | null
          data_creazione?: string | null
          data_nota?: string
          data_pagamento?: string | null
          data_rimborso?: string | null
          descrizione?: string
          id?: number
          id_azienda?: number | null
          id_cantiere?: number | null
          id_conto?: number | null
          id_dipendente?: number
          id_movimento_rimborso?: number | null
          id_progetto?: number | null
          id_utente_inserimento?: number | null
          imponibile?: number | null
          importo?: number
          importo_rimborsato?: number | null
          iva?: number | null
          km_percorsi?: number | null
          modalita_pagamento?: string | null
          modifica?: string | null
          motivo_rifiuto?: string | null
          note?: string | null
          numero_documento?: string | null
          numero_nota?: string | null
          rimborsabile?: boolean | null
          stato?: string | null
          tariffa_km?: number | null
          tipo_documento?: string | null
          tipo_spesa?: string
        }
        Relationships: [
          {
            foreignKeyName: "notespese_approvata_da_fkey"
            columns: ["approvata_da"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_azienda_fkey"
            columns: ["id_azienda"]
            isOneToOne: false
            referencedRelation: "aziende"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_cantiere_fkey"
            columns: ["id_cantiere"]
            isOneToOne: false
            referencedRelation: "cantieri"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_conto_fkey"
            columns: ["id_conto"]
            isOneToOne: false
            referencedRelation: "conti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_dipendente_fkey"
            columns: ["id_dipendente"]
            isOneToOne: false
            referencedRelation: "anagrafiche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_movimento_rimborso_fkey"
            columns: ["id_movimento_rimborso"]
            isOneToOne: false
            referencedRelation: "contabilita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_progetto_fkey"
            columns: ["id_progetto"]
            isOneToOne: false
            referencedRelation: "progetti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notespese_id_utente_inserimento_fkey"
            columns: ["id_utente_inserimento"]
            isOneToOne: false
            referencedRelation: "utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      notifiche: {
        Row: {
          id: number
          id_utente: string
          letta: boolean
          link: string | null
          messaggio: string
          modifica: string | null
          tipo: string
          titolo: string
        }
        Insert: {
          id: number
          id_utente: string
          letta?: boolean
          link?: string | null
          messaggio: string
          modifica?: string | null
          tipo: string
          titolo: string
        }
        Update: {
          id?: number
          id_utente?: string
          letta?: boolean
          link?: string | null
          messaggio?: string
          modifica?: string | null
          tipo?: string
          titolo?: string
        }
        Relationships: []
      }
      pagine: {
        Row: {
          attivo: boolean
          categoria: string | null
          contenuto: string
          data_creazione: string | null
          estratto: string | null
          id: number
          id_utente: number
          immagine: string | null
          modifica: string
          privato: boolean | null
          pubblicato: string
          tags: Json | null
          titolo: string
        }
        Insert: {
          attivo: boolean
          categoria?: string | null
          contenuto: string
          data_creazione?: string | null
          estratto?: string | null
          id?: number
          id_utente: number
          immagine?: string | null
          modifica: string
          privato?: boolean | null
          pubblicato: string
          tags?: Json | null
          titolo: string
        }
        Update: {
          attivo?: boolean
          categoria?: string | null
          contenuto?: string
          data_creazione?: string | null
          estratto?: string | null
          id?: number
          id_utente?: number
          immagine?: string | null
          modifica?: string
          privato?: boolean | null
          pubblicato?: string
          tags?: Json | null
          titolo?: string
        }
        Relationships: []
      }
      primanota: {
        Row: {
          data_op: string
          descr_op: string
          economico_op: string
          finanziario_op: string
          id: number
          id_utente: number
          importo_op: number
          modifica: string
          note_op: string | null
          segno_op: string
        }
        Insert: {
          data_op: string
          descr_op: string
          economico_op: string
          finanziario_op: string
          id?: number
          id_utente: number
          importo_op: number
          modifica: string
          note_op?: string | null
          segno_op: string
        }
        Update: {
          data_op?: string
          descr_op?: string
          economico_op?: string
          finanziario_op?: string
          id?: number
          id_utente?: number
          importo_op?: number
          modifica?: string
          note_op?: string | null
          segno_op?: string
        }
        Relationships: []
      }
      progetti: {
        Row: {
          allegati: Json | null
          attivo: boolean | null
          avanzamento: number | null
          budget: number | null
          colore: string | null
          data_fine: string | null
          data_inizio: string | null
          descrizione: string | null
          gruppo: string | null
          id: number
          id_app: number[] | null
          id_att: number[] | null
          id_cli: number[] | null
          id_sca: number[] | null
          id_utente: number | null
          modifica: string
          note: string | null
          notifica: string | null
          priorita: string | null
          stato: string | null
          tags: string | null
          titolo: string | null
        }
        Insert: {
          allegati?: Json | null
          attivo?: boolean | null
          avanzamento?: number | null
          budget?: number | null
          colore?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          gruppo?: string | null
          id?: number
          id_app?: number[] | null
          id_att?: number[] | null
          id_cli?: number[] | null
          id_sca?: number[] | null
          id_utente?: number | null
          modifica: string
          note?: string | null
          notifica?: string | null
          priorita?: string | null
          stato?: string | null
          tags?: string | null
          titolo?: string | null
        }
        Update: {
          allegati?: Json | null
          attivo?: boolean | null
          avanzamento?: number | null
          budget?: number | null
          colore?: string | null
          data_fine?: string | null
          data_inizio?: string | null
          descrizione?: string | null
          gruppo?: string | null
          id?: number
          id_app?: number[] | null
          id_att?: number[] | null
          id_cli?: number[] | null
          id_sca?: number[] | null
          id_utente?: number | null
          modifica?: string
          note?: string | null
          notifica?: string | null
          priorita?: string | null
          stato?: string | null
          tags?: string | null
          titolo?: string | null
        }
        Relationships: []
      }
      ruoli: {
        Row: {
          attivo: boolean | null
          codice: string
          data_creazione: string | null
          descrizione: string | null
          id: number
          livello: number
          modifica: string | null
          nome: string
          permessi: Json | null
        }
        Insert: {
          attivo?: boolean | null
          codice: string
          data_creazione?: string | null
          descrizione?: string | null
          id?: number
          livello: number
          modifica?: string | null
          nome: string
          permessi?: Json | null
        }
        Update: {
          attivo?: boolean | null
          codice?: string
          data_creazione?: string | null
          descrizione?: string | null
          id?: number
          livello?: number
          modifica?: string | null
          nome?: string
          permessi?: Json | null
        }
        Relationships: []
      }
      scadenze: {
        Row: {
          attivo: boolean
          data_creazione: string | null
          descrizione: string | null
          id: number
          id_pro: number | null
          id_utente: number | null
          modifica: string
          note: string | null
          notifica: string | null
          privato: boolean | null
          scadenza: string
          stato: string | null
          tags: Json[] | null
          titolo: string | null
        }
        Insert: {
          attivo: boolean
          data_creazione?: string | null
          descrizione?: string | null
          id?: number
          id_pro?: number | null
          id_utente?: number | null
          modifica: string
          note?: string | null
          notifica?: string | null
          privato?: boolean | null
          scadenza: string
          stato?: string | null
          tags?: Json[] | null
          titolo?: string | null
        }
        Update: {
          attivo?: boolean
          data_creazione?: string | null
          descrizione?: string | null
          id?: number
          id_pro?: number | null
          id_utente?: number | null
          modifica?: string
          note?: string | null
          notifica?: string | null
          privato?: boolean | null
          scadenza?: string
          stato?: string | null
          tags?: Json[] | null
          titolo?: string | null
        }
        Relationships: []
      }
      sessioni: {
        Row: {
          expire: string
          sess: Json
          sid: string
        }
        Insert: {
          expire: string
          sess: Json
          sid: string
        }
        Update: {
          expire?: string
          sess?: Json
          sid?: string
        }
        Relationships: []
      }
      temi: {
        Row: {
          attivo: boolean | null
          border_radius: string | null
          carattere_colore: string
          carattere_dimensione: number
          carattere_tipo: string
          colore_background: string
          colore_card: string
          colore_div: string
          colore_footer: string
          colore_header: string
          colore_main: string | null
          colore_nav: string | null
          colore_tabs: string
          colore_titolo: string
          css_variables: string | null
          id: number
          is_dark: boolean | null
          modifica: string | null
          nome_tema: string
          palette: Json | null
          tema: Json | null
        }
        Insert: {
          attivo?: boolean | null
          border_radius?: string | null
          carattere_colore?: string
          carattere_dimensione?: number
          carattere_tipo?: string
          colore_background?: string
          colore_card?: string
          colore_div?: string
          colore_footer?: string
          colore_header?: string
          colore_main?: string | null
          colore_nav?: string | null
          colore_tabs?: string
          colore_titolo?: string
          css_variables?: string | null
          id: number
          is_dark?: boolean | null
          modifica?: string | null
          nome_tema?: string
          palette?: Json | null
          tema?: Json | null
        }
        Update: {
          attivo?: boolean | null
          border_radius?: string | null
          carattere_colore?: string
          carattere_dimensione?: number
          carattere_tipo?: string
          colore_background?: string
          colore_card?: string
          colore_div?: string
          colore_footer?: string
          colore_header?: string
          colore_main?: string | null
          colore_nav?: string | null
          colore_tabs?: string
          colore_titolo?: string
          css_variables?: string | null
          id?: number
          is_dark?: boolean | null
          modifica?: string | null
          nome_tema?: string
          palette?: Json | null
          tema?: Json | null
        }
        Relationships: []
      }
      todolist: {
        Row: {
          completato: boolean | null
          data_creazione: string | null
          descrizione: string
          id: number
          id_utente: number
          modifica: string
          notifica: string | null
          priorita: string | null
          scadenza: string | null
          stato: string | null
          tags: Json | null
          titolo: string | null
        }
        Insert: {
          completato?: boolean | null
          data_creazione?: string | null
          descrizione: string
          id?: number
          id_utente: number
          modifica: string
          notifica?: string | null
          priorita?: string | null
          scadenza?: string | null
          stato?: string | null
          tags?: Json | null
          titolo?: string | null
        }
        Update: {
          completato?: boolean | null
          data_creazione?: string | null
          descrizione?: string
          id?: number
          id_utente?: number
          modifica?: string
          notifica?: string | null
          priorita?: string | null
          scadenza?: string | null
          stato?: string | null
          tags?: Json | null
          titolo?: string | null
        }
        Relationships: []
      }
      utenti: {
        Row: {
          attivo: boolean
          bio: string | null
          cap: string | null
          citta: string | null
          codfisc: string | null
          cognome: string | null
          data_creazione: string | null
          email: string
          id: number
          immagine: string | null
          indirizzo: string | null
          modifica: string | null
          nome: string | null
          nomestudio: string | null
          note: string | null
          notestudio: string | null
          orari: string | null
          password: string
          pec: string | null
          piva: string | null
          recapiti: string | null
          ruolo: string
          sede: string | null
          telefono: string | null
          ultimo_accesso: string | null
          username: string
        }
        Insert: {
          attivo: boolean
          bio?: string | null
          cap?: string | null
          citta?: string | null
          codfisc?: string | null
          cognome?: string | null
          data_creazione?: string | null
          email: string
          id?: number
          immagine?: string | null
          indirizzo?: string | null
          modifica?: string | null
          nome?: string | null
          nomestudio?: string | null
          note?: string | null
          notestudio?: string | null
          orari?: string | null
          password: string
          pec?: string | null
          piva?: string | null
          recapiti?: string | null
          ruolo: string
          sede?: string | null
          telefono?: string | null
          ultimo_accesso?: string | null
          username: string
        }
        Update: {
          attivo?: boolean
          bio?: string | null
          cap?: string | null
          citta?: string | null
          codfisc?: string | null
          cognome?: string | null
          data_creazione?: string | null
          email?: string
          id?: number
          immagine?: string | null
          indirizzo?: string | null
          modifica?: string | null
          nome?: string | null
          nomestudio?: string | null
          note?: string | null
          notestudio?: string | null
          orari?: string | null
          password?: string
          pec?: string | null
          piva?: string | null
          recapiti?: string | null
          ruolo?: string
          sede?: string | null
          telefono?: string | null
          ultimo_accesso?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_cantieri_contabilita: {
        Row: {
          budget_previsto: number | null
          budget_residuo: number | null
          codice_cantiere: string | null
          descrizione: string | null
          id: number | null
          stato: string | null
          totale_costi: number | null
          totale_ricavi: number | null
        }
        Relationships: []
      }
      v_cantieri_ore: {
        Row: {
          codice_cantiere: string | null
          descrizione: string | null
          id_cantiere: number | null
          num_dipendenti: number | null
          totale_costo_manodopera: number | null
          totale_ore_lavorate: number | null
          totale_ore_straordinario: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_user_email: { Args: { user_email: string }; Returns: undefined }
      exec_sql: { Args: { sql_query: string }; Returns: Json }
      find_user_by_credentials: {
        Args: { email_or_username: string }
        Returns: {
          attivo: boolean
          email: string
          id: number
          password: string
          ruolo: string
          username: string
        }[]
      }
      get_appuntamenti_utente: {
        Args: { id_utente_param: number }
        Returns: {
          attivo: boolean
          datafine: string
          datainizio: string
          descrizione: string
          id: number
          id_pro: number
          luogo: string
          stato: string
          titolo: string
        }[]
      }
      get_attivita_utente: {
        Args: { id_utente_param: number }
        Returns: {
          attivo: boolean
          datafine: string
          datainizio: string
          descrizione: string
          id: number
          id_pro: number
          priorita: string
          stato: string
          titolo: string
        }[]
      }
      get_clienti_utente: {
        Args: { id_utente_param: number }
        Returns: {
          attivo: boolean
          cognome: string
          email: string
          id: number
          nome: string
          recapiti: string
          societa: string
        }[]
      }
      get_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
          is_identity: string
          is_nullable: string
          is_primary: boolean
        }[]
      }
      get_progetti_utente: {
        Args: { id_utente_param: number }
        Returns: {
          attivo: boolean
          avanzamento: number
          colore: string
          data_fine: string
          data_inizio: string
          descrizione: string
          id: number
          priorita: string
          stato: string
          titolo: string
        }[]
      }
      get_scadenze_utente: {
        Args: { id_utente_param: number }
        Returns: {
          attivo: boolean
          descrizione: string
          id: number
          id_pro: number
          scadenza: string
          stato: string
          titolo: string
        }[]
      }
      get_table_data: {
        Args: {
          page_number?: number
          page_size?: number
          sort_column?: string
          sort_direction?: string
          table_name: string
        }
        Returns: Json
      }
      get_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      get_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          cognome: string
          display_name: string
          email: string
          id: string
          nome: string
          username: string
        }[]
      }
      hash_password: { Args: { password: string }; Returns: string }
      list_backups: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          file_path: string
          id: string
          last_restored_at: string
          name: string
          size: number
        }[]
      }
      list_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      sincronizza_utenti: { Args: Record<PropertyKey, never>; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
