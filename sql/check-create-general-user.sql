-- Verifica se esiste l'utente con ID 1
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM utenti WHERE id = 1) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Crea l'utente generale se non esiste
        INSERT INTO utenti (id, username, password, nome, cognome, email, ruolo)
        VALUES (1, 'sistema', 'sistema', 'Sistema', 'Generale', 'sistema@example.com', 'sistema');
        
        RAISE NOTICE 'Utente generale (ID 1) creato con successo';
    ELSE
        RAISE NOTICE 'Utente generale (ID 1) già esistente';
    END IF;
END $$;

-- Verifica l'utente generale
SELECT * FROM utenti WHERE id = 1;
