// Gallery images index - questo file viene utilizzato come fallback
// Le immagini vengono caricate dinamicamente dalla cartella /public/images/gallery

export interface GalleryImageData {
  src: string
  alt: string
  title: string
  description: string
}

// Immagini di fallback nel caso la cartella sia vuota
export const fallbackImages: GalleryImageData[] = [
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Benvenuto in iStudio",
    title: "iStudio",
    description: "Il sistema di gestione integrato per il tuo ufficio",
  },
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Gestione Dati",
    title: "Gestione Dati",
    description: "Organizza e gestisci tutti i tuoi dati in un unico posto",
  },
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Collaborazione",
    title: "Collaborazione",
    description: "Lavora in team con accessi e permessi personalizzati",
  },
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Analisi Dati",
    title: "Analisi Dati",
    description: "Visualizza e analizza i tuoi dati con grafici interattivi",
  },
  {
    src: "/placeholder.svg?height=600&width=800",
    alt: "Automazione",
    title: "Automazione",
    description: "Automatizza i processi ripetitivi e risparmia tempo",
  },
]

// Funzione per ottenere le immagini (utilizzata come fallback)
export const getGalleryImages = (): GalleryImageData[] => {
  return fallbackImages
}

export default fallbackImages
