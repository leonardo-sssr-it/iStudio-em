# iStudio v0.4

Sistema di gestione dati avanzato costruito con Next.js 14, Supabase e TypeScript.

## 🚀 Caratteristiche Principali

- **Dashboard Dinamica**: Interfaccia moderna e responsive
- **Gestione Dati**: CRUD completo per tutte le tabelle
- **Autenticazione**: Sistema sicuro con Supabase Auth
- **Temi Multipli**: Supporto per temi chiari e scuri
- **Data Explorer**: Esplorazione avanzata dei dati
- **Responsive Design**: Ottimizzato per tutti i dispositivi

## 🛠️ Tecnologie Utilizzate

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS, shadcn/ui
- **Animazioni**: Framer Motion
- **Icone**: Lucide React

## 📦 Installazione

1. Clona il repository:
\`\`\`bash
git clone https://github.com/your-username/istudio-v0.4.git
cd istudio-v0.4
\`\`\`

2. Installa le dipendenze:
\`\`\`bash
npm install
\`\`\`

3. Configura le variabili d'ambiente:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Avvia il server di sviluppo:
\`\`\`bash
npm run dev
\`\`\`

## 🔧 Configurazione

### Variabili d'Ambiente

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### Database Setup

Esegui gli script SQL nella cartella `sql/` per configurare il database:

1. `create-utenti-table.sql`
2. `create-themes-table.sql`
3. `create-rpc-functions.sql`

## 📱 Funzionalità

### Data Explorer
- Visualizzazione dinamica delle tabelle
- Creazione, modifica ed eliminazione record
- Filtri avanzati e ricerca
- Export dati

### Dashboard
- Widget personalizzabili
- Grafici e statistiche
- Agenda e scadenze
- Gestione progetti

### Gestione Utenti
- Autenticazione sicura
- Profili utente
- Controllo accessi
- Sessioni persistenti

## 🎨 Personalizzazione

### Temi
Il sistema supporta temi personalizzabili tramite CSS variables:

\`\`\`css
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  /* ... altre variabili */
}
\`\`\`

### Componenti
Tutti i componenti sono modulari e riutilizzabili, basati su shadcn/ui.

## 📊 Struttura del Progetto

\`\`\`
istudio-v0.4/
├── app/                    # App Router (Next.js 14)
├── components/             # Componenti React riutilizzabili
├── contexts/              # Context providers
├── hooks/                 # Custom hooks
├── lib/                   # Utilities e configurazioni
├── public/                # Asset statici
├── sql/                   # Script database
└── types/                 # Definizioni TypeScript
\`\`\`

## 🚀 Deploy

### Vercel (Raccomandato)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Docker
\`\`\`bash
docker build -t istudio-v0.4 .
docker run -p 3000:3000 istudio-v0.4
\`\`\`

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🆘 Supporto

Per supporto e domande:
- Apri un issue su GitHub
- Contatta il team di sviluppo
- Consulta la documentazione

---

**iStudio v0.4** - Gestione dati semplificata e potente 🚀
\`\`\`

# Fork of iStudio v0.4 - liste e 

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/antonellos-projects-9da0dd8b/v0-fork-of-i-studio-v0-4-liste-e)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/crcKSkQHGzt)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/antonellos-projects-9da0dd8b/v0-fork-of-i-studio-v0-4-liste-e](https://vercel.com/antonellos-projects-9da0dd8b/v0-fork-of-i-studio-v0-4-liste-e)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/crcKSkQHGzt](https://v0.dev/chat/projects/crcKSkQHGzt)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## 2. Miglioramento del Date-Picker con timezone e navigazione
