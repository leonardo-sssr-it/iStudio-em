"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Plus, Search, Calendar, Bell, BellOff, XCircle, StickyNote } from "lucide-react"
import Link from "next/link"
import type { Nota } from "@/lib/services/note-service"
import { useAppConfig } from "@/hooks/use-app-config"

export default function NoteListPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const { config } = useAppConfig()

  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<Nota[]>([])
  const [filteredNote, setFilteredNote] = useState<Nota[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [notificationFilter, setNotificationFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  // Ottieni le priorità dalla configurazione
  const priorityOptions = config?.priorita || []

  // Carica le note
  useEffect(() => {
    async function loadNote() {
      if (!supabase || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from("note")
          .select("*")
          .eq("id_utente", user.id)
          .order("modifica", { ascending: false })

        if (fetchError) throw fetchError

        setNote(data || [])
      } catch (err: any) {
        console.error("Errore nel caricamento delle note:", err)
        setError(err.message)
        toast({
          title: "Errore",
          description: `Impossibile caricare le note: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadNote()
  }, [supabase, user?.id])

  // Applica i filtri
  useEffect(() => {
    let filtered = note

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(
        (nota) =>
          nota.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          nota.contenuto.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro per priorità
    if (priorityFilter !== "all") {
      filtered = filtered.filter((nota) => String(nota.priorita) === priorityFilter)
    }

    // Filtro per notifiche
    if (notificationFilter !== "all") {
      if (notificationFilter === "with") {
        filtered = filtered.filter((nota) => nota.notifica)
      } else if (notificationFilter === "without") {
        filtered = filtered.filter((nota) => !nota.notifica)
      }
    }

    setFilteredNote(filtered)
  }, [note, searchTerm, priorityFilter, notificationFilter])

  // Formatta la data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return dateString
    }
  }

  // Ottieni il colore della priorità
  const getPriorityColor = (priorita: string | number | null) => {
    if (!priorita) return "bg-gray-100 text-gray-800"

    // Converti sempre a stringa per la ricerca
    const prioritaStr = String(priorita)

    const priority = priorityOptions.find((p) => String(p.value) === prioritaStr)
    if (priority?.color) {
      return `bg-${priority.color}-100 text-${priority.color}-800`
    }

    // Fallback colors basati sul valore
    const prioritaLower = prioritaStr.toLowerCase()
    switch (prioritaLower) {
      case "alta":
      case "3":
        return "bg-red-100 text-red-800"
      case "media":
      case "2":
        return "bg-yellow-100 text-yellow-800"
      case "bassa":
      case "1":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Ottieni il label della priorità
  const getPriorityLabel = (priorita: string | number | null) => {
    if (!priorita) return ""

    const prioritaStr = String(priorita)
    const priority = priorityOptions.find((p) => String(p.value) === prioritaStr)

    return priority?.label || prioritaStr
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <StickyNote className="h-8 w-8" />
            Le Mie Note
          </h1>
          <p className="text-gray-600 mt-1">Gestisci le tue note personali</p>
        </div>

        <Button onClick={() => router.push("/note/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Nota
        </Button>
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cerca nelle note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tutte le priorità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le priorità</SelectItem>
            {priorityOptions.map((priority) => (
              <SelectItem key={priority.value} value={String(priority.value)}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={notificationFilter} onValueChange={setNotificationFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tutte le notifiche" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="with">Con notifica</SelectItem>
            <SelectItem value="without">Senza notifica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista note */}
      {error ? (
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Errore nel caricamento</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Riprova</Button>
          </CardContent>
        </Card>
      ) : filteredNote.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <StickyNote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessuna nota trovata</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || priorityFilter !== "all" || notificationFilter !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Non hai ancora creato nessuna nota"}
            </p>
            <Button onClick={() => router.push("/note/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Crea la prima nota
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNote.map((nota) => (
            <Card key={nota.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/note/${nota.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{nota.titolo}</CardTitle>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {nota.priorita && (
                          <Badge className={getPriorityColor(nota.priorita)}>{getPriorityLabel(nota.priorita)}</Badge>
                        )}

                        {nota.notifica ? (
                          <Badge variant="outline" className="text-blue-600">
                            <Bell className="h-3 w-3 mr-1" />
                            Notifica
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <BellOff className="h-3 w-3 mr-1" />
                            Nessuna notifica
                          </Badge>
                        )}

                        {nota.tags && nota.tags.length > 0 && (
                          <Badge variant="secondary">
                            {nota.tags.length} tag{nota.tags.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Modificata: {formatDate(nota.modifica)}
                    </div>
                    {nota.creato_il && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Creata: {formatDate(nota.creato_il)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 line-clamp-2">
                    {nota.contenuto.length > 150 ? `${nota.contenuto.substring(0, 150)}...` : nota.contenuto}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Statistiche */}
      {filteredNote.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Visualizzazione di {filteredNote.length} note su {note.length} totali
        </div>
      )}
    </div>
  )
}
