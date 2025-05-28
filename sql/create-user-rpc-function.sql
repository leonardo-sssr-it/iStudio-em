-- Funzione per ottenere gli utenti
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
  id uuid,
  nome text,
  cognome text,
  email text,
  username text,
  display_name text
) AS $$
BEGIN
  -- Prova prima con la tabella 'users'
  BEGIN
    RETURN QUERY
    SELECT 
      u.id,
      COALESCE(u.nome, u.name, u.first_name, '') as nome,
      COALESCE(u.cognome, u.last_name, '') as cognome,
      COALESCE(u.email, '') as email,
      COALESCE(u.username, u.user_name, '') as username,
      COALESCE(u.display_name, '') as display_name
    FROM users u
    ORDER BY u.cognome, u.nome;
  EXCEPTION
    WHEN undefined_table THEN
      -- Se la tabella 'users' non esiste, prova con 'auth.users'
      BEGIN
        RETURN QUERY
        SELECT 
          au.id,
          '' as nome,
          '' as cognome,
          au.email,
          '' as username,
          '' as display_name
        FROM auth.users au
        ORDER BY au.email;
      EXCEPTION
        WHEN undefined_table THEN
          -- Se anche 'auth.users' non esiste, restituisci un risultato vuoto
          RETURN;
      END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
