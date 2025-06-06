"use client"

import { X, ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"

type FeedItem = {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  creator?: string
  isoDate?: string
}

interface FeedItemModalProps {
  item: FeedItem | null
  isOpen: boolean
  onClose: () => void
}

const FONT_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"]
const DEFAULT_FONT_SIZE_INDEX = 2 // text-base

export function FeedItemModal({ item, isOpen, onClose }: FeedItemModalProps) {
  const [fontSizeIndex, setFontSizeIndex] = useState(DEFAULT_FONT_SIZE_INDEX)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    } else {
      document.removeEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!item) return null

  const currentFontSizeClass = FONT_SIZES[fontSizeIndex]

  const increaseFontSize = () => {
    setFontSizeIndex((prev) => Math.min(prev + 1, FONT_SIZES.length - 1))
  }

  const decreaseFontSize = () => {
    setFontSizeIndex((prev) => Math.max(prev - 1, 0))
  }

  const formattedDate = item.isoDate
    ? new Date(item.isoDate).toLocaleDateString("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : item.pubDate

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl md:text-2xl break-words">{item.title || "Dettaglio Feed"}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="h-5 w-5" />
              <span className="sr-only">Chiudi</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="px-6 pb-2 flex items-center justify-between border-b">
          <div className="text-xs text-muted-foreground">
            {item.creator && <p>Autore: {item.creator}</p>}
            {formattedDate && <p>Pubblicato: {formattedDate}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={decreaseFontSize} disabled={fontSizeIndex === 0}>
              <ZoomOut className="h-4 w-4" />
              <span className="sr-only">Riduci testo</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={increaseFontSize}
              disabled={fontSizeIndex === FONT_SIZES.length - 1}
            >
              <ZoomIn className="h-4 w-4" />
              <span className="sr-only">Aumenta testo</span>
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow p-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
          {/* Applica la classe della dimensione del font qui */}
          <div
            className={currentFontSizeClass}
            dangerouslySetInnerHTML={{ __html: item.content || "<p>Nessun contenuto disponibile.</p>" }}
          />
        </div>
        {item.link && (
          <div className="p-6 border-t">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Leggi l'articolo originale &rarr;
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
