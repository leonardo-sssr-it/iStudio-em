import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const galleryPath = path.join(process.cwd(), "public", "images", "gallery")

    // Verifica se la cartella esiste
    if (!fs.existsSync(galleryPath)) {
      return NextResponse.json({
        success: false,
        message: "Cartella gallery non trovata",
        images: [],
        stats: {
          total: 0,
          fromFolder: 0,
          uploadedToday: 0,
        },
      })
    }

    // Legge tutti i file dalla cartella
    const files = fs.readdirSync(galleryPath)

    // Filtra solo i file immagine
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
    const imageFiles = files.filter((file) => imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)))

    // Crea l'array delle immagini con metadati
    const images = imageFiles.map((filename, index) => {
      const filePath = path.join(galleryPath, filename)
      const stats = fs.statSync(filePath)

      // Genera un titolo dal nome del file
      const title = filename
        .replace(/\.[^/.]+$/, "") // Rimuove l'estensione
        .replace(/[-_]/g, " ") // Sostituisce trattini e underscore con spazi
        .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalizza ogni parola

      return {
        id: index + 1,
        filename,
        title,
        src: `/images/gallery/${filename}`,
        description: `Immagine della galleria: ${title}`,
        uploadedAt: stats.mtime.toISOString(),
        source: "folder",
      }
    })

    // Calcola le statistiche
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const uploadedToday = images.filter((img) => {
      const uploadDate = new Date(img.uploadedAt)
      uploadDate.setHours(0, 0, 0, 0)
      return uploadDate.getTime() === today.getTime()
    }).length

    const stats = {
      total: images.length,
      fromFolder: images.length,
      uploadedToday,
    }

    return NextResponse.json({
      success: true,
      message: `Trovate ${images.length} immagini nella galleria`,
      images,
      stats,
    })
  } catch (error) {
    console.error("Errore nell'API gallery-images:", error)

    return NextResponse.json({
      success: false,
      message: "Errore nel caricamento delle immagini",
      images: [],
      stats: {
        total: 0,
        fromFolder: 0,
        uploadedToday: 0,
      },
    })
  }
}
