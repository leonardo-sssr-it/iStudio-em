"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"

// CONFIGURAZIONE WIDGET - Modifica questi valori
const NOTES_PER_PAGE = 5 // Numero di note per pagina
const NAVIGATION_THRESHOLD = 5 // Soglia per mostrare navigazione

interface Note {
  id: number
  titolo: string
  contenuto: string
}

export default function NotesFooterWidget() {
  const { user } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalNotes, setTotalNotes] = useState(0)
  const [expandedNote, setExpandedNote] = useState<number | null>(null)

  // Carica le note dell'utente
  const loadNotes = useCallback(async () => {
    if (!user?.id) return

    console.log("Caricamento note per utente:", user.id)
    setLoading(true)

    try {
      const supabase = createClient()

      // Prima conta il totale delle note
      const { count, error: countError } = await supabase
        .from("note")
        .select("*", { count: "exact", head: true })
        .eq("id_utente", user.id)

      if (countError) {
        console.error("Errore nel conteggio note:", countError)
        throw countError
      }

      setTotalNotes(count || 0)

      // Poi carica le note per la pagina corrente
      const { data, error } = await supabase
        .from("note")
        .select("id, titolo, contenuto")
        .eq("id_utente", user.id)
        .order("id", { ascending: true }) // Ordine crescente - prima nel DB = prima nella lista
        .range(currentPage * NOTES_PER_PAGE, (currentPage + 1) * NOTES_PER_PAGE - 1)

      if (error) {
        console.error("Errore nel caricamento note:", error)
        throw error
      }

      console.log("Note caricate:", data)
      setNotes(data || [])
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentPage])

  // Carica le note quando cambia l'utente o la pagina
  useEffect(() => {
    if (user?.id) {
      loadNotes()
    }
  }, [user?.id, loadNotes])

  // Gestisce la creazione di una nuova nota
  const handleCreateNote = useCallback(() => {
    router.push("/data-explorer/note/new")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [router])

  // Gestisce la visualizzazione di una nota
  const handleViewNote = useCallback(
    (noteId: number) => {
      router.push(`/data-explorer/note/${noteId}`)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [router],
  )

  // Gestisce il doppio click sul contenuto
  const handleContentDoubleClick = useCallback(
    (noteId: number, e: React.MouseEvent) => {
      e.stopPropagation()
      handleViewNote(noteId)
    },
    [handleViewNote],
  )

  // Gestisce l'espansione/contrazione del contenuto
  const handleToggleExpand = useCallback((noteId: number) => {
    setExpandedNote((prev) => (prev === noteId ? null : noteId))
  }, [])

  // Navigazione tra le pagine
  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
    setExpandedNote(null) // Chiude tutte le note espanse quando cambia pagina
  }, [])

  const handleNextPage = useCallback(() => {
    const maxPage = Math.ceil(totalNotes / NOTES_PER_PAGE) - 1
    setCurrentPage((prev) => Math.min(maxPage, prev + 1))
    setExpandedNote(null) // Chiude tutte le note espanse quando cambia pagina
  }, [totalNotes])

  // Formatta il contenuto markdown base
  const formatContent = useCallback((content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-[9px]">$1</code>')
  }, [])

  // Non mostrare il widget se l'utente non è autenticato
  if (!user) {
    return null
  }

  const totalPages = Math.ceil(totalNotes / NOTES_PER_PAGE)
  const showNavigation = totalNotes > NAVIGATION_THRESHOLD

  return (
    <div className="text-[10px] space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showNavigation && (
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              title="Pagina precedente"
            >
              <ChevronLeft className="h-2 w-2" />
            </Button>
          )}

          <h3 className="font-medium">Note</h3>

          {showNavigation && totalPages > 1 && (
            <span className="text-[8px] text-muted-foreground">
              {currentPage + 1}/{totalPages}
            </span>
          )}

          {showNavigation && (
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              title="Pagina successiva"
            >
              <ChevronRight className="h-2 w-2" />
            </Button>
          )}
        </div>

        <Button variant="ghost" size="sm" className="h-3 w-3 p-0" onClick={handleCreateNote} title="Crea nuova nota">
          <Plus className="h-2 w-2" />
        </Button>
      </div>

      {/* Lista Note */}
      <div className="space-y-1">
        {loading ? (
          <div className="text-[8px] text-muted-foreground">Caricamento...</div>
        ) : notes.length === 0 ? (
          <div className="text-[8px] text-muted-foreground">Nessuna nota trovata</div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="space-y-1">
              {/* Titolo */}
              <div className="flex items-center justify-between">
                <div className="flex-1 truncate" title={note.titolo}>
                  {note.titolo}
                </div>

                {note.contenuto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => handleToggleExpand(note.id)}
                    title={expandedNote === note.id ? "Contrai contenuto" : "Espandi contenuto"}
                  >
                    {expandedNote === note.id ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                  </Button>
                )}
              </div>

              {/* Contenuto espandibile */}
              {expandedNote === note.id && note.contenuto && (
                <div
                  className={`
                    pl-2 border-l-4 border-l-primary bg-muted/30 
                    transition-all duration-200 cursor-pointer select-text
                  `}
                  onDoubleClick={(e) => handleContentDoubleClick(note.id, e)}
                  title="Doppio click per aprire la nota in data-explorer"
                >
                  <ScrollArea className="max-h-32 w-full pr-2">
                    <div
                      className="text-[10px] text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: formatContent(note.contenuto),
                      }}
                    />
                  </ScrollArea>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      {totalNotes > 0 && <div className="text-[8px] text-muted-foreground pt-1 border-t">{totalNotes} note totali</div>}
    </div>
  )
}
