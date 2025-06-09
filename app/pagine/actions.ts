"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const FormSchema = z.object({
  titolo: z.string().min(3, "Il titolo deve avere almeno 3 caratteri."),
  contenuto: z.string().min(10, "Il contenuto deve avere almeno 10 caratteri."),
  estratto: z.string().optional(),
  categoria: z.string().optional(),
  tags: z.string().optional(),
  immagine: z.string().url("URL immagine non valido.").optional().or(z.literal("")),
  attivo: z.boolean().default(true),
  privato: z.boolean().default(false),
})

export async function createPage(formData: FormData) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: "Utente non autenticato." }
  }

  const validatedFields = FormSchema.safeParse({
    titolo: formData.get("titolo"),
    contenuto: formData.get("contenuto"),
    estratto: formData.get("estratto"),
    categoria: formData.get("categoria"),
    tags: formData.get("tags"),
    immagine: formData.get("immagine"),
    attivo: formData.get("attivo") === "on",
    privato: formData.get("privato") === "on",
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Dati non validi.",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { tags, ...rest } = validatedFields.data
  let tagsJson = null
  if (tags) {
    try {
      tagsJson = tags.split(",").map((tag) => tag.trim())
    } catch (e) {
      return { success: false, message: "Formato tags non valido." }
    }
  }

  const { error } = await supabase.from("pagine").insert({
    ...rest,
    tags: tagsJson,
    id_utente: user.id,
  })

  if (error) {
    console.error("Errore creazione pagina:", error)
    return { success: false, message: `Errore database: ${error.message}` }
  }

  revalidatePath("/pagine")
  return { success: true, message: "Pagina creata con successo." }
}

export async function updatePageField(pageId: number, field: string, value: any) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Non autorizzato" }

  const { data: page, error: fetchError } = await supabase.from("pagine").select("id_utente").eq("id", pageId).single()
  if (fetchError || !page) return { success: false, message: "Pagina non trovata." }

  const userRoles = user.user_metadata.roles || []
  const canEdit = page.id_utente === user.id || userRoles.includes("admin") || userRoles.includes("editor")

  if (!canEdit) return { success: false, message: "Permessi insufficienti." }

  const { error } = await supabase
    .from("pagine")
    .update({ [field]: value, modifica: new Date().toISOString() })
    .eq("id", pageId)

  if (error) {
    console.error(`Errore aggiornamento campo ${field}:`, error)
    return { success: false, message: `Errore database: ${error.message}` }
  }

  revalidatePath(`/pagine/${pageId}`)
  return { success: true, message: "Campo aggiornato." }
}

export async function deletePage(pageId: number) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: "Non autorizzato" }

  const { data: page, error: fetchError } = await supabase.from("pagine").select("id_utente").eq("id", pageId).single()
  if (fetchError || !page) return { success: false, message: "Pagina non trovata." }

  const userRoles = user.user_metadata.roles || []
  const canDelete = page.id_utente === user.id || userRoles.includes("admin")

  if (!canDelete) return { success: false, message: "Permessi insufficienti per eliminare." }

  const { error } = await supabase.from("pagine").delete().eq("id", pageId)

  if (error) {
    console.error("Errore eliminazione pagina:", error)
    return { success: false, message: `Errore database: ${error.message}` }
  }

  revalidatePath("/pagine")
  return { success: true, message: "Pagina eliminata." }
}
