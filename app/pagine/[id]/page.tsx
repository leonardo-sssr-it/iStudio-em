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
import { ArrowLeft, Edit, Calendar, User, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import type { Pagina } from "@/lib/services/pagine-service"

export default function PaginaDetailPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState<Pagina | null>(null)
  const [autore, setAutore] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  // Carica la pagina
  useEffect(() => {
    async function loadPagina() {
      if (!supabase || !id) return

      setLoading(true)
      setError(null)

      try {
        // Carica la pagina
        const { data: paginaData, error: paginaError } = await supabase.from("pagine").select("*").eq("id", id).single()

        if (paginaError) throw paginaError

        // Verifica permessi: deve essere pubblica o dell'utente corrente
        if (paginaData.privato && paginaData.id_utente !== user?.id) {
          throw new Error("Non hai i permessi per visualizzare questa pagina")
        }

        setPagina(paginaData)

        // Carica il nome dell'autore se necessario
        if (paginaData.id_utente !== user?.id) {
          const { data: userData, error: userError } = await supabase
            .from("utenti")
            .select("username, nome, cognome")
            .eq("id", paginaData.id_utente)
            .single()

          if (!userError && userData) {
            setAutore(userData.username || `${userData.nome} ${userData.cognome}`.trim())
          }
        }
      } catch (err: any) {
        console.error("Errore nel caricamento della pagina:", err)
        setError(err.message)
        toast({
          title: "Errore",
          description: `Impossibile caricare la pagina: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPagina()
  }, [supabase, id, user?.id])

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

  // Verifica se l'utente può modificare la pagina
  const canEdit = user?.id && pagina?.id_utente === user.id

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !pagina) {
    return (
      <div className="container mx-auto py-6">
        <Link href="/pagine">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle pagine
          </Button>
        </Link>

        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Pagina non trovata</h3>
            <p className="text-gray-500 mb-4">
              {error || "La pagina richiesta non esiste o non hai i permessi per visualizzarla"}
            </p>
            <Button onClick={() => router.push("/pagine")}>Torna alle pagine</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Navigazione */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/pagine">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle pagine
          </Button>
        </Link>

        {canEdit && (
          <Button onClick={() => router.push(`/pagine/${pagina.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        )}
      </div>

      {/* Contenuto principale */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-4">{pagina.titolo}</CardTitle>

              {/* Badge di stato */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center">
                  {pagina.attivo ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Attivo
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Non attivo
                    </Badge>
                  )}
                </div>

                {pagina.categoria && <Badge variant="outline">{pagina.categoria}</Badge>}

                {pagina.privato && <Badge variant="secondary">Privato</Badge>}
              </div>

              {/* Estratto */}
              {pagina.estratto && <p className="text-lg text-gray-600 mb-4">{pagina.estratto}</p>}
            </div>
          </div>

          {/* Metadati */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t pt-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Pubblicato: {formatDate(pagina.pubblicato)}
            </div>

            {autore && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Autore: {autore}
              </div>
            )}

            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Modificato: {formatDate(pagina.modifica)}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Immagine */}
          {pagina.immagine && (
            <div className="mb-6">
              <img
                src={pagina.immagine || "/placeholder.svg"}
                alt={pagina.titolo}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          )}

          {/* Contenuto */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap">{pagina.contenuto}</div>
          </div>

          {/* Tags */}
          {pagina.tags && Array.isArray(pagina.tags) && pagina.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {pagina.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
