"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GalleryImage {
  src: string
  alt: string
  title?: string
}

interface ImageGalleryProps {
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  className?: string
}

export function ImageGallery({
  autoPlay = true,
  interval = 5000,
  showControls = true,
  className = "",
}: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica le immagini dall'API
  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/gallery-images")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.images && data.images.length > 0) {
          setImages(data.images)
          setError(null)
        } else {
          // Fallback a immagini placeholder se non ci sono immagini
          setImages([
            {
              src: "/placeholder.svg?height=400&width=600&text=Galleria+Vuota",
              alt: "Galleria vuota",
              title: "Nessuna immagine disponibile",
            },
          ])
        }
      } catch (err) {
        console.error("Errore nel caricamento delle immagini:", err)
        setError("Errore nel caricamento delle immagini")
        // Fallback in caso di errore
        setImages([
          {
            src: "/placeholder.svg?height=400&width=600&text=Errore+Caricamento",
            alt: "Errore caricamento",
            title: "Errore nel caricamento delle immagini",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [])

  // Gestione autoplay
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, images.length, interval])

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className="relative w-full h-[400px] bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className="relative w-full h-[400px] bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Riprova
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
          {/* Immagine principale */}
          <img
            src={currentImage.src || "/placeholder.svg"}
            alt={currentImage.alt}
            className="w-full h-full object-cover transition-opacity duration-500"
            onError={(e) => {
              // Fallback se l'immagine non si carica
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=400&width=600&text=Immagine+Non+Disponibile"
            }}
          />

          {/* Overlay con titolo se presente */}
          {currentImage.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h3 className="text-lg font-semibold">{currentImage.title}</h3>
            </div>
          )}

          {/* Controlli di navigazione */}
          {showControls && images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Controllo play/pause */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </>
          )}

          {/* Indicatori di posizione */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white bg-opacity-50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}

          {/* Badge con numero immagine */}
          {images.length > 1 && (
            <Badge className="absolute top-2 left-2 bg-black bg-opacity-50 text-white">
              {currentIndex + 1} / {images.length}
            </Badge>
          )}

          {/* Barra di progresso per autoplay */}
          {isPlaying && images.length > 1 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-30">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: `${((Date.now() % interval) / interval) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
