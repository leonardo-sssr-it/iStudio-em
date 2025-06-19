"use server"

import { NoteService, type NotaInsert, type NotaUpdate } from "@/lib/services/note-service"
import { revalidatePath } from "next/cache"

/**
 * Crea una nuova nota
 */
export async function createNota(nota: NotaInsert) {
  const result = await NoteService.createNota(nota)

  if (result.data) {
    revalidatePath("/note")
    revalidatePath(`/note/${result.data.id}`)
  }

  return result
}

/**
 * Aggiorna una nota esistente
 */
export async function updateNota(id: number | string, nota: NotaUpdate, userId: string) {
  const result = await NoteService.updateNota(id, nota, userId)

  if (result.data) {
    revalidatePath("/note")
    revalidatePath(`/note/${id}`)
  }

  return result
}

/**
 * Elimina una nota
 */
export async function deleteNota(id: number | string, userId: string) {
  const result = await NoteService.deleteNota(id, userId)

  if (result.success) {
    revalidatePath("/note")
  }

  return result
}

/**
 * Ottiene una nota per ID
 */
export async function getNotaById(id: number | string, userId: string) {
  return await NoteService.getNotaById(id, userId)
}

/**
 * Ottiene tutte le note con filtri
 */
export async function getNote(params: {
  userId: string
  priorita?: string
  searchTerm?: string
  hasNotifica?: boolean
  sortField?: string
  sortDirection?: "asc" | "desc"
  limit?: number
  offset?: number
}) {
  const {
    userId,
    priorita,
    searchTerm,
    hasNotifica,
    sortField = "modifica",
    sortDirection = "desc",
    limit,
    offset,
  } = params

  return await NoteService.getNote(
    {
      id_utente: userId,
      priorita,
      searchTerm,
      hasNotifica,
    },
    { field: sortField as any, direction: sortDirection },
    limit,
    offset,
  )
}

/**
 * Ottiene le priorità distinte
 */
export async function getPriorita(userId: string) {
  return await NoteService.getPriorita(userId)
}
