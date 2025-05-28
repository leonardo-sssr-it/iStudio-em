-- Crea la tabella utenti se non esiste
CREATE TABLE IF NOT EXISTS utenti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nome TEXT,
  cognome TEXT,
  ruolo TEXT DEFAULT 'user',
  attivo BOOLEAN DEFAULT true,
  ultimo_accesso TIMESTAMP WITH TIME ZONE,
  data_creazione TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crea un utente admin di default se non esiste
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM utenti WHERE username = 'admin') THEN
    INSERT INTO utenti (
      username, 
      email, 
      password, 
      nome, 
      cognome, 
      ruolo, 
      attivo
    ) VALUES (
      'admin',
      'admin@example.com',
      'admin123',
      'Amministratore',
      'Sistema',
      'admin',
      true
    );
  END IF;
END $$;

-- Crea un utente standard di default se non esiste
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM utenti WHERE username = 'user') THEN
    INSERT INTO utenti (
      username, 
      email, 
      password, 
      nome, 
      cognome, 
      ruolo, 
      attivo
    ) VALUES (
      'user',
      'user@example.com',
      'user123',
      'Utente',
      'Standard',
      'user',
      true
    );
  END IF;
END $$;
