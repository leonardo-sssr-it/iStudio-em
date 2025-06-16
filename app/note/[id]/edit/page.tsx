"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { NotaForm } from "@/components/note/note-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
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

  // Salva la nota
  const handleSave = async (notaData: any) => {
    if (!supabase || !user?.id || !nota?.id) return null

    try {
      const { data, error } = await supabase
        .from("note")
        .update({
          ...notaData,
          modifica: new Date().toISOString(),
        })
        .eq("id", nota.id)
        .eq("id_utente", user.id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (err: any) {
      console.error("Errore nel salvataggio della nota:", err)
      throw err
    }
  }

  // Elimina la nota
  const handleDelete = async (id: number) => {
    if (!supabase || !user?.id) return false

    try {
      const { error } = await supabase.from("note").delete().eq("id", id).eq("id_utente", user.id)

      if (error) throw error

      return true
    } catch (err: any) {
      console.error("Errore nell'eliminazione della nota:", err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
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
              <Link href="/note">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alle note
                </Button>
              </Link>
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
      <NotaForm nota={nota} onSave={handleSave} onDelete={handleDelete} isNew={false} />
    </div>
  )
}
