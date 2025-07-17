"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Images, RefreshCw, Eye, Edit, Trash2, Upload, FolderOpen, Calendar, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
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

export default function GalleryManagerWidget() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    fromFolder: 0,
    uploadedToday: 0,
  })

  // Carica le immagini dalla API
  const loadImages = useCallback(async (showToast = false) => {
    if (showToast) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await fetch("/api/gallery-images")
      const data = await response.json()

      if (data.success) {
        setImages(data.images)

        // Calcola le statistiche
        const today = new Date().toDateString()
        const uploadedToday = data.images.filter(
          (img: GalleryImage) => new Date(img.uploadedAt).toDateString() === today,
        ).length

        const fromFolder = data.images.filter((img: GalleryImage) => img.source === "folder").length

        setStats({
          total: data.images.length,
          fromFolder,
          uploadedToday,
        })

        if (showToast) {
          toast({
            title: "Galleria aggiornata!",
            description: `Caricate ${data.images.length} immagini dalla cartella`,
          })
        }
      } else {
        throw new Error(data.error || "Errore nel caricamento")
      }
    } catch (error) {
      console.error("Errore nel caricamento delle immagini:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare le immagini dalla galleria",
        variant: "destructive",
      })
      setImages([])
      setStats({ total: 0, fromFolder: 0, uploadedToday: 0 })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Carica le immagini all'avvio
  useEffect(() => {
    loadImages()
  }, [loadImages])

  // Gestisce la visualizzazione di un'immagine
  const handleViewImage = (image: GalleryImage) => {
    setSelectedImage(image)
  }

  // Gestisce la modifica di un'immagine
  const handleEditImage = (image: GalleryImage) => {
    toast({
      title: "Funzionalità in sviluppo",
      description: "La modifica delle immagini sarà disponibile presto",
    })
  }

  // Gestisce l'eliminazione di un'immagine
  const handleDeleteImage = (image: GalleryImage) => {
    toast({
      title: "Funzionalità in sviluppo",
      description: "L'eliminazione delle immagini sarà disponibile presto",
    })
  }

  // Gestisce l'upload di nuove immagini
  const handleUploadImage = () => {
    toast({
      title: "Funzionalità in sviluppo",
      description: "L'upload delle immagini sarà disponibile presto",
    })
  }

  // Formatta la data per la visualizzazione
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="w-5 h-5" />
            Gestione Galleria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Images className="w-5 h-5" />
            Gestione Galleria
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleUploadImage} size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button onClick={() => loadImages(true)} size="sm" variant="outline" disabled={refreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Aggiorna
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Totale Immagini</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.fromFolder}</div>
            <div className="text-sm text-green-600">Dalla Cartella</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.uploadedToday}</div>
            <div className="text-sm text-purple-600">Caricate Oggi</div>
          </div>
        </div>

        {/* Lista immagini */}
        {images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna immagine trovata nella galleria</p>
            <p className="text-sm mt-2">Aggiungi immagini nella cartella /public/images/gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-video">
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={image.source === "folder" ? "default" : "secondary"}>
                      {image.source === "folder" ? "📁" : "🔄"}
                    </Badge>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="font-medium text-sm mb-1 truncate">{image.title}</h4>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{image.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(image.uploadedAt)}
                    </span>
                    <span>{image.filename}</span>
                  </div>

                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleViewImage(image)} className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Vedi
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditImage(image)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteImage(image)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal per visualizzare l'immagine selezionata */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedImage(null)}>
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <img
                  src={selectedImage.src || "/placeholder.svg"}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                />
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">{selectedImage.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>File: {selectedImage.filename}</span>
                    <span>Caricato: {formatDate(selectedImage.uploadedAt)}</span>
                    <Badge variant={selectedImage.source === "folder" ? "default" : "secondary"}>
                      {selectedImage.source === "folder" ? "Dalla cartella" : "Fallback"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messaggio informativo */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Come aggiungere nuove immagini:</p>
            <p>
              1. Inserisci i file immagine nella cartella{" "}
              <code className="bg-blue-100 px-1 rounded">/public/images/gallery</code>
            </p>
            <p>2. Clicca su "Aggiorna Galleria" per vedere le nuove immagini</p>
            <p>3. Le immagini supportate sono: JPG, PNG, GIF, WebP, SVG</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
