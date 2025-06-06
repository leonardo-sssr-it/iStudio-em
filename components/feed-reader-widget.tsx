"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FeedItemModal } from "./feed-item-modal"
import { Rss, AlertTriangle, Loader2 } from "lucide-react"

type FeedItem = {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  creator?: string
  isoDate?: string
}

interface FeedReaderWidgetProps {
  feedUrl: string // URL del feed da leggere (es. da configurazione.feed1)
  numberOfItems?: number // Numero di elementi da visualizzare
  title?: string // Titolo del widget
}

export function FeedReaderWidget({ feedUrl, numberOfItems = 5, title = "Feed Notizie" }: FeedReaderWidgetProps) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!feedUrl) {
      setError("URL del feed non specificato.")
      setIsLoading(false)
      return
    }

    const fetchFeed = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/feed-parser?url=${encodeURIComponent(feedUrl)}&maxItems=${numberOfItems}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Errore HTTP: ${response.status}`)
        }
        const data = await response.json()
        setItems(data.items || [])
      } catch (err) {
        console.error("Errore nel recupero del feed:", err)
        setError(err instanceof Error ? err.message : "Errore sconosciuto nel recupero del feed.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeed()
  }, [feedUrl, numberOfItems])

  const handleItemClick = (item: FeedItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Rss className="h-6 w-6 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>Ultimi aggiornamenti dal feed.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Caricamento feed...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-4 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Errore nel caricamento del feed:</p>
            <p className="text-sm text-center">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                /* Potresti aggiungere un retry qui */
              }}
            >
              Riprova
            </Button>
          </div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">Nessun elemento trovato nel feed.</p>
        )}
        {!isLoading && !error && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={item.link || `feed-item-${index}`} className="border-b pb-3 last:border-b-0 last:pb-0">
                <button
                  onClick={() => handleItemClick(item)}
                  className="text-left w-full hover:bg-muted/50 p-2 rounded-md transition-colors"
                >
                  <h4 className="font-semibold text-primary hover:underline text-sm md:text-base">
                    {item.title || "Senza titolo"}
                  </h4>
                  {item.isoDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.isoDate).toLocaleDateString("it-IT", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {selectedItem && <FeedItemModal item={selectedItem} isOpen={isModalOpen} onClose={handleCloseModal} />}
    </Card>
  )
}
