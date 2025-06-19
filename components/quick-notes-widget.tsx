"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { NoteService, type Nota, type NotaInsert } from "@/lib/services/note-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, FileText, Calendar, AlertCircle, Eye, Database } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface QuickNotesWidgetProps {
  className?: string
}

export function QuickNotesWidget({ className }: QuickNotesWidgetProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [notes, setNotes] = useState<Nota[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state per nuova nota
  const [newNote, setNewNote] = useState({
    titolo: "",
    contenuto: "",
  })
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Funzione per caricare le note
  const loadNotes = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await NoteService.getNote(
        { id_utente: user.id },
        { field: "modifica", direction: "desc" },
        10, // Limite a 10 note
        0, // Offset 0
      )

      if (result.error) {
        throw result.error
      }

      setNotes(result.data || [])
    } catch (err) {
      console.error("Errore nel caricamento delle note:", err)
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Carica le note all'avvio
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Funzione per creare una nuova nota
  const handleCreateNote = async () => {
    if (!user?.id || !newNote.titolo.trim() || !newNote.contenuto.trim()) {
      return
    }

    try {
      setIsCreating(true)

      const notaToCreate: NotaInsert = {
        titolo: newNote.titolo.trim(),
        contenuto: newNote.contenuto.trim(),
        id_utente: user.id,
        creato_il: new Date().toISOString(),
        modifica: new Date().toISOString(),
        synced: false,
      }

      const result = await NoteService.createNota(notaToCreate)

      if (result.error) {
        throw result.error
      }

      if (result.data) {
        // Reset form
        setNewNote({ titolo: "", contenuto: "" })
        setShowCreateForm(false)

        // Ricarica le note
        await loadNotes()

        // Naviga alla nota appena creata
        router.push(`/note/${result.data.id}`)
      }
    } catch (err) {
      console.error("Errore nella creazione della nota:", err)
      setError(err instanceof Error ? err.message : "Errore nella creazione della nota")
    } finally {
      setIsCreating(false)
    }
  }

  // Funzione per formattare la data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data non disponibile"
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: it })
    } catch {
      return "Data non valida"
    }
  }

  // Componente per singola nota nella lista
  const NoteItem = ({ note }: { note: Nota }) => (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-2 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{note.titolo}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{note.contenuto}</p>
              <div className="flex items-center mt-2 text-xs text-gray-400">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(note.modifica)}
              </div>
            </div>
            <FileText className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base">{note.titolo}</h3>
            <p className="text-xs text-gray-500 mt-1">Modificata: {formatDate(note.modifica)}</p>
          </div>

          <div className="max-h-40 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{note.contenuto}</p>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={() => router.push(`/note/${note.id}`)} className="flex-1">
              <Eye className="h-3 w-3 mr-1" />
              Visualizza
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/data-explorer/note/${note.id}`)}
              className="flex-1"
            >
              <Database className="h-3 w-3 mr-1" />
              Data Explorer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Note Veloci</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-sm">Accesso richiesto</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Note Veloci</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowCreateForm(!showCreateForm)} disabled={isCreating}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Form per creare nuova nota */}
        {showCreateForm && (
          <div className="space-y-2 p-3 border rounded-md bg-gray-50">
            <Input
              placeholder="Titolo della nota..."
              value={newNote.titolo}
              onChange={(e) => setNewNote((prev) => ({ ...prev, titolo: e.target.value }))}
              disabled={isCreating}
            />
            <Textarea
              placeholder="Contenuto della nota..."
              value={newNote.contenuto}
              onChange={(e) => setNewNote((prev) => ({ ...prev, contenuto: e.target.value }))}
              rows={3}
              disabled={isCreating}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateNote}
                disabled={isCreating || !newNote.titolo.trim() || !newNote.contenuto.trim()}
                className="flex-1"
              >
                {isCreating ? "Salvando..." : "Salva"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewNote({ titolo: "", contenuto: "" })
                }}
                disabled={isCreating}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* Messaggio di errore */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista delle note */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            Nessuna nota trovata
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {notes.map((note) => (
                <NoteItem key={note.id} note={note} />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer con conteggio */}
        {!isLoading && notes.length > 0 && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">{notes.length} note recenti</div>
        )}
      </CardContent>
    </Card>
  )
}
