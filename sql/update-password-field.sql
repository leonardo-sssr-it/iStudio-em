-- Aggiorna la tabella utenti per supportare password hashate più lunghe
ALTER TABLE utenti 
ALTER COLUMN password TYPE VARCHAR(255);

-- Crea una funzione per hashare le password
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Questa è una funzione di esempio. In produzione, usare bcrypt lato server
  -- Qui simuliamo un hash semplice per scopi dimostrativi
  RETURN 'hashed_' || password;
END;
$$ LANGUAGE plpgsql;

-- Aggiunge un trigger per hashare automaticamente le password
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Se la password è già hashata (inizia con $2a$ per bcrypt), non fare nulla
  IF NEW.password LIKE '$2a$%' OR NEW.password LIKE 'hashed_%' THEN
    RETURN NEW;
  END IF;
  
  -- Altrimenti, hashala
  NEW.password = hash_password(NEW.password);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea il trigger
DROP TRIGGER IF EXISTS hash_password_trigger ON utenti;
CREATE TRIGGER hash_password_trigger
BEFORE INSERT OR UPDATE ON utenti
FOR EACH ROW
EXECUTE FUNCTION hash_password_trigger();

-- Nota: Questo è solo un esempio. In un'applicazione reale,
-- dovresti hashare le password esistenti con un processo di migrazione
-- controllato, non con un trigger automatico.
