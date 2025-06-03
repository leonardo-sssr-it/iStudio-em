-- Funzione per ottenere le colonne di una tabella specifica, con commenti e flag chiave primaria
-- Versione corretta per gestire potenziali subquery che restituiscono più righe per column_comment
CREATE OR REPLACE FUNCTION get_columns(table_name_param TEXT)
RETURNS TABLE(
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    is_identity TEXT,
    is_primary BOOLEAN,
    column_comment TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.is_identity::TEXT,
        (EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
            AND tc.table_schema = c.table_schema
        )) AS is_primary,
        (SELECT pg_catalog.col_description(pc.oid, pa.attnum)
         FROM pg_catalog.pg_class pc
         JOIN pg_catalog.pg_namespace pn ON pn.oid = pc.relnamespace
         JOIN pg_catalog.pg_attribute pa ON pa.attrelid = pc.oid AND pa.attnum > 0 AND NOT pa.attisdropped
         WHERE pn.nspname = c.table_schema 
           AND pc.relname = c.table_name 
           AND pa.attname = c.column_name
         LIMIT 1 -- Aggiunto LIMIT 1 per garantire una sola riga
        ) AS column_comment
    FROM
        information_schema.columns c
    WHERE
        c.table_name = table_name_param
        AND c.table_schema = 'public' -- Assicurati che lo schema sia corretto, es. 'public'
    ORDER BY
        c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere tutte le tabelle utente (nomi)
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.table_name::TEXT
    FROM
        information_schema.tables c
    WHERE
        c.table_schema = 'public' -- Assicurati che lo schema sia corretto
        AND c.table_type = 'BASE TABLE'
        AND c.table_name NOT LIKE 'pg_%' -- Escludi tabelle di sistema PostgreSQL
        AND c.table_name NOT LIKE 'sql_%' -- Escludi tabelle di sistema SQL
        AND c.table_name NOT IN ('supabase_migrations', 'versions') -- Escludi tabelle specifiche di Supabase/migrazioni
    ORDER BY
        c.table_name;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere dati tabellari con paginazione e ordinamento
CREATE OR REPLACE FUNCTION get_table_data(
    table_name_param TEXT,
    page_number INT DEFAULT 0,
    page_size INT DEFAULT 10,
    sort_column TEXT DEFAULT NULL,
    sort_direction TEXT DEFAULT 'asc'
)
RETURNS TABLE(data JSONB, total_count BIGINT) AS $$
DECLARE
    query TEXT;
    offset_val INT;
    _total_count BIGINT;
BEGIN
    offset_val := page_number * page_size;

    -- Conteggio totale delle righe
    EXECUTE format('SELECT count(*) FROM %I', table_name_param) INTO _total_count;

    -- Costruzione della query principale
    query := format('SELECT jsonb_agg(t) FROM (SELECT * FROM %I', table_name_param);

    IF sort_column IS NOT NULL THEN
        query := query || format(' ORDER BY %I %s', sort_column, CASE WHEN lower(sort_direction) = 'desc' THEN 'DESC' ELSE 'ASC' END);
    END IF;

    query := query || format(' LIMIT %s OFFSET %s) t', page_size, offset_val);
    
    -- Esecuzione della query per i dati
    RETURN QUERY EXECUTE query
    SELECT data, _total_count;

    -- Se la query non restituisce dati (es. tabella vuota ma _total_count è 0),
    -- restituisce un array JSON vuoto e il conteggio.
    IF NOT FOUND THEN
        RETURN QUERY SELECT '[]'::JSONB, _total_count;
    END IF;
END;
$$ LANGUAGE plpgsql;
