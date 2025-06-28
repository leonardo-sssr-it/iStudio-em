"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Note {
  id: number
  titolo: string
  contenuto: string | null
}

export function NotesFooterWidget() {
  const { user } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [expandedNote, setExpandedNote] = useState<number | null>(null)

  // CONFIGURAZIONE WIDGET - Modifica questi valori
  const NOTES_PER_PAGE = 5 // Numero di note per pagina
  const NAVIGATION_THRESHOLD = 5 // Soglia per mostrare navigazione

  const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE)
  const showNavigation = notes.length > NAVIGATION_THRESHOLD

  // Carica le note dell'utente
  const loadNotes = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      console.log("Caricamento note per utente:", user.id)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("note")
        .select("id, titolo, contenuto")
        .eq("id_utente", user.id)
        .order("id", { ascending: true }) // Ordine crescente - prima nel DB = prima nella lista

      if (error) {
        console.error("Errore nel caricamento delle note:", error)
        return
      }

      console.log("Note caricate:", data?.length || 0)
      setNotes(data || [])
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

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
  const toggleExpanded = useCallback((noteId: number) => {
    setExpandedNote((prev) => (prev === noteId ? null : noteId))
  }, [])

  // Navigazione tra le pagine
  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
    setExpandedNote(null) // Chiude tutte le note espanse quando cambi pagina
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
    setExpandedNote(null) // Chiude tutte le note espanse quando cambi pagina
  }, [totalPages])

  // Calcola le note da mostrare nella pagina corrente
  const currentNotes = notes.slice(currentPage * NOTES_PER_PAGE, (currentPage + 1) * NOTES_PER_PAGE)

  // Formatta il contenuto markdown base
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="text-[9px] bg-gray-100 px-1 rounded">$1</code>')
  }

  if (!user) return null

  return (
    <div className="text-[10px] space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Note</h3>

        <div className="flex items-center gap-1">
          {/* Navigazione - appare solo se ci sono più di NAVIGATION_THRESHOLD note */}
          {showNavigation && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0"
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                title="Pagina precedente"
              >
                <ChevronLeft className="h-2 w-2" />
              </Button>

              <span className="text-[8px] text-gray-500 mx-1">
                {currentPage + 1}/{totalPages}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                title="Pagina successiva"
              >
                <ChevronRight className="h-2 w-2" />
              </Button>
            </>
          )}

          {/* Pulsante per creare nuova nota */}
          <Button
            variant="ghost"
            size="sm"
            className="h-3 w-3 p-0 ml-1"
            onClick={handleCreateNote}
            title="Crea nuova nota"
          >
            <Plus className="h-2 w-2" />
          </Button>
        </div>
      </div>

      {/* Lista delle note */}
      <div className="space-y-1">
        {loading ? (
          <div className="text-[8px] text-gray-500">Caricamento...</div>
        ) : currentNotes.length === 0 ? (
          <div className="text-[8px] text-gray-500">Nessuna nota trovata</div>
        ) : (
          currentNotes.map((note) => (
            <div
              key={note.id}
              className={`border rounded p-2 transition-all duration-200 ${
                expandedNote === note.id
                  ? "border-l-4 border-l-primary bg-muted/30"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Titolo della nota */}
              <div
                className="font-medium text-gray-900 cursor-pointer hover:text-primary"
                onClick={() => handleViewNote(note.id)}
                title={note.titolo}
              >
                {note.titolo.length > 40 ? `${note.titolo.substring(0, 40)}...` : note.titolo}
              </div>

              {/* Contenuto espandibile */}
              {note.contenuto && (
                <div className="mt-1">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0"
                      onClick={() => toggleExpanded(note.id)}
                      title={expandedNote === note.id ? "Contrai contenuto" : "Espandi contenuto"}
                    >
                      {expandedNote === note.id ? (
                        <ChevronUp className="h-2 w-2" />
                      ) : (
                        <ChevronDown className="h-2 w-2" />
                      )}
                    </Button>
                  </div>

                  {expandedNote === note.id && (
                    <ScrollArea
                      className="w-full max-h-32 mt-1"
                      onDoubleClick={(e) => handleContentDoubleClick(note.id, e)}
                    >
                      <div
                        className="text-gray-600 pr-2 cursor-pointer select-text"
                        dangerouslySetInnerHTML={{
                          __html: formatContent(note.contenuto),
                        }}
                        title="Doppio click per aprire la nota in data-explorer"
                      />
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      {notes.length > 0 && <div className="text-[8px] text-gray-400 text-center">{notes.length} note totali</div>}
    </div>
  )
}
