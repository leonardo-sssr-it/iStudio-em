"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, UserCheck, UserX } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface User {
  id: string
  email: string
  nome?: string
  cognome?: string
  ruolo?: string
  attivo: boolean
  created_at: string
  last_sign_in_at?: string
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("utenti").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento utenti")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("utenti").update({ attivo: !currentStatus }).eq("id", userId)

      if (error) throw error
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nell'aggiornamento")
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) return

    try {
      const { error } = await supabase.from("utenti").delete().eq("id", userId)

      if (error) throw error
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nell'eliminazione")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">Errore: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Utenti</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Ultimo Accesso</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.nome && user.cognome ? `${user.nome} ${user.cognome}` : "Non specificato"}</TableCell>
                <TableCell>
                  <Badge variant={user.ruolo === "admin" ? "default" : "secondary"}>{user.ruolo || "utente"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.attivo ? "default" : "destructive"}>
                    {user.attivo ? "Attivo" : "Disattivato"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("it-IT") : "Mai"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleUserStatus(user.id, user.attivo)}>
                      {user.attivo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && <div className="text-center py-8 text-muted-foreground">Nessun utente trovato</div>}
      </CardContent>
    </Card>
  )
}
