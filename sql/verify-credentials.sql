-- Funzione per verificare le credenziali utente
CREATE OR REPLACE FUNCTION verify_credentials(
  p_username_or_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  nome TEXT,
  cognome TEXT,
  ruolo TEXT,
  ultimo_accesso TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verifica se l'input è un'email
  IF p_username_or_email LIKE '%@%' THEN
    RETURN QUERY
    SELECT u.id, u.username, u.email, u.nome, u.cognome, u.ruolo, u.ultimo_accesso
    FROM utenti u
    WHERE u.email = p_username_or_email
    AND u.password = p_password
    AND u.attivo = TRUE;
  ELSE
    RETURN QUERY
    SELECT u.id, u.username, u.email, u.nome, u.cognome, u.ruolo, u.ultimo_accesso
    FROM utenti u
    WHERE u.username = p_username_or_email
    AND u.password = p_password
    AND u.attivo = TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
