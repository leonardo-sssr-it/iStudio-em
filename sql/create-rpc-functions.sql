-- Funzione per ottenere le tabelle
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere le colonne di una tabella
CREATE OR REPLACE FUNCTION get_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  is_identity text,
  is_primary boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    CASE WHEN c.column_default LIKE 'nextval%' THEN 'YES' ELSE 'NO' END::text as is_identity,
    (
      SELECT true
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = $1
      AND kcu.column_name = c.column_name
    ) IS NOT NULL as is_primary
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = $1
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere i dati di una tabella con paginazione e ordinamento
CREATE OR REPLACE FUNCTION get_table_data(
  table_name text,
  page_number int DEFAULT 0,
  page_size int DEFAULT 10,
  sort_column text DEFAULT NULL,
  sort_direction text DEFAULT 'asc'
)
RETURNS json AS $$
DECLARE
  query_text text;
  count_query_text text;
  result json;
  total_count int;
  sort_clause text := '';
  limit_clause text := format(' LIMIT %s OFFSET %s', page_size, page_number * page_size);
BEGIN
  -- Costruisci la clausola di ordinamento se specificata
  IF sort_column IS NOT NULL THEN
    sort_clause := format(' ORDER BY %I %s', sort_column, 
                         CASE WHEN sort_direction = 'desc' THEN 'DESC' ELSE 'ASC' END);
  END IF;
  
  -- Query per contare il numero totale di righe
  count_query_text := format('SELECT COUNT(*) FROM %I.%I', 'public', table_name);
  EXECUTE count_query_text INTO total_count;
  
  -- Query per ottenere i dati con paginazione e ordinamento
  query_text := format('SELECT * FROM %I.%I%s%s', 'public', table_name, sort_clause, limit_clause);
  
  -- Esegui la query e restituisci i risultati come JSON
  EXECUTE format('SELECT json_build_object(
    ''data'', COALESCE(json_agg(t), ''[]''::json),
    ''total_count'', %s
  ) FROM (%s) t', total_count, query_text) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
