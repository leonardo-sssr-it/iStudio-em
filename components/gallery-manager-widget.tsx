"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, ImageIcon, Eye, AlertCircle, CheckCircle, Folder, FileImage } from "lucide-react"
import { ImageGallery } from "@/components/image-gallery"
import { Skeleton } from "@/components/ui/skeleton"

interface GalleryImage {
  src: string
  alt: string
  title?: string
}

interface GalleryStats {
  totalImages: number
  lastUpdated: string
  folderPath: string
}

export function GalleryManagerWidget() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [stats, setStats] = useState<GalleryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Carica le immagini e le statistiche
  const loadGalleryData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/gallery-images")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setImages(data.images || [])
        setStats({
          totalImages: data.count || 0,
          lastUpdated: new Date().toLocaleString("it-IT"),
          folderPath: "/public/images/gallery",
        })
      } else {
        throw new Error(data.message || "Errore nel caricamento")
      }

      setLastRefresh(new Date())
    } catch (err) {
      console.error("Errore nel caricamento della galleria:", err)
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setIsLoading(false)
    }
  }

  // Carica i dati al mount del componente
  useEffect(() => {
    loadGalleryData()
  }, [])

  // Funzione per aggiornare manualmente
  const handleRefresh = () => {
    loadGalleryData()
  }

  // Funzione per mostrare/nascondere l'anteprima
  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gestione Galleria
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="flex items-center gap-1 bg-transparent"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Nascondi" : "Anteprima"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistiche */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <FileImage className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">{stats.totalImages}</div>
                <div className="text-xs text-blue-700">Immagini totali</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Folder className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">Gallery</div>
                <div className="text-xs text-green-700">Cartella attiva</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <RefreshCw className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900 text-xs">{lastRefresh.toLocaleTimeString("it-IT")}</div>
                <div className="text-xs text-gray-700">Ultimo aggiornamento</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stato della galleria */}
        {!isLoading && (
          <div className="flex items-center gap-2">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Errore: {error}</AlertDescription>
              </Alert>
            ) : images.length > 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Galleria caricata correttamente con {images.length} immagini</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Nessuna immagine trovata nella cartella /public/images/gallery</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Lista delle immagini */}
        {!isLoading && images.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              Immagini disponibili
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {images.map((image, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=32&width=32&text=?"
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{image.title}</div>
                    <div className="text-xs text-gray-500 truncate">{image.src.split("/").pop()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anteprima della galleria */}
        {showPreview && !isLoading && images.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Anteprima Slideshow
            </h4>
            <ImageGallery autoPlay={true} interval={3000} showControls={true} className="max-w-md mx-auto" />
          </div>
        )}

        {/* Istruzioni per aggiungere immagini */}
        {!isLoading && images.length === 0 && !error && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-700 mb-2">Nessuna immagine trovata</h4>
            <p className="text-sm text-gray-600 mb-4">
              Per aggiungere immagini alla galleria, inseriscile nella cartella:
            </p>
            <Badge variant="outline" className="font-mono text-xs">
              /public/images/gallery/
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Formati supportati: JPG, PNG, GIF, WebP, SVG</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
