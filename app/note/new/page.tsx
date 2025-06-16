"use client"

import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { NotaForm } from "@/components/note/note-form"

export default function NewNotaPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()

  // Crea una nuova nota
  const handleSave = async (notaData: any) => {
    if (!supabase || !user?.id) return null

    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("note")
        .insert({
          ...notaData,
          id_utente: user.id,
          creato_il: now,
          modifica: now,
          synced: false,
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (err: any) {
      console.error("Errore nella creazione della nota:", err)
      throw err
    }
  }

  return (
    <div className="container mx-auto py-6">
      <NotaForm onSave={handleSave} isNew={true} />
    </div>
  )
}
