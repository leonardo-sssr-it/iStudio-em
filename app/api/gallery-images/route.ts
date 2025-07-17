import { type NextRequest, NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest) {
  try {
    const galleryPath = join(process.cwd(), "public", "images", "gallery")

    // Leggi tutti i file nella cartella gallery
    const files = await readdir(galleryPath)

    // Filtra solo i file immagine
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
    const imageFiles = files.filter((file) => imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)))

    // Crea l'array delle immagini con metadati
    const images = imageFiles.map((filename, index) => {
      // Converti il nome del file in un titolo leggibile
      const title = filename
        .replace(/\.[^/.]+$/, "") // Rimuovi l'estensione
        .replace(/[-_]/g, " ") // Sostituisci trattini e underscore con spazi
        .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalizza ogni parola

      return {
        id: index + 1,
        filename,
        title,
        src: `/images/gallery/${filename}`,
        description: `Immagine dalla galleria: ${title}`,
        uploadedAt: new Date().toISOString(),
        source: "folder",
      }
    })

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    })
  } catch (error) {
    console.error("Errore nel caricamento delle immagini dalla galleria:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Impossibile caricare le immagini dalla galleria",
        images: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
