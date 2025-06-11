-- Script per creare la tabella configurazione e il campo versione se non esistono

-- Crea la tabella configurazione se non esiste
CREATE TABLE IF NOT EXISTS public.configurazione (
    id SERIAL PRIMARY KEY,
    versione TEXT DEFAULT '1.0.0',
    nome_app TEXT DEFAULT 'iStudio',
    descrizione TEXT DEFAULT 'Sistema di gestione integrato',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggiungi il campo versione se non esiste (gestisce il caso in cui la tabella esista già)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'configurazione' 
        AND column_name = 'versione'
    ) THEN
        ALTER TABLE public.configurazione ADD COLUMN versione TEXT DEFAULT '1.0.0';
    END IF;
END $$;

-- Inserisci una riga di configurazione di default se la tabella è vuota
INSERT INTO public.configurazione (versione, nome_app, descrizione)
SELECT '1.0.0', 'iStudio', 'Sistema di gestione integrato'
WHERE NOT EXISTS (SELECT 1 FROM public.configurazione);

-- Aggiorna la versione se esiste già una riga ma il campo versione è vuoto
UPDATE public.configurazione 
SET versione = '1.0.0' 
WHERE versione IS NULL OR versione = '';

-- Concedi i permessi necessari
GRANT SELECT ON public.configurazione TO authenticated;
GRANT SELECT ON public.configurazione TO anon;

-- Mostra il risultato
SELECT 'Configurazione completata' as status, versione, nome_app 
FROM public.configurazione 
LIMIT 1;
