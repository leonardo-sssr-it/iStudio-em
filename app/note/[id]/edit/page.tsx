"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, XCircle } from "lucide-react"
import Link from "next/link"
import { NoteForm } from "@/components/note/note-form"
import type { Nota } from "@/lib/services/note-service"

export default function EditNotaPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState<Nota | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const id = Array.isArray(params.id) ? params.id[0] : params.id

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

  // Salva le modifiche
  const handleSave = async (formData: Partial<Nota>) => {
    if (!nota?.id || !user?.id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("note")
        .update({
          ...formData,
          modifica: new Date().toISOString(),
        })
        .eq("id", nota.id)
        .eq("id_utente", user.id)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Nota aggiornata con successo",
      })

      router.push(`/note/${nota.id}`)
    } catch (err: any) {
      console.error("Errore nel salvataggio della nota:", err)
      toast({
        title: "Errore",
        description: `Impossibile salvare la nota: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-8 w-1/2" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
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
              {error || "La nota richiesta non esiste o non hai i permessi per modificarla"}
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
        <div>
          <Link href={`/note/${nota.id}`}>
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla nota
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Modifica Nota</h1>
          <p className="text-gray-600 mt-1">Modifica i dettagli della nota "{nota.titolo}"</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Dettagli Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoteForm
            initialData={nota}
            onSubmit={handleSave}
            submitLabel={saving ? "Salvando..." : "Salva Modifiche"}
            isSubmitting={saving}
          />
        </CardContent>
      </Card>
    </div>
  )
}
