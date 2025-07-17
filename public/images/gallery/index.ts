// File di configurazione per la galleria immagini
// Questo file viene utilizzato come fallback se l'API non riesce a leggere la cartella

export interface GalleryImageConfig {
  filename: string
  title: string
  description: string
  alt: string
}

export const galleryImages: GalleryImageConfig[] = [
  {
    filename: "business-analytics.jpg",
    title: "Business Analytics",
    description: "Professionista in ufficio moderno con grafici analitici",
    alt: "Professionista che analizza grafici e dati su computer",
  },
  {
    filename: "creative-ai.jpg",
    title: "Arte Digitale",
    description: "Arte digitale creata da mani robotiche",
    alt: "Mani robotiche che creano arte digitale",
  },
  {
    filename: "multitasking.jpg",
    title: "Multitasking",
    description: "Illustrazione di multitasking e gestione dello stress lavorativo",
    alt: "Persona che gestisce multiple attività contemporaneamente",
  },
  {
    filename: "pianist.jpg",
    title: "Performance Musicale",
    description: "Pianista che si esibisce in un teatro vuoto",
    alt: "Pianista che suona in un teatro elegante",
  },
  {
    filename: "team-collaboration.jpg",
    title: "Collaborazione Team",
    description: "Team di lavoro collaborativo in ambiente moderno",
    alt: "Team che collabora in un ufficio moderno",
  },
]

// Funzione helper per ottenere il percorso completo dell'immagine
export function getImagePath(filename: string): string {
  return `/images/gallery/${filename}`
}

// Funzione helper per ottenere tutte le immagini con percorsi completi
export function getAllImages() {
  return galleryImages.map((img, index) => ({
    id: index + 1,
    ...img,
    src: getImagePath(img.filename),
    uploadedAt: new Date().toISOString(),
    source: "config",
  }))
}
