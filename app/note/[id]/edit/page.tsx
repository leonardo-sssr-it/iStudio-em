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
import { NotaForm } from "@/components/note/note-form"
import type { Nota } from "@/lib/services/note-service"

export default function EditNotaPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState<Nota | null>(null)
  const [error, setError] = useState<string | null>(null)

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  // Carica la nota
  useEffect(() => {
    async function loadNota() {
      if (!supabase || !id || !user?.id) {
        console.log("Missing dependencies:", { supabase: !!supabase, id, userId: user?.id })
        return
      }

      console.log("Loading nota with ID:", id)
      setLoading(true)
      setError(null)

      try {
        const { data: notaData, error: notaError } = await supabase
          .from("note")
          .select("*")
          .eq("id", id)
          .eq("id_utente", user.id)
          .single()

        console.log("Nota query result:", { data: notaData, error: notaError })

        if (notaError) {
          if (notaError.code === "PGRST116") {
            // Nota non trovata
            console.log("Nota not found, redirecting to not-found")
            router.push("/note/not-found")
            return
          }
          throw notaError
        }

        console.log("Nota loaded successfully:", notaData)
        setNota(notaData)
      } catch (err: any) {
        console.error("Error loading nota:", err)
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

  // Funzione per salvare la nota
  const handleSave = async (formData: Partial<Nota>) => {
    if (!nota?.id || !user?.id || !supabase) {
      console.error("Missing data for save:", { notaId: nota?.id, userId: user?.id, supabase: !!supabase })
      return null
    }

    console.log("Saving nota with data:", formData)

    try {
      const { data, error } = await supabase
        .from("note")
        .update({
          ...formData,
          modifica: new Date().toISOString(),
        })
        .eq("id", nota.id)
        .eq("id_utente", user.id)
        .select()
        .single()

      if (error) throw error

      console.log("Nota saved successfully:", data)

      toast({
        title: "Successo",
        description: "Nota aggiornata con successo",
      })

      return data
    } catch (err: any) {
      console.error("Error saving nota:", err)
      toast({
        title: "Errore",
        description: `Impossibile salvare la nota: ${err.message}`,
        variant: "destructive",
      })
      throw err
    }
  }

  // Funzione per eliminare la nota
  const handleDelete = async (id: number) => {
    if (!user?.id || !supabase) {
      console.error("Missing data for delete:", { userId: user?.id, supabase: !!supabase })
      return false
    }

    console.log("Deleting nota with ID:", id)

    try {
      const { error } = await supabase.from("note").delete().eq("id", id).eq("id_utente", user.id)

      if (error) throw error

      console.log("Nota deleted successfully")

      toast({
        title: "Successo",
        description: "Nota eliminata con successo",
      })

      return true
    } catch (err: any) {
      console.error("Error deleting nota:", err)
      toast({
        title: "Errore",
        description: `Impossibile eliminare la nota: ${err.message}`,
        variant: "destructive",
      })
      return false
    }
  }

  // Debug info
  console.log("EditNotaPage state:", {
    loading,
    nota: nota ? { id: nota.id, titolo: nota.titolo } : null,
    error,
    id,
    userId: user?.id,
    supabaseReady: !!supabase,
  })

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
          <NotaForm nota={nota} onSave={handleSave} onDelete={handleDelete} isNew={false} />
        </CardContent>
      </Card>
    </div>
  )
}
