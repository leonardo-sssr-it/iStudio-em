// Configurazione per la galleria di immagini
// Questo file può essere utilizzato per configurazioni avanzate della galleria

export interface GalleryConfig {
  // Cartella delle immagini (relativa a /public)
  imagePath: string
  // Estensioni supportate
  supportedExtensions: string[]
  // Immagini di fallback
  fallbackImages: Array<{
    src: string
    alt: string
    title: string
  }>
  // Configurazioni slideshow
  defaultInterval: number
  defaultAutoPlay: boolean
}

export const galleryConfig: GalleryConfig = {
  imagePath: "/images/gallery",
  supportedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  fallbackImages: [
    {
      src: "/placeholder.svg?height=400&width=600&text=Galleria+Vuota",
      alt: "Galleria vuota",
      title: "Nessuna immagine disponibile",
    },
    {
      src: "/placeholder.svg?height=400&width=600&text=Aggiungi+Immagini",
      alt: "Aggiungi immagini",
      title: "Aggiungi immagini alla galleria",
    },
  ],
  defaultInterval: 5000, // 5 secondi
  defaultAutoPlay: true,
}

// Utility per generare nomi di file friendly
export const generateFriendlyName = (filename: string): string => {
  return filename
    .replace(/\.[^/.]+$/, "") // Rimuovi estensione
    .split(/[-_]/) // Dividi su trattini e underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizza
    .join(" ") // Unisci con spazi
}

// Utility per validare se un file è un'immagine
export const isImageFile = (filename: string): boolean => {
  return galleryConfig.supportedExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
}

export default galleryConfig
