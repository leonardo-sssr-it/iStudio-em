-- Verifica se la tabella utenti esiste
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'utenti'
);

-- Ottieni la struttura della tabella utenti
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'utenti'
ORDER BY ordinal_position;

-- Verifica se ci sono utenti nella tabella
SELECT COUNT(*) FROM utenti;

-- Crea un utente di test se non esiste
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

-- Crea un utente standard di test se non esiste
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
