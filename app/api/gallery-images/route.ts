import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    const galleryPath = join(process.cwd(), "public", "images", "gallery")
    const files = await readdir(galleryPath)

    // Filtra solo i file immagine
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))

    // Crea l'array delle immagini con metadati
    const images = imageFiles.map((file, index) => {
      const nameWithoutExt = file.replace(/\.[^/.]+$/, "")
      const formattedName = nameWithoutExt
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return {
        id: `gallery-${index + 1}`,
        src: `/images/gallery/${file}`,
        alt: `Immagine ${formattedName}`,
        title: formattedName,
        description: `Immagine della galleria: ${formattedName}`,
        uploadedAt: new Date().toISOString(),
        filename: file,
      }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Errore nel caricamento delle immagini:", error)
    return NextResponse.json({ images: [] })
  }
}
