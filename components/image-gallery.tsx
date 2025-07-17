"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GalleryImage {
  id: string
  src: string
  alt: string
  title?: string
  description?: string
}

interface ImageGalleryProps {
  className?: string
  autoPlay?: boolean
  interval?: number
}

export function ImageGallery({ className, autoPlay = true, interval = 4000 }: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  // Carica le immagini dalla API
  const loadImages = useCallback(async () => {
    try {
      const response = await fetch("/api/gallery-images")
      const data = await response.json()

      if (data.images && data.images.length > 0) {
        setImages(data.images)
      } else {
        // Fallback con immagini placeholder se non ci sono immagini nella cartella
        setImages([
          {
            id: "placeholder-1",
            src: "/placeholder.svg?height=600&width=800",
            alt: "Immagine placeholder 1",
            title: "Benvenuto in iStudio",
            description: "Il tuo sistema di gestione integrato",
          },
          {
            id: "placeholder-2",
            src: "/placeholder.svg?height=600&width=800",
            alt: "Immagine placeholder 2",
            title: "Gestione Dati",
            description: "Organizza e gestisci i tuoi dati",
          },
          {
            id: "placeholder-3",
            src: "/placeholder.svg?height=600&width=800",
            alt: "Immagine placeholder 3",
            title: "Collaborazione",
            description: "Lavora in team efficacemente",
          },
        ])
      }
    } catch (error) {
      console.error("Errore nel caricamento delle immagini:", error)
      // Fallback in caso di errore
      setImages([
        {
          id: "fallback",
          src: "/placeholder.svg?height=600&width=800",
          alt: "Immagine di fallback",
          title: "iStudio",
          description: "Sistema di gestione integrato",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carica le immagini al mount
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // Gestione autoplay
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, images.length, interval])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleImageError = useCallback((imageId: string) => {
    setImageError((prev) => ({ ...prev, [imageId]: true }))
  }, [])

  if (isLoading) {
    return (
      <div className={cn("relative w-full h-full bg-muted rounded-lg overflow-hidden", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Caricamento galleria...</div>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "relative w-full h-full bg-muted rounded-lg overflow-hidden flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Nessuna immagine disponibile</p>
          <p className="text-sm">Aggiungi immagini nella cartella /public/images/gallery</p>
        </div>
      </div>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <div className={cn("relative w-full h-full group", className)}>
      {/* Immagine principale */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <Image
          src={imageError[currentImage.id] ? "/placeholder.svg?height=600&width=800" : currentImage.src}
          alt={currentImage.alt}
          fill
          className="object-cover transition-all duration-500 ease-in-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={currentIndex === 0}
          onError={() => handleImageError(currentImage.id)}
        />

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Informazioni immagine */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-lg font-semibold mb-1 drop-shadow-lg">
            {currentImage.title || `Immagine ${currentIndex + 1}`}
          </h3>
          {currentImage.description && (
            <p className="text-sm opacity-90 drop-shadow-lg line-clamp-2">{currentImage.description}</p>
          )}
        </div>
      </div>

      {/* Controlli di navigazione - visibili solo se ci sono più immagini */}
      {images.length > 1 && (
        <>
          {/* Pulsanti precedente/successivo */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
            onClick={goToPrevious}
            aria-label="Immagine precedente"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
            onClick={goToNext}
            aria-label="Immagine successiva"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </Button>

          {/* Controllo play/pause */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pausa slideshow" : "Avvia slideshow"}
          >
            {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
          </Button>

          {/* Indicatori di posizione */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75",
                )}
                onClick={() => goToSlide(index)}
                aria-label={`Vai all'immagine ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Indicatore di caricamento per la prossima immagine */}
      {images.length > 1 && isPlaying && (
        <div className="absolute top-0 left-0 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % interval) / interval) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
