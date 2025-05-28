"use client"

import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { toast } from "@/components/ui/use-toast"
import { createSupabaseQuery } from "@/lib/supabase-helpers"

// Tipo per gli utenti
export interface UserType {
  id: string
  nome: string
  cognome: string
  email: string
  username?: string
  display_name?: string
  ruolo?: string
}

/**
 * Hook personalizzato per recuperare e gestire gli utenti
 * @returns Stato e funzioni per la gestione degli utenti
 */
export function useUsers() {
  const { supabase, isConnected } = useSupabase()
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Funzione per recuperare gli utenti
  const fetchUsers = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false)
      setError(new Error("Client Supabase non disponibile"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Tentativo di recupero utenti dalla tabella 'utenti'...")

      // Utilizziamo la funzione helper per creare la query
      const { data, error } = await createSupabaseQuery(supabase, "utenti").order("cognome")

      if (error) {
        console.error("Errore nel recupero dalla tabella utenti:", error)
        throw error
      }

      if (data && data.length > 0) {
        console.log(`Utenti trovati nella tabella utenti:`, data.length)

        // Mappa i dati nel formato atteso
        const userData = data.map((user: any) => ({
          id: user.id || "",
          nome: user.nome || "",
          cognome: user.cognome || "",
          email: user.email || "",
          username: user.username || "",
          // Creiamo display_name concatenando cognome e nome
          display_name: `${user.cognome || ""} ${user.nome || ""}`.trim(),
          ruolo: user.ruolo || "",
        }))

        setUsers(userData)
      } else {
        console.log("Nessun utente trovato nella tabella utenti")
        setUsers([])

        toast({
          title: "Attenzione",
          description: "Nessun utente trovato nella tabella 'utenti'.",
        })
      }
    } catch (error) {
      console.error("Errore nel recupero degli utenti:", error)
      setError(error instanceof Error ? error : new Error("Errore sconosciuto"))

      toast({
        title: "Errore",
        description: "Impossibile recuperare la lista degli utenti dalla tabella 'utenti'",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  // Carica gli utenti quando il componente viene montato
  useEffect(() => {
    if (isConnected) {
      fetchUsers()
    } else {
      setUsers([])
      setIsLoading(false)
    }
  }, [isConnected, fetchUsers])

  return {
    users,
    isLoading,
    error,
    fetchUsers,
  }
}
