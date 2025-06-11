-- Aggiungi il campo versione se non esiste
DO $$
BEGIN
    -- Verifica se la tabella configurazione esiste
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'configurazione'
    ) THEN
        -- Verifica se il campo versione non esiste
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'configurazione' 
            AND column_name = 'versione'
        ) THEN
            -- Aggiungi il campo versione
            ALTER TABLE configurazione ADD COLUMN versione TEXT DEFAULT '1.0.0';
            RAISE NOTICE 'Campo versione aggiunto con successo';
        ELSE
            RAISE NOTICE 'Il campo versione esiste già';
        END IF;
    ELSE
        -- Crea la tabella configurazione se non esiste
        CREATE TABLE configurazione (
            id SERIAL PRIMARY KEY,
            versione TEXT DEFAULT '1.0.0',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        -- Inserisci un record di default
        INSERT INTO configurazione (versione) VALUES ('1.0.0');
        RAISE NOTICE 'Tabella configurazione creata con campo versione';
    END IF;
END $$;

-- Verifica il risultato
SELECT * FROM configurazione;
