-- Crea la tabella configurazione se non esiste
CREATE TABLE IF NOT EXISTS public.configurazione (
    id SERIAL PRIMARY KEY,
    versione VARCHAR(20) DEFAULT '1.0.0',
    tema_default VARCHAR(20) DEFAULT 'light',
    lingua_default VARCHAR(10) DEFAULT 'it',
    fuso_orario VARCHAR(50) DEFAULT 'Europe/Rome',
    priorita JSONB DEFAULT '[
        {"value": "alta", "label": "Alta", "color": "red"},
        {"value": "media", "label": "Media", "color": "yellow"},
        {"value": "bassa", "label": "Bassa", "color": "green"}
    ]'::jsonb,
    stati JSONB DEFAULT '[
        {"value": "nuovo", "label": "Nuovo", "color": "blue"},
        {"value": "in_corso", "label": "In Corso", "color": "yellow"},
        {"value": "completato", "label": "Completato", "color": "green"}
    ]'::jsonb,
    categorie JSONB DEFAULT '[
        {"value": "lavoro", "label": "Lavoro"},
        {"value": "personale", "label": "Personale"}
    ]'::jsonb,
    tags_predefiniti JSONB DEFAULT '["importante", "urgente", "meeting", "progetto"]'::jsonb,
    impostazioni_notifiche JSONB DEFAULT '{
        "email_enabled": true,
        "push_enabled": false,
        "default_reminder_minutes": 15
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisce una configurazione di default se la tabella è vuota
INSERT INTO public.configurazione (versione, tema_default, lingua_default, fuso_orario)
SELECT '1.0.0', 'light', 'it', 'Europe/Rome'
WHERE NOT EXISTS (SELECT 1 FROM public.configurazione);

-- Crea un trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_configurazione_updated_at ON public.configurazione;
CREATE TRIGGER update_configurazione_updated_at
    BEFORE UPDATE ON public.configurazione
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
