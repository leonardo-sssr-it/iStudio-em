-- Crea la tabella temi se non esiste
CREATE TABLE IF NOT EXISTS temi (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  primary_color VARCHAR(50) NOT NULL DEFAULT '#000000',
  secondary_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
  accent_color VARCHAR(50) NOT NULL DEFAULT '#0066cc',
  text_color VARCHAR(50) NOT NULL DEFAULT '#000000',
  background_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
  is_dark BOOLEAN DEFAULT false,
  font_family VARCHAR(255) DEFAULT 'system-ui, -apple-system, sans-serif',
  border_radius VARCHAR(20) DEFAULT '0.5rem',
  css_variables JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
