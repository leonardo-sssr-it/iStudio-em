"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { User, Mail, Calendar, Shield } from "lucide-react"

interface UserData {
  id: string
  email: string
  nome?: string
  cognome?: string
  ruolo?: string
  attivo: boolean
  created_at: string
  last_sign_in_at?: string
  avatar_url?: string
}

export default function UserProfile() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setError("Utente non autenticato")
        return
      }

      const { data, error } = await supabase.from("utenti").select("*").eq("id", authUser.id).single()

      if (error) throw error

      setUser(data)
      setFormData({
        nome: data.nome || "",
        cognome: data.cognome || "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento profilo")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("utenti")
        .update({
          nome: formData.nome,
          cognome: formData.cognome,
        })
        .eq("id", user.id)

      if (error) throw error

      await fetchUserProfile()
      setEditMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: user?.nome || "",
      cognome: user?.cognome || "",
    })
    setEditMode(false)
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

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Profilo utente non trovato</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profilo Utente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {user.nome?.[0]}
                {user.cognome?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {user.nome && user.cognome ? `${user.nome} ${user.cognome}` : "Nome non specificato"}
              </h3>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant={user.ruolo === "admin" ? "default" : "secondary"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.ruolo || "utente"}
                </Badge>
                <Badge variant={user.attivo ? "default" : "destructive"}>
                  {user.attivo ? "Attivo" : "Disattivato"}
                </Badge>
              </div>
            </div>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cognome">Cognome</Label>
                  <Input
                    id="cognome"
                    value={formData.cognome}
                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvataggio..." : "Salva"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Annulla
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm text-muted-foreground">{user.nome || "Non specificato"}</p>
                </div>
                <div>
                  <Label>Cognome</Label>
                  <p className="text-sm text-muted-foreground">{user.cognome || "Non specificato"}</p>
                </div>
              </div>
              <Button onClick={() => setEditMode(true)}>Modifica Profilo</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informazioni Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Data Registrazione</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString("it-IT", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <Label>Ultimo Accesso</Label>
            <p className="text-sm text-muted-foreground">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString("it-IT", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Mai"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
