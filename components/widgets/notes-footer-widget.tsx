"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Plus, StickyNote, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// CONFIGURAZIONE WIDGET - Modifica questi valori per personalizzare il comportamento
const NOTES_PER_PAGE = 5 // Numero di note da mostrare per pagina
const NAVIGATION_THRESHOLD = 5 // Soglia minima per mostrare i tasti di navigazione
const WIDGET_FONT_SIZE = "text-[10px]" // Dimensione carattere per tutto il widget

interface Note {
  id: number
  titolo: string
  contenuto: string
  data_creazione: string
}

export function NotesFooterWidget() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()

  // Stati del widget
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalNotes, setTotalNotes] = useState(0)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())

  // Calcola se mostrare i controlli di navigazione
  const totalPages = Math.ceil(totalNotes / NOTES_PER_PAGE)
  const hasNextPage = currentPage < totalPages - 1
  const hasPrevPage = currentPage > 0

  // Carica le note dal database
  const loadNotes = useCallback(async () => {
    if (!supabase || !user?.id) return

    setLoading(true)
    try {
      // Query per il conteggio totale
      const { count } = await supabase.from("note").select("*", { count: "exact", head: true }).eq("id_utente", user.id)

      setTotalNotes(count || 0)

      // Query per le note della pagina corrente
      const { data, error } = await supabase
        .from("note")
        .select("id, titolo, contenuto, data_creazione")
        .eq("id_utente", user.id)
        .order("data_creazione", { ascending: false })
        .range(currentPage * NOTES_PER_PAGE, (currentPage + 1) * NOTES_PER_PAGE - 1)

      if (error) throw error

      setNotes(data || [])
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id, currentPage])

  // Carica le note quando il componente si monta o cambia pagina
  useEffect(() => {
    if (supabase && user?.id) {
      loadNotes()
    }
  }, [loadNotes])

  // Gestisce la navigazione tra le pagine
  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1)
      setExpandedNotes(new Set()) // Chiudi tutte le note espanse
    }
  }

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1)
      setExpandedNotes(new Set()) // Chiudi tutte le note espanse
    }
  }

  // Crea una nuova nota
  const handleCreateNote = () => {
    router.push("/data-explorer/note/new")
  }

  // Apre una nota in modifica
  const handleEditNote = (noteId: number) => {
    router.push(`/data-explorer/note/${noteId}?edit=true`)
  }

  // Gestisce l'espansione/collasso del contenuto delle note
  const toggleNoteContentExpansion = (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Previene l'apertura della nota in modifica
    setExpandedNotes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  // Formatta il contenuto markdown (versione semplificata)
  const formatMarkdown = (content: string) => {
    if (!content) return ""

    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-[9px]">$1</code>') // Code
      .replace(/\n/g, "<br>") // Line breaks
  }

  // Tronca il contenuto se non espanso
  const getTruncatedContent = (content: string, noteId: number, maxLength = 80) => {
    const isExpanded = expandedNotes.has(noteId)
    if (isExpanded || content.length <= maxLength) {
      return content
    }
    return content.substring(0, maxLength) + "..."
  }

  // Non mostrare il widget se l'utente non è autenticato
  if (!user) return null

  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className={cn("shadow-lg border-2", WIDGET_FONT_SIZE)}>
        {/* Header del widget */}
        <CardHeader className="p-2 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            {/* Navigazione sinistra - visibile solo se necessaria */}
            {totalNotes > NAVIGATION_THRESHOLD && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={!hasPrevPage || loading}
                className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            )}

            {/* Sezione centrale con icona e titolo */}
            <div className="flex items-center space-x-2 flex-1 justify-center">
              <StickyNote className="h-4 w-4" />
              <span className="font-medium">Note</span>
              {totalNotes > NAVIGATION_THRESHOLD && (
                <span className="text-xs opacity-75">
                  {currentPage + 1}/{totalPages}
                </span>
              )}
            </div>

            {/* Pulsante nuova nota */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNote}
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              title="Nuova nota"
            >
              <Plus className="h-3 w-3" />
            </Button>

            {/* Navigazione destra - visibile solo se necessaria */}
            {totalNotes > NAVIGATION_THRESHOLD && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNextPage || loading}
                className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}

            {/* Pulsante collassa/espandi */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20 ml-2"
            >
              {isCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>

        {/* Contenuto del widget - collassabile */}
        {!isCollapsed && (
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                  <span className={WIDGET_FONT_SIZE}>Caricamento note...</span>
                </div>
              ) : notes.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className={WIDGET_FONT_SIZE}>Nessuna nota trovata</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNote}
                    className={cn("mt-2 h-6 bg-transparent", WIDGET_FONT_SIZE)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crea la prima nota
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {notes.map((note) => {
                    const isExpanded = expandedNotes.has(note.id)
                    const truncatedContent = getTruncatedContent(note.contenuto, note.id)
                    const hasContent = note.contenuto && note.contenuto.trim().length > 0

                    return (
                      <div
                        key={note.id}
                        className={cn(
                          "p-3 hover:bg-muted/50 cursor-pointer transition-all duration-200",
                          // Bordino dinamico per note espanse
                          isExpanded && "border-l-4 border-l-primary bg-muted/30",
                        )}
                        onClick={() => handleEditNote(note.id)}
                      >
                        {/* Titolo della nota */}
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={cn("font-medium text-foreground line-clamp-1 flex-1", WIDGET_FONT_SIZE)}>
                            {note.titolo || "Nota senza titolo"}
                          </h4>
                          {/* Data di creazione accanto al titolo */}
                          <div className={cn("text-muted-foreground ml-2 flex-shrink-0", "text-[8px]")}>
                            {new Date(note.data_creazione).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {/* Contenuto della nota - collassabile */}
                        {hasContent && (
                          <div className="mt-2">
                            <div className="flex items-start justify-between">
                              <div
                                className={cn("text-muted-foreground flex-1 cursor-pointer", WIDGET_FONT_SIZE)}
                                onClick={(e) => toggleNoteContentExpansion(note.id, e)}
                              >
                                <div
                                  className={cn(
                                    "prose prose-sm max-w-none",
                                    isExpanded ? "max-h-24 overflow-y-auto" : "line-clamp-2",
                                    WIDGET_FONT_SIZE,
                                  )}
                                  dangerouslySetInnerHTML={{
                                    __html: formatMarkdown(truncatedContent),
                                  }}
                                />
                              </div>

                              {/* Pulsante per espandere/contrarre il contenuto */}
                              {note.contenuto.length > 80 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => toggleNoteContentExpansion(note.id, e)}
                                  className="h-4 w-4 p-0 ml-2 flex-shrink-0 hover:bg-primary/10"
                                  title={isExpanded ? "Riduci contenuto" : "Espandi contenuto"}
                                >
                                  {isExpanded ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer con informazioni aggiuntive */}
            {!loading && notes.length > 0 && (
              <div className="p-2 bg-muted/30 border-t text-center text-muted-foreground">
                <span className="text-[8px]">
                  {totalNotes} note totali
                  {totalNotes > NAVIGATION_THRESHOLD && ` • Pagina ${currentPage + 1} di ${totalPages}`}
                </span>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
