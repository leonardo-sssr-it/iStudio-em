import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    const galleryPath = join(process.cwd(), "public", "images", "gallery")

    let files: string[] = []
    try {
      files = await readdir(galleryPath)
    } catch (error) {
      console.warn("Cartella gallery non trovata o non accessibile:", error)
      return NextResponse.json({
        images: [],
        message: "Cartella gallery non trovata. Assicurati che esista /public/images/gallery",
      })
    }

    // Filtra solo i file immagine
    const imageFiles = files.filter(
      (file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file) && !file.startsWith(".") && file !== "index.ts",
    )

    if (imageFiles.length === 0) {
      return NextResponse.json({
        images: [],
        message: "Nessuna immagine trovata nella cartella gallery",
      })
    }

    // Crea l'array delle immagini con metadati
    const images = imageFiles.map((file, index) => {
      const nameWithoutExt = file.replace(/\.[^/.]+$/, "")
      const formattedName = nameWithoutExt
        .split(/[-_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return {
        id: `gallery-${index + 1}`,
        src: `/images/gallery/${file}`,
        alt: `${formattedName}`,
        title: formattedName,
        description: `Immagine della galleria: ${formattedName}`,
        uploadedAt: new Date().toISOString(),
        filename: file,
      }
    })

    return NextResponse.json({
      images,
      count: images.length,
      message: `${images.length} immagini caricate con successo`,
    })
  } catch (error) {
    console.error("Errore nel caricamento delle immagini:", error)
    return NextResponse.json(
      {
        images: [],
        error: "Errore interno del server",
        message: "Impossibile caricare le immagini",
      },
      { status: 500 },
    )
  }
}
