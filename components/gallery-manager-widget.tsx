"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Upload, Trash2, Edit, Save, X, Plus, ImageIcon, Loader2, Eye, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface GalleryImage {
  id: string
  src: string
  alt: string
  title?: string
  description?: string
  uploadedAt: string
}

// Simulazione del database locale - in produzione useresti Supabase
const INITIAL_GALLERY: GalleryImage[] = [
  {
    id: "1",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/x.jpg-XOiK6xtrpfrACfJ1tpOu7243XAV8Pr.jpeg",
    alt: "Arte digitale creata da mani robotiche",
    title: "Arte Digitale AI",
    description: "Creazione artistica realizzata con intelligenza artificiale",
    uploadedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG3.jpg-in3EFYtEhe5JjvJ0KNkEZ0Yb4HjLJb.jpeg",
    alt: "Professionista in ufficio moderno con grafici analitici",
    title: "Business Analytics",
    description: "Ambiente di lavoro moderno con analisi dati",
    uploadedAt: "2024-01-14T15:45:00Z",
  },
  {
    id: "3",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG1.jpg-H2DuXCHMM87aAIV3vz39CMfQB5O1gq.jpeg",
    alt: "Illustrazione di multitasking e gestione dello stress lavorativo",
    title: "Multitasking",
    description: "Gestione efficace del carico di lavoro",
    uploadedAt: "2024-01-13T09:20:00Z",
  },
  {
    id: "4",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG4.jpg-VgxWj7w218JlNDMAhpLjrqA4ykPs3A.jpeg",
    alt: "Team di lavoro collaborativo in ambiente moderno",
    title: "Team Collaboration",
    description: "Collaborazione efficace in team",
    uploadedAt: "2024-01-12T14:10:00Z",
  },
  {
    id: "5",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG2.rAe.jpg-JO4CqjqquIJZQm7Jchtkv24VyJU4Yh.jpeg",
    alt: "Pianista che si esibisce in un teatro vuoto",
    title: "Performance Artistica",
    description: "Momento di arte e creatività",
    uploadedAt: "2024-01-11T20:30:00Z",
  },
]

export function GalleryManagerWidget() {
  const [images, setImages] = useState<GalleryImage[]>(INITIAL_GALLERY)
  const [isUploading, setIsUploading] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Simulazione upload - in produzione useresti Vercel Blob o Supabase Storage
  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (!files.length) return

      setIsUploading(true)

      try {
        for (const file of Array.from(files)) {
          // Validazione file
          if (!file.type.startsWith("image/")) {
            toast({
              title: "Errore",
              description: `${file.name} non è un'immagine valida`,
              variant: "destructive",
            })
            continue
          }

          if (file.size > 5 * 1024 * 1024) {
            // 5MB limit
            toast({
              title: "Errore",
              description: `${file.name} è troppo grande (max 5MB)`,
              variant: "destructive",
            })
            continue
          }

          // Simulazione upload (in produzione faresti una chiamata API)
          const reader = new FileReader()
          reader.onload = (e) => {
            const newImage: GalleryImage = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              src: e.target?.result as string,
              alt: file.name.replace(/\.[^/.]+$/, ""),
              title: file.name.replace(/\.[^/.]+$/, ""),
              description: `Caricata il ${new Date().toLocaleDateString()}`,
              uploadedAt: new Date().toISOString(),
            }

            setImages((prev) => [newImage, ...prev])
          }
          reader.readAsDataURL(file)
        }

        toast({
          title: "Successo",
          description: `${files.length} immagine/i caricate con successo`,
        })
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore durante il caricamento delle immagini",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileUpload(files)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const deleteImage = useCallback(
    (id: string) => {
      setImages((prev) => prev.filter((img) => img.id !== id))
      toast({
        title: "Successo",
        description: "Immagine eliminata",
      })
    },
    [toast],
  )

  const updateImage = useCallback(
    (updatedImage: GalleryImage) => {
      setImages((prev) => prev.map((img) => (img.id === updatedImage.id ? updatedImage : img)))
      setEditingImage(null)
      toast({
        title: "Successo",
        description: "Immagine aggiornata",
      })
    },
    [toast],
  )

  const downloadImage = useCallback(
    async (image: GalleryImage) => {
      try {
        const response = await fetch(image.src)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${image.title || "image"}.jpg`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile scaricare l'immagine",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totale Immagini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Caricate Oggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {images.filter((img) => new Date(img.uploadedAt).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spazio Utilizzato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{Math.round(images.length * 2.5)}MB</div>
          </CardContent>
        </Card>
      </div>

      {/* Area di upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Nuove Immagini
          </CardTitle>
          <CardDescription>Trascina le immagini qui o clicca per selezionarle (max 5MB per file)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              "hover:border-primary/50 hover:bg-primary/5",
              isUploading && "border-primary bg-primary/10",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Trascina le immagini qui</p>
                  <p className="text-sm text-muted-foreground">oppure</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Seleziona File
                </Button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Griglia delle immagini */}
      <Card>
        <CardHeader>
          <CardTitle>Galleria Immagini</CardTitle>
          <CardDescription>Gestisci le tue immagini: visualizza, modifica o elimina</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden group">
                  <div className="relative aspect-square">
                    <Image
                      src={image.src || "/placeholder.svg"}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => setPreviewImage(image)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{image.title}</DialogTitle>
                              <DialogDescription>{image.description}</DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-video">
                              <Image
                                src={image.src || "/placeholder.svg"}
                                alt={image.alt}
                                fill
                                className="object-contain"
                                sizes="(max-width: 1200px) 100vw, 1200px"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={() => downloadImage(image)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={() => setEditingImage(image)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Elimina Immagine</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler eliminare questa immagine? L'azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteImage(image.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{image.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{image.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog per modifica immagine */}
      {editingImage && (
        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Immagine</DialogTitle>
              <DialogDescription>Aggiorna le informazioni dell'immagine</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={editingImage.src || "/placeholder.svg"}
                  alt={editingImage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 600px) 100vw, 600px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={editingImage.title || ""}
                  onChange={(e) =>
                    setEditingImage({
                      ...editingImage,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alt">Testo alternativo</Label>
                <Input
                  id="alt"
                  value={editingImage.alt}
                  onChange={(e) =>
                    setEditingImage({
                      ...editingImage,
                      alt: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={editingImage.description || ""}
                  onChange={(e) =>
                    setEditingImage({
                      ...editingImage,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingImage(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
                <Button onClick={() => updateImage(editingImage)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salva
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
