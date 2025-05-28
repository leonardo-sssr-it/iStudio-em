-- Aggiungi il campo ultimo_accesso alla tabella utenti se non esiste già
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'utenti'
    AND column_name = 'ultimo_accesso'
  ) THEN
    ALTER TABLE utenti ADD COLUMN ultimo_accesso TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Crea una funzione per aggiornare automaticamente il campo ultimo_accesso
CREATE OR REPLACE FUNCTION update_ultimo_accesso()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultimo_accesso = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea un trigger per aggiornare automaticamente il campo ultimo_accesso
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_ultimo_accesso_trigger'
  ) THEN
    CREATE TRIGGER update_ultimo_accesso_trigger
    BEFORE UPDATE ON utenti
    FOR EACH ROW
    WHEN (OLD.ultimo_accesso IS DISTINCT FROM NEW.ultimo_accesso)
    EXECUTE FUNCTION update_ultimo_accesso();
  END IF;
END $$;
