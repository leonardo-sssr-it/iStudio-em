-- Funzione corretta per ottenere le colonne di una tabella
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
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = $1
      AND kcu.column_name = c.column_name
    ) as is_primary
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = $1
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
