"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FeedItemModal } from "./feed-item-modal" // Assumendo che sia nella stessa directory o @/components/
import { Rss, AlertTriangle, Loader2 } from "lucide-react"
import { useAppConfig } from "../hooks/use-app-config" // MODIFICATO: Percorso relativo

type FeedItem = {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  creator?: string
  isoDate?: string
}

interface FeedReaderWidgetProps {
  numberOfItems?: number
  title?: string
  configKey?: "feed1" | "feed2" | "feed3"
}

export function FeedReaderWidget({
  numberOfItems = 5,
  title = "Feed Notizie",
  configKey = "feed1",
}: FeedReaderWidgetProps) {
  const { config, isLoading: isLoadingConfig, error: errorConfig } = useAppConfig()

  const [items, setItems] = useState<FeedItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)
  const [errorFeed, setErrorFeed] = useState<string | null>(null)

  // Estrai feedUrl solo dopo che config è stato caricato e non è null
  const feedUrl = !isLoadingConfig && config ? (config[configKey] as string | undefined) : undefined

  useEffect(() => {
    // Non procedere se la configurazione sta caricando, c'è un errore di configurazione, o feedUrl non è ancora definito
    if (isLoadingConfig || errorConfig || !feedUrl) {
      if (!isLoadingConfig && !errorConfig && config && !feedUrl) {
        setErrorFeed(
          `URL del feed non configurato per la chiave '${configKey}'. Verificare la tabella 'configurazione'.`,
        )
      }
      // Se isLoadingConfig è true, il widget mostrerà già lo spinner per la configurazione
      // Se errorConfig è true, il widget mostrerà già l'errore di configurazione
      return
    }

    const fetchFeed = async () => {
      setIsLoadingFeed(true)
      setErrorFeed(null)
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
        setErrorFeed(err instanceof Error ? err.message : "Errore sconosciuto nel recupero del feed.")
      } finally {
        setIsLoadingFeed(false)
      }
    }

    fetchFeed()
  }, [feedUrl, numberOfItems, isLoadingConfig, errorConfig, config, configKey]) // Aggiunto config a dependencies

  const handleItemClick = (item: FeedItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  if (isLoadingConfig) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rss className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Caricamento configurazione feed...</p>
        </CardContent>
      </Card>
    )
  }

  if (errorConfig) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rss className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-4 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Errore nel caricamento della configurazione:</p>
          <p className="text-sm text-center">{errorConfig}</p>
        </CardContent>
      </Card>
    )
  }

  // Questo blocco ora viene raggiunto solo se isLoadingConfig è false e errorConfig è null
  if (!feedUrl) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rss className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-4 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p className="font-semibold">Configurazione mancante:</p>
          <p className="text-sm text-center">
            L'URL del feed per la chiave '{configKey}' non è stato trovato o non è valido nella tabella
            'configurazione'.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Rss className="h-6 w-6 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>
          Ultimi aggiornamenti da: <span className="font-medium text-xs break-all">{feedUrl}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingFeed && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Caricamento feed...</p>
          </div>
        )}
        {errorFeed &&
          !isLoadingFeed && ( // Mostra errore feed solo se non stiamo caricando il feed
            <div className="flex flex-col items-center justify-center py-4 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Errore nel caricamento del feed:</p>
              <p className="text-sm text-center">{errorFeed}</p>
            </div>
          )}
        {!isLoadingFeed && !errorFeed && items.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">Nessun elemento trovato nel feed.</p>
        )}
        {!isLoadingFeed && !errorFeed && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={item.link || `feed-item-${index}`} className="border-b pb-3 last:border-b-0 last:pb-0">
                <button
                  onClick={() => handleItemClick(item)}
                  className="text-left w-full hover:bg-muted/50 p-2 rounded-md transition-colors"
                  aria-label={`Leggi articolo: ${item.title || "Senza titolo"}`}
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
