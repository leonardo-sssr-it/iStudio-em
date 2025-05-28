"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Copy } from "lucide-react"

interface SqlInstructionsProps {
  onClose?: () => void
}

export function SqlInstructions({ onClose }: SqlInstructionsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copiato!",
          description: "SQL copiato negli appunti",
        })
      },
      (err) => {
        console.error("Impossibile copiare il testo: ", err)
        toast({
          title: "Errore",
          description: "Impossibile copiare il testo",
          variant: "destructive",
        })
      },
    )
  }

  const getTablesFunction = `CREATE OR REPLACE FUNCTION get_tables()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;`

  const getColumnsFunction = `CREATE OR REPLACE FUNCTION get_columns(table_name text)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;`

  const getTableDataFunction = `CREATE OR REPLACE FUNCTION get_table_data(
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
$$ LANGUAGE plpgsql SECURITY DEFINER;`

  const getUsersFunction = `CREATE OR REPLACE FUNCTION get_users()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;`

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Istruzioni SQL per Supabase</CardTitle>
        <CardDescription>
          Esegui queste funzioni SQL nel tuo database Supabase per abilitare tutte le funzionalità dell'applicazione
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="get_tables">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="get_tables">get_tables</TabsTrigger>
            <TabsTrigger value="get_columns">get_columns</TabsTrigger>
            <TabsTrigger value="get_table_data">get_table_data</TabsTrigger>
            <TabsTrigger value="get_users">get_users</TabsTrigger>
          </TabsList>
          <TabsContent value="get_tables" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Funzione get_tables</CardTitle>
                <CardDescription>Ottiene l'elenco delle tabelle nel database</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  <code>{getTablesFunction}</code>
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getTablesFunction)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia SQL
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="get_columns" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Funzione get_columns</CardTitle>
                <CardDescription>Ottiene le colonne di una tabella</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  <code>{getColumnsFunction}</code>
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getColumnsFunction)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia SQL
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="get_table_data" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Funzione get_table_data</CardTitle>
                <CardDescription>Ottiene i dati di una tabella con paginazione e ordinamento</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  <code>{getTableDataFunction}</code>
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getTableDataFunction)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia SQL
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="get_users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Funzione get_users</CardTitle>
                <CardDescription>Ottiene l'elenco degli utenti</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  <code>{getUsersFunction}</code>
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getUsersFunction)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia SQL
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      {onClose && (
        <CardFooter className="flex justify-end">
          <Button onClick={onClose}>Chiudi</Button>
        </CardFooter>
      )}
    </Card>
  )
}
