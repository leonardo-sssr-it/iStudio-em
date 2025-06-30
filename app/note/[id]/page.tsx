"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit, Trash2, Calendar, Bell, BellOff, Tag, XCircle, StickyNote, Eye } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Nota } from "@/lib/services/note-service"
import { useAppConfig } from "@/hooks/use-app-config"

export default function NotaDetailPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { config } = useAppConfig()

  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState<Nota | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  // Ottieni le priorità dalla configurazione
  const priorityOptions = config?.priorita || []

  // Carica la nota
  useEffect(() => {
    async function loadNota() {
      if (!supabase || !id || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        const { data: notaData, error: notaError } = await supabase
          .from("note")
          .select("*")
          .eq("id", id)
          .eq("id_utente", user.id)
          .single()

        if (notaError) {
          if (notaError.code === "PGRST116") {
            // Nota non trovata
            router.push("/note/not-found")
            return
          }
          throw notaError
        }

        setNota(notaData)
      } catch (err: any) {
        console.error("Errore nel caricamento della nota:", err)
        setError(err.message)
        toast({
          title: "Errore",
          description: `Impossibile caricare la nota: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadNota()
  }, [supabase, id, user?.id, router])

  // Elimina la nota
  const handleDelete = async () => {
    if (!nota?.id || !user?.id) return

    setDeleting(true)
    try {
      const { error } = await supabase.from("note").delete().eq("id", nota.id).eq("id_utente", user.id)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Nota eliminata con successo",
      })

      router.push("/note")
    } catch (err: any) {
      console.error("Errore nell'eliminazione della nota:", err)
      toast({
        title: "Errore",
        description: `Impossibile eliminare la nota: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

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
  const getPriorityColor = (priorita: string | null) => {
    if (!priorita) return "bg-gray-100 text-gray-800"

    // Assicurati che priorita sia una stringa prima di chiamare toLowerCase
    const prioritaString = typeof priorita === "string" ? priorita : String(priorita)

    const priority = priorityOptions.find((p) => p.value === prioritaString)
    if (priority?.color) {
      return `bg-${priority.color}-100 text-${priority.color}-800`
    }

    // Fallback colors
    switch (prioritaString.toLowerCase()) {
      case "alta":
        return "bg-red-100 text-red-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "bassa":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Verifica se la notifica è scaduta
  const isNotificationExpired = (notifica: string | null) => {
    if (!notifica) return false
    return new Date(notifica) < new Date()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !nota) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">{error ? "Errore nel caricamento" : "Nota non trovata"}</h3>
            <p className="text-gray-500 mb-4">
              {error || "La nota richiesta non esiste o non hai i permessi per visualizzarla"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push("/note")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alle note
              </Button>
              {error && (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Riprova
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <Link href="/note">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle note
            </Button>
          </Link>

          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <StickyNote className="h-8 w-8" />
            {nota.titolo}
          </h1>

          {/* Metadati */}
          <div className="flex flex-wrap gap-2 mb-4">
            {nota.priorita && (
              <Badge className={getPriorityColor(nota.priorita)}>
                {priorityOptions.find((p) => p.value === nota.priorita)?.label || nota.priorita}
              </Badge>
            )}

            {nota.notifica ? (
              <Badge
                variant="outline"
                className={
                  isNotificationExpired(nota.notifica) ? "text-red-600 border-red-300" : "text-blue-600 border-blue-300"
                }
              >
                <Bell className="h-3 w-3 mr-1" />
                {isNotificationExpired(nota.notifica) ? "Notifica scaduta" : "Notifica attiva"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <BellOff className="h-3 w-3 mr-1" />
                Nessuna notifica
              </Badge>
            )}

            {nota.tags && nota.tags.length > 0 && (
              <Badge variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {nota.tags.length} tag{nota.tags.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            {nota.creato_il && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Creata: {formatDate(nota.creato_il)}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Modificata: {formatDate(nota.modifica)}
            </div>
            {nota.notifica && (
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-1" />
                Notifica: {formatDate(nota.notifica)}
              </div>
            )}
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-2">
          <Link href={`/note/${nota.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. La nota "{nota.titolo}" verrà eliminata permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? "Eliminazione..." : "Elimina"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Contenuto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Contenuto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-gray-800">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-gray-700">{children}</h3>,
                p: ({ children }) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-600">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-600">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-3">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-3 text-sm">{children}</pre>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {nota.contenuto}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {nota.tags && nota.tags.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {nota.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informazioni di sistema */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informazioni di sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID:</span>
              <span className="ml-2 text-gray-600">{nota.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sincronizzata:</span>
              <span className="ml-2 text-gray-600">{nota.synced ? "Sì" : "No"}</span>
            </div>
            {nota.notebook_id && (
              <div>
                <span className="font-medium text-gray-700">Notebook ID:</span>
                <span className="ml-2 text-gray-600">{nota.notebook_id}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
