"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GalleryImage {
  id: number
  filename: string
  title: string
  src: string
  description: string
  uploadedAt: string
  source: string
}

interface ImageGalleryProps {
  className?: string
  autoplayInterval?: number
  showControls?: boolean
}

export function ImageGallery({ className = "", autoplayInterval = 4000, showControls = true }: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Immagini di fallback se non ci sono immagini nella cartella
  const fallbackImages: GalleryImage[] = [
    {
      id: 1,
      filename: "placeholder-1.svg",
      title: "Benvenuto in iStudio",
      src: "/placeholder.svg?height=400&width=600",
      description: "Gestisci i tuoi progetti con facilità",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
    {
      id: 2,
      filename: "placeholder-2.svg",
      title: "Organizza il tuo lavoro",
      src: "/placeholder.svg?height=400&width=600",
      description: "Strumenti potenti per la produttività",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
    {
      id: 3,
      filename: "placeholder-3.svg",
      title: "Collabora con il team",
      src: "/placeholder.svg?height=400&width=600",
      description: "Lavora insieme in modo efficiente",
      uploadedAt: new Date().toISOString(),
      source: "fallback",
    },
  ]

  // Carica le immagini dalla API
  const loadImages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gallery-images")
      const data = await response.json()

      if (data.success && data.images.length > 0) {
        setImages(data.images)
      } else {
        // Se non ci sono immagini o c'è un errore, usa le immagini di fallback
        console.log("Nessuna immagine trovata nella galleria, uso immagini di fallback")
        setImages(fallbackImages)
      }
    } catch (err) {
      console.error("Errore nel caricamento delle immagini:", err)
      setError("Impossibile caricare le immagini")
      setImages(fallbackImages)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carica le immagini all'avvio
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // Gestione dell'autoplay
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
      setProgress(0)
    }, autoplayInterval)

    return () => clearInterval(interval)
  }, [isPlaying, images.length, autoplayInterval])

  // Gestione della barra di progresso
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 100 / (autoplayInterval / 100)
      })
    }, 100)

    return () => clearInterval(progressInterval)
  }, [isPlaying, autoplayInterval, currentIndex])

  // Reset del progresso quando cambia l'indice
  useEffect(() => {
    setProgress(0)
  }, [currentIndex])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  if (loading) {
    return (
      <div className={cn("relative w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Caricamento galleria...</span>
      </div>
    )
  }

  if (error && images.length === 0) {
    return (
      <div
        className={cn(
          "relative w-full h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center",
          className,
        )}
      >
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <Button onClick={loadImages} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Riprova
        </Button>
      </div>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <div className={cn("relative w-full h-64 md:h-80 lg:h-96 overflow-hidden group", className)}>
      {/* Immagine principale */}
      <div className="relative w-full h-full">
        <img
          src={currentImage?.src || "/placeholder.svg"}
          alt={currentImage?.title || "Immagine galleria"}
          className="w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => {
            // Fallback se l'immagine non si carica
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=400&width=600"
          }}
        />

        {/* Overlay con informazioni */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-lg font-semibold mb-1">{currentImage?.title}</h3>
            <p className="text-sm opacity-90">{currentImage?.description}</p>
          </div>
        </div>

        {/* Barra di progresso */}
        {isPlaying && images.length > 1 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-black/20">
            <div
              className="h-full bg-white/80 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Controlli di navigazione */}
      {showControls && images.length > 1 && (
        <>
          {/* Pulsanti precedente/successivo */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevImage}
              className="ml-2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={nextImage}
              className="mr-2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Controlli play/pause */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="bg-black/20 hover:bg-black/40 text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>

          {/* Indicatori di posizione */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75",
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Informazioni sulla fonte */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/20 text-white text-xs px-2 py-1 rounded">
          {currentImage?.source === "folder" ? "📁 Galleria" : "🔄 Fallback"} • {currentIndex + 1}/{images.length}
        </div>
      </div>
    </div>
  )
}
