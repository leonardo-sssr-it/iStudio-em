"use server"

import { PagineService, type PaginaInsert, type PaginaUpdate } from "@/lib/services/pagine-service"
import { revalidatePath } from "next/cache"

/**
 * Crea una nuova pagina
 */
export async function createPagina(pagina: PaginaInsert) {
  const result = await PagineService.createPagina(pagina)

  if (result.data) {
    revalidatePath("/pagine")
    revalidatePath(`/pagine/${result.data.id}`)
  }

  return result
}

/**
 * Aggiorna una pagina esistente
 */
export async function updatePagina(id: number | string, pagina: PaginaUpdate, userId?: number | string) {
  const result = await PagineService.updatePagina(id, pagina, userId)

  if (result.data) {
    revalidatePath("/pagine")
    revalidatePath(`/pagine/${id}`)
  }

  return result
}

/**
 * Elimina una pagina
 */
export async function deletePagina(id: number | string, userId?: number | string) {
  const result = await PagineService.deletePagina(id, userId)

  if (result.success) {
    revalidatePath("/pagine")
  }

  return result
}

/**
 * Cambia lo stato attivo di una pagina
 */
export async function togglePaginaStatus(id: number | string, attivo: boolean, userId?: number | string) {
  const result = await PagineService.togglePaginaStatus(id, attivo, userId)

  if (result.data) {
    revalidatePath("/pagine")
    revalidatePath(`/pagine/${id}`)
  }

  return result
}

/**
 * Ottiene una pagina per ID
 */
export async function getPaginaById(id: number | string, userId?: number | string) {
  return await PagineService.getPaginaById(id, userId)
}

/**
 * Ottiene tutte le pagine con filtri
 */
export async function getPagine(params: {
  userId?: number | string
  attivo?: boolean
  categoria?: string
  searchTerm?: string
  sortField?: string
  sortDirection?: "asc" | "desc"
  limit?: number
  offset?: number
}) {
  const {
    userId,
    attivo,
    categoria,
    searchTerm,
    sortField = "pubblicato",
    sortDirection = "desc",
    limit,
    offset,
  } = params

  return await PagineService.getPagine(
    {
      id_utente: userId ? Number(userId) : undefined,
      attivo,
      categoria,
      searchTerm,
    },
    { field: sortField as any, direction: sortDirection },
    limit,
    offset,
  )
}

/**
 * Ottiene le categorie distinte
 */
export async function getCategorie(userId?: number | string) {
  return await PagineService.getCategorie(userId)
}
