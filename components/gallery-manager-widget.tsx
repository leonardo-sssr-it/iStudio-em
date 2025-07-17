"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, ImageIcon, Folder, Calendar, Eye } from "lucide-react"
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

interface GalleryStats {
  total: number
  fromFolder: number
  uploadedToday: number
}

export function GalleryManagerWidget() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [stats, setStats] = useState<GalleryStats>({
    total: 0,
    fromFolder: 0,
    uploadedToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const loadGalleryData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gallery-images")
      const data = await response.json()

      if (data.success) {
        setImages(data.images || [])
        setStats(data.stats || { total: 0, fromFolder: 0, uploadedToday: 0 })
      } else {
        setError(data.message || "Errore nel caricamento")
        setImages([])
        setStats({ total: 0, fromFolder: 0, uploadedToday: 0 })
      }
    } catch (err) {
      console.error("Errore nel caricamento della galleria:", err)
      setError("Impossibile caricare la galleria")
      setImages([])
      setStats({ total: 0, fromFolder: 0, uploadedToday: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGalleryData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(selectedImage?.id === image.id ? null : image)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gestione Galleria
            </CardTitle>
            <CardDescription>Gestisci le immagini della galleria principale</CardDescription>
          </div>
          <Button onClick={loadGalleryData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Aggiorna
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totale</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.fromFolder}</div>
            <div className="text-sm text-muted-foreground">Da Cartella</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.uploadedToday}</div>
            <div className="text-sm text-muted-foreground">Oggi</div>
          </div>
        </div>

        <Separator />

        {/* Stato di caricamento */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Caricamento galleria...</span>
          </div>
        )}

        {/* Errore */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">⚠️ {error}</div>
            <Button onClick={loadGalleryData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </div>
        )}

        {/* Lista immagini */}
        {!loading && !error && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {images.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna immagine trovata</p>
                  <p className="text-sm">Aggiungi immagini nella cartella /public/images/gallery</p>
                </div>
              ) : (
                images.map((image) => (
                  <div key={image.id} className="space-y-2">
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedImage?.id === image.id
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      )}
                      onClick={() => handleImageClick(image)}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <img
                          src={image.src || "/placeholder.svg"}
                          alt={image.title}
                          className="w-12 h-12 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=48&width=48"
                          }}
                        />
                      </div>

                      {/* Informazioni */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{image.title}</h4>
                          <Badge variant={image.source === "folder" ? "default" : "secondary"} className="text-xs">
                            {image.source === "folder" ? (
                              <>
                                <Folder className="h-3 w-3 mr-1" />
                                Cartella
                              </>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3 mr-1" />
                                Caricato
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{image.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(image.uploadedAt)}</p>
                      </div>

                      {/* Azioni */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Dettagli espansi */}
                    {selectedImage?.id === image.id && (
                      <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-2 border-blue-200 dark:border-blue-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Preview immagine */}
                          <div>
                            <img
                              src={image.src || "/placeholder.svg"}
                              alt={image.title}
                              className="w-full h-32 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=128&width=200"
                              }}
                            />
                          </div>

                          {/* Dettagli */}
                          <div className="space-y-2">
                            <div>
                              <label className="text-sm font-medium">Titolo:</label>
                              <p className="text-sm text-muted-foreground">{image.title}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Descrizione:</label>
                              <p className="text-sm text-muted-foreground">{image.description}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">File:</label>
                              <p className="text-sm text-muted-foreground">{image.filename}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Percorso:</label>
                              <p className="text-sm text-muted-foreground font-mono">{image.src}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
