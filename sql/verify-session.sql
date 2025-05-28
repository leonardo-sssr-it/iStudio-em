-- Funzione per verificare la validità della sessione
CREATE OR REPLACE FUNCTION public.verify_session()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id uuid;
    v_user_id uuid;
    v_user_data json;
    v_session_expiry timestamp;
    v_current_time timestamp := now();
BEGIN
    -- Ottieni l'ID sessione dai cookie
    v_session_id := nullif(current_setting('request.cookie.session_id', true), '')::uuid;
    
    IF v_session_id IS NULL THEN
        RETURN json_build_object('valid', false, 'message', 'Sessione non trovata');
    END IF;
    
    -- Verifica la sessione
    SELECT 
        user_id, 
        expiry
    INTO 
        v_user_id, 
        v_session_expiry
    FROM 
        sessions
    WHERE 
        id = v_session_id;
    
    -- Se la sessione non esiste o è scaduta
    IF v_user_id IS NULL OR v_session_expiry < v_current_time THEN
        -- Elimina la sessione se esiste ma è scaduta
        IF v_user_id IS NOT NULL THEN
            DELETE FROM sessions WHERE id = v_session_id;
        END IF;
        
        RETURN json_build_object('valid', false, 'message', 'Sessione non valida o scaduta');
    END IF;
    
    -- Aggiorna il timestamp di ultimo accesso
    UPDATE sessions 
    SET last_accessed = v_current_time
    WHERE id = v_session_id;
    
    -- Ottieni i dati dell'utente
    SELECT 
        json_build_object(
            'id', u.id,
            'email', u.email,
            'nome', u.nome,
            'cognome', u.cognome,
            'ruolo', u.ruolo,
            'ultimo_accesso', u.ultimo_accesso,
            'creato_il', u.creato_il
        )
    INTO 
        v_user_data
    FROM 
        utenti u
    WHERE 
        u.id = v_user_id;
    
    -- Aggiorna l'ultimo accesso dell'utente
    UPDATE utenti 
    SET ultimo_accesso = v_current_time
    WHERE id = v_user_id;
    
    -- Restituisci i dati dell'utente
    RETURN v_user_data;
END;
$$;
