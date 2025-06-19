"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { NoteForm } from "@/components/note/note-form"
import type { Nota } from "@/lib/services/note-service"

export default function NewNotaPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()

  const [creating, setCreating] = useState(false)

  // Crea una nuova nota
  const handleCreate = async (formData: Partial<Nota>) => {
    if (!user?.id) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from("note")
        .insert({
          ...formData,
          id_utente: user.id,
          creato_il: new Date().toISOString(),
          modifica: new Date().toISOString(),
          synced: false,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Successo",
        description: "Nota creata con successo",
      })

      router.push(`/note/${data.id}`)
    } catch (err: any) {
      console.error("Errore nella creazione della nota:", err)
      toast({
        title: "Errore",
        description: `Impossibile creare la nota: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link href="/note">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle note
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Nuova Nota</h1>
          <p className="text-gray-600 mt-1">Crea una nuova nota per organizzare le tue idee</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Dettagli Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NoteForm
            onSubmit={handleCreate}
            submitLabel={creating ? "Creando..." : "Crea Nota"}
            isSubmitting={creating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
