"use client"

import { X, ZoomIn, ZoomOut, Printer, ExternalLink } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
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

  const handlePrint = () => {
    window.print()
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 printable-modal custom-feed-modal-dialog-content">
        <DialogHeader className="p-6 pb-4 dialog-header-no-print flex flex-row items-start justify-between gap-4">
          <DialogTitle className="text-xl md:text-2xl break-words feed-title-print">
            {item.title || "Dettaglio Feed"}
          </DialogTitle>
          <div className="flex items-center gap-2 font-controls-no-print flex-shrink-0">
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
                    disabled={fontSizeIndex === FONT_SIZES.length - 1}
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
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">Stampa</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stampa articolo</p>
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

        <div className="px-6 pt-0 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b feed-meta-print">
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

        <div
          // Contenitore scrollabile per la visualizzazione a schermo
          className={`overflow-y-auto flex-grow p-6 feed-content-print`}
        >
          <div
            // Contenitore per l'HTML, con classi prose e dimensione font dinamica
            className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none ${currentFontSizeClass}`}
            dangerouslySetInnerHTML={{ __html: item.content || "<p>Nessun contenuto disponibile.</p>" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
