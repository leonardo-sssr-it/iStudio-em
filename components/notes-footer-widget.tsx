"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Plus, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// CONFIGURAZIONE WIDGET - Modifica questi valori per personalizzare il comportamento
const NOTES_PER_PAGE = 5 // Numero di note da mostrare per pagina
const NAVIGATION_THRESHOLD = 5 // Soglia minima per mostrare i tasti di navigazione
const WIDGET_FONT_SIZE = "text-[10px]" // Dimensione carattere per tutto il widget

interface Note {
  id: number
  titolo: string
  contenuto: string
}

export function NotesFooterWidget() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()

  // Stati del widget
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalNotes, setTotalNotes] = useState(0)
  const [expandedNote, setExpandedNote] = useState<number | null>(null) // Solo una nota espansa alla volta

  // Calcola se mostrare i controlli di navigazione
  const totalPages = Math.ceil(totalNotes / NOTES_PER_PAGE)
  const hasNextPage = currentPage < totalPages - 1
  const hasPrevPage = currentPage > 0

  // Carica le note dal database in modo asincrono
  const loadNotes = useCallback(async () => {
    if (!supabase || !user?.id) return

    try {
      console.log("Caricamento note per utente:", user.id)

      // Query per il conteggio totale - VERIFICA FILTRO id_utente
      const { count, error: countError } = await supabase
        .from("note")
        .select("*", { count: "exact", head: true })
        .eq("id_utente", user.id)

      if (countError) {
        console.error("Errore conteggio note:", countError)
        throw countError
      }

      console.log("Totale note trovate:", count)
      setTotalNotes(count || 0)

      // Query per le note della pagina corrente - ORDINE DECRESCENTE (più recenti prima)
      const { data, error } = await supabase
        .from("note")
        .select("id, titolo, contenuto")
        .eq("id_utente", user.id)
        .order("id", { ascending: false }) // Ordine decrescente per ID (più recenti prima)
        .range(currentPage * NOTES_PER_PAGE, (currentPage + 1) * NOTES_PER_PAGE - 1)

      if (error) {
        console.error("Errore caricamento note:", error)
        throw error
      }

      console.log("Note caricate:", data)
      setNotes(data || [])
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error)
      setNotes([])
      setTotalNotes(0)
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
  const handlePrevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1)
      setExpandedNote(null) // Chiudi la nota espansa quando cambi pagina
    }
  }, [hasPrevPage])

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1)
      setExpandedNote(null) // Chiudi la nota espansa quando cambi pagina
    }
  }, [hasNextPage])

  // Crea una nuova nota e torna al top
  const handleCreateNote = useCallback(() => {
    // Scorri al top della pagina
    window.scrollTo({ top: 0, behavior: "smooth" })
    router.push("/data-explorer/note/new")
  }, [router])

  // Apre una nota in modifica e torna al top
  const handleEditNote = useCallback(
    (noteId: number) => {
      // Scorri al top della pagina
      window.scrollTo({ top: 0, behavior: "smooth" })
      router.push(`/data-explorer/note/${noteId}?edit=true`)
    },
    [router],
  )

  // Gestisce l'espansione/collasso del contenuto delle note - solo una alla volta
  const toggleNoteContentExpansion = useCallback((noteId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Previene l'apertura della nota in modifica
    setExpandedNote((prev) => {
      // Se la nota è già espansa, chiudila; altrimenti aprila e chiudi le altre
      return prev === noteId ? null : noteId
    })
  }, [])

  // Formatta il contenuto markdown (versione semplificata)
  const formatMarkdown = useCallback((content: string) => {
    if (!content) return ""

    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-[9px]">$1</code>') // Code
      .replace(/\n/g, "<br>") // Line breaks
  }, [])

  // Non mostrare il widget se l'utente non è autenticato
  if (!user) {
    console.log("Widget note: utente non autenticato")
    return null
  }

  console.log("Rendering widget note per utente:", user.id)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Note</h4>
        <div className="flex items-center space-x-1">
          {/* Navigazione sinistra - visibile solo se necessaria */}
          {totalNotes > NAVIGATION_THRESHOLD && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={!hasPrevPage || loading}
              className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          )}

          {/* Pulsante nuova nota */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateNote}
            className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
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
              className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Lista delle note */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mx-auto mb-1"></div>
            <span className={WIDGET_FONT_SIZE}>Caricamento...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p className={WIDGET_FONT_SIZE}>Nessuna nota</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNote}
              className={cn("mt-1 h-5 bg-transparent", WIDGET_FONT_SIZE)}
            >
              <Plus className="h-2 w-2 mr-1" />
              Crea nota
            </Button>
          </div>
        ) : (
          <ul className="space-y-1">
            {notes.map((note) => {
              const isExpanded = expandedNote === note.id
              const hasContent = note.contenuto && note.contenuto.trim().length > 0

              return (
                <li key={note.id} className="space-y-1">
                  {/* Titolo della nota - sempre visibile e cliccabile per aprire in modifica */}
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => handleEditNote(note.id)}
                      className={cn(
                        "text-left text-muted-foreground hover:text-primary transition-colors flex-1 line-clamp-1",
                        WIDGET_FONT_SIZE,
                      )}
                      title={`Apri nota: ${note.titolo || "Nota senza titolo"}`}
                    >
                      {note.titolo || "Nota senza titolo"}
                    </button>

                    {/* Pulsante per espandere/contrarre il contenuto - solo se c'è contenuto */}
                    {hasContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => toggleNoteContentExpansion(note.id, e)}
                        className="h-3 w-3 p-0 ml-1 flex-shrink-0 text-muted-foreground hover:text-primary"
                        title={isExpanded ? "Riduci contenuto" : "Espandi contenuto"}
                      >
                        {isExpanded ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                      </Button>
                    )}
                  </div>

                  {/* Contenuto della nota - collassato di default, solo una espansa alla volta */}
                  {hasContent && isExpanded && (
                    <div className="ml-2 pl-2 border-l-2 border-l-primary/30">
                      <ScrollArea className="max-h-16">
                        <div
                          className={cn(
                            "text-muted-foreground prose prose-sm max-w-none cursor-pointer",
                            WIDGET_FONT_SIZE,
                          )}
                          onClick={() => handleEditNote(note.id)}
                          title="Clicca per aprire la nota in modifica"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(note.contenuto),
                          }}
                        />
                      </ScrollArea>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer con informazioni - solo se ci sono note */}
      {!loading && notes.length > 0 && totalNotes > NAVIGATION_THRESHOLD && (
        <div className="text-center text-muted-foreground">
          <span className="text-[8px]">
            Pagina {currentPage + 1} di {totalPages} ({totalNotes} note)
          </span>
        </div>
      )}
    </div>
  )
}
