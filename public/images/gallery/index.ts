// File di configurazione per la galleria immagini
// Questo file viene generato automaticamente dall'API /api/gallery-images

export interface GalleryImageConfig {
  id: number
  filename: string
  title: string
  src: string
  description: string
  uploadedAt: string
  source: string
}

// Funzione per ottenere le immagini dalla cartella
export async function getGalleryImages(): Promise<GalleryImageConfig[]> {
  try {
    const response = await fetch("/api/gallery-images")
    const data = await response.json()

    if (data.success) {
      return data.images
    }

    // Fallback se l'API non funziona
    return getFallbackImages()
  } catch (error) {
    console.error("Errore nel caricamento delle immagini:", error)
    return getFallbackImages()
  }
}

// Immagini di fallback
function getFallbackImages(): GalleryImageConfig[] {
  return [
    {
      id: 1,
      filename: "business-analytics.jpg",
      title: "Business Analytics",
      src: "/images/gallery/business-analytics.jpg",
      description: "Analisi e reportistica aziendale",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
    {
      id: 2,
      filename: "creative-ai.jpg",
      title: "Creative AI",
      src: "/images/gallery/creative-ai.jpg",
      description: "Intelligenza artificiale creativa",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
    {
      id: 3,
      filename: "multitasking.jpg",
      title: "Multitasking",
      src: "/images/gallery/multitasking.jpg",
      description: "Gestione efficiente delle attività",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
    {
      id: 4,
      filename: "pianist.jpg",
      title: "Pianist",
      src: "/images/gallery/pianist.jpg",
      description: "Creatività e concentrazione",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
    {
      id: 5,
      filename: "team-collaboration.jpg",
      title: "Team Collaboration",
      src: "/images/gallery/team-collaboration.jpg",
      description: "Collaborazione di squadra",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
  ]
}

// Esporta le immagini di fallback per uso diretto
export const fallbackImages = getFallbackImages()
