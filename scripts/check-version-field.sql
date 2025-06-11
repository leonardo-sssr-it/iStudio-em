-- Verifica se esiste la tabella configurazione
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'configurazione'
) AS table_exists;

-- Verifica se esiste il campo versione nella tabella configurazione
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'configurazione' 
   AND column_name = 'versione'
) AS version_field_exists;

-- Seleziona i dati dalla tabella configurazione
SELECT * FROM configurazione LIMIT 1;
