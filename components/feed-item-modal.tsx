"use client"

import { X, ZoomIn, ZoomOut, ExternalLink } from "lucide-react"
import { useEffect, useState, useCallback, useMemo } from "react"
import DOMPurify from "dompurify"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// Array di valori CSS per la dimensione del font.
// Corrispondono a text-xs, text-sm, text-base, text-lg, text-xl
const FONT_SIZE_VALUES = ["0.8rem", "0.9rem", "1rem", "1.1rem", "1.2rem"]
const DEFAULT_FONT_SIZE_INDEX = 2 // 1rem (corrisponde a text-base)

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

  // Sanitizza l'HTML del contenuto del feed usando DOMPurify
  const sanitizedContent = useMemo(() => {
    if (typeof window !== "undefined" && item?.content) {
      return DOMPurify.sanitize(item.content)
    }
    return "<p>Nessun contenuto disponibile.</p>"
  }, [item?.content])

  if (!item) return null

  const increaseFontSize = () => {
    setFontSizeIndex((prev) => Math.min(prev + 1, FONT_SIZE_VALUES.length - 1))
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 custom-feed-modal-dialog-content">
        <DialogHeader className="p-6 pb-4 flex flex-row items-start justify-between gap-4">
          <DialogTitle className="text-xl md:text-2xl break-words">{item.title || "Dettaglio Feed"}</DialogTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={decreaseFontSize} disabled={fontSizeIndex === 0}>
                    <ZoomOut className="h-4 w-4" />
                    <span className="sr-only">Riduci testo</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Riduci dimensione testo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={increaseFontSize}
                    disabled={fontSizeIndex === FONT_SIZE_VALUES.length - 1}
                  >
                    <ZoomIn className="h-4 w-4" />
                    <span className="sr-only">Aumenta testo</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Aumenta dimensione testo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Chiudi</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chiudi finestra</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="px-6 pt-0 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b">
          <div className="text-xs text-muted-foreground mb-2 sm:mb-0">
            {(item.creator || formattedDate) && (
              <p className="mb-1">
                {item.creator && <span>Autore: {item.creator}</span>}
                {item.creator && formattedDate && <span className="mx-1">|</span>}
                {formattedDate && <span>Pubblicato: {formattedDate}</span>}
              </p>
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                title={item.link}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center break-all"
              >
                {item.link}
                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-grow p-6">
          <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            // Applica lo stile inline per la dimensione del font
            style={{ fontSize: FONT_SIZE_VALUES[fontSizeIndex] }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
