import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    // Percorso della cartella delle immagini
    const galleryPath = path.join(process.cwd(), "public", "images", "gallery")

    // Verifica se la cartella esiste
    try {
      await fs.access(galleryPath)
    } catch {
      // Se la cartella non esiste, restituisci un array vuoto
      return NextResponse.json({
        success: true,
        images: [],
        message: "Cartella gallery non trovata",
      })
    }

    // Leggi i file nella cartella
    const files = await fs.readdir(galleryPath)

    // Filtra solo i file immagine
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
    const imageFiles = files.filter((file) => imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)))

    // Crea l'array di immagini con i metadati
    const images = imageFiles.map((file) => {
      const name = path.parse(file).name
      const title = name
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return {
        src: `/images/gallery/${file}`,
        alt: title,
        title: title,
      }
    })

    // Ordina le immagini per nome
    images.sort((a, b) => a.title.localeCompare(b.title))

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
      message: `Trovate ${images.length} immagini`,
    })
  } catch (error) {
    console.error("Errore nel caricamento delle immagini:", error)

    return NextResponse.json(
      {
        success: false,
        images: [],
        error: "Errore interno del server",
        message: error instanceof Error ? error.message : "Errore sconosciuto",
      },
      { status: 500 },
    )
  }
}

// Supporta anche il metodo POST per eventuali future funzionalità
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message: "Metodo POST non ancora implementato",
    },
    { status: 501 },
  )
}
