"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  Building,
  AlertCircle,
  X,
  UserCog,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateIT } from "@/lib/date-utils"

// Funzione di validazione per i campi utente
function validateUserField(field: string, value: string): { valid: boolean; message?: string } {
  switch (field) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { valid: false, message: "Formato email non valido" }
      }
      break
    case "telefono":
      const phoneRegex = /^[0-9+\s()-]{8,15}$/
      if (value && !phoneRegex.test(value)) {
        return { valid: false, message: "Formato telefono non valido" }
      }
      break
    case "codfisc":
      const cfRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i
      if (value && !cfRegex.test(value)) {
        return { valid: false, message: "Formato codice fiscale non valido" }
      }
      break
    case "cap":
      const capRegex = /^\d{5}$/
      if (value && !capRegex.test(value)) {
        return { valid: false, message: "Il CAP deve essere di 5 cifre" }
      }
      break
    case "piva":
      const pivaRegex = /^\d{11}$/
      if (value && !pivaRegex.test(value)) {
        return { valid: false, message: "La partita IVA deve essere di 11 cifre" }
      }
      break
    case "immagine":
      if (value) {
        try {
          new URL(value)
          // Verifica che sia un URL di immagine valido
          const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
          const hasValidExtension = imageExtensions.some(
            (ext) => value.toLowerCase().includes(ext) || value.includes("placeholder.svg"),
          )
          if (!hasValidExtension && !value.includes("http")) {
            return { valid: false, message: "URL immagine non valido" }
          }
        } catch {
          return { valid: false, message: "URL non valido" }
        }
      }
      break
    case "username":
      if (value.length < 3) {
        return { valid: false, message: "Username deve contenere almeno 3 caratteri" }
      }
      break
  }
  return { valid: true }
}

// Validazione della password
function validatePassword(pass: string): { valid: boolean; message?: string } {
  // Verifica lunghezza minima
  if (pass.length < 8) {
    return { valid: false, message: "La password deve essere lunga almeno 8 caratteri" }
  }

  // Verifica presenza di almeno una lettera maiuscola
  if (!/[A-Z]/.test(pass)) {
    return { valid: false, message: "La password deve contenere almeno una lettera maiuscola" }
  }

  // Verifica presenza di almeno una lettera minuscola
  if (!/[a-z]/.test(pass)) {
    return { valid: false, message: "La password deve contenere almeno una lettera minuscola" }
  }

  // Verifica presenza di almeno una cifra
  if (!/[0-9]/.test(pass)) {
    return { valid: false, message: "La password deve contenere almeno una cifra" }
  }

  // Se tutte le verifiche sono passate
  return { valid: true }
}

export default function AdminUsersPage() {
  const { supabase } = useSupabase()
  const { user, hashPassword } = useAuth()
  const router = useRouter()

  // Stati per la gestione della lista utenti
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Stati per la gestione del singolo utente
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  // Stati per la gestione della password
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Stato per i ruoli disponibili
  const [availableRoles, setAvailableRoles] = useState<any[]>([])

  // Campi che non possono essere modificati dall'admin
  const readOnlyFields = ["id", "data_creazione", "modifica", "ultimo_accesso"]

  // Campi obbligatori
  const requiredFields = ["username", "email", "ruolo", "attivo"]

  // Carica i ruoli disponibili dalla configurazione
  const loadRoles = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase.from("configurazione").select("ruoli").single()

      if (error) {
        console.warn("Errore nel caricamento dei ruoli dalla configurazione:", error)
        // Usa ruoli predefiniti
        setAvailableRoles([
          { value: "admin", name: "Amministratore" },
          { value: "user", name: "Utente" },
          { value: "editor", name: "Editor" },
        ])
        return
      }

      if (data?.ruoli) {
        let rolesArray = []

        // Gestisci diversi formati possibili del campo ruoli
        if (Array.isArray(data.ruoli)) {
          // Se è un array di oggetti con value e name
          if (data.ruoli.length > 0 && typeof data.ruoli[0] === "object" && data.ruoli[0].value) {
            rolesArray = data.ruoli
          } else {
            // Se è un array di stringhe, convertilo
            rolesArray = data.ruoli.map((role: string) => ({ value: role, name: role }))
          }
        } else if (typeof data.ruoli === "object") {
          // Se è un oggetto, convertilo in array
          rolesArray = Object.entries(data.ruoli).map(([key, value]) => ({
            value: key,
            name: String(typeof value === "string" ? value : key),
          }))
        } else if (typeof data.ruoli === "string") {
          // Se è una stringa JSON, prova a parsarla
          try {
            const parsed = JSON.parse(data.ruoli)
            if (Array.isArray(parsed)) {
              rolesArray = parsed.map((role: any) => (typeof role === "object" ? role : { value: role, name: role }))
            } else if (typeof parsed === "object") {
              rolesArray = Object.entries(parsed).map(([key, value]) => ({
                value: key,
                name: typeof value === "string" ? value : key,
              }))
            }
          } catch (parseError) {
            console.warn("Errore nel parsing dei ruoli:", parseError)
          }
        }

        // Se non ci sono ruoli definiti o il parsing è fallito, usa un set predefinito
        if (rolesArray.length === 0) {
          rolesArray = [
            { value: "admin", name: "Amministratore" },
            { value: "user", name: "Utente" },
            { value: "editor", name: "Editor" },
          ]
        }

        console.log("Ruoli caricati:", rolesArray)
        setAvailableRoles(rolesArray)
      } else {
        // Ruoli predefiniti se non ci sono configurazioni
        setAvailableRoles([
          { value: "admin", name: "Amministratore" },
          { value: "user", name: "Utente" },
          { value: "editor", name: "Editor" },
        ])
      }
    } catch (error) {
      console.error("Errore nel caricamento dei ruoli:", error)
      // Fallback ai ruoli predefiniti
      setAvailableRoles([
        { value: "admin", name: "Amministratore" },
        { value: "user", name: "Utente" },
        { value: "editor", name: "Editor" },
      ])
    }
  }, [supabase])

  // Carica gli utenti
  const loadUsers = useCallback(
    async (page = 0, search = "") => {
      if (!supabase) return

      setLoading(true)
      try {
        let query = supabase
          .from("utenti")
          .select("*", { count: "exact" })
          .order("id", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        // Applica filtri di ricerca se presenti
        if (search) {
          query = query.or(
            `username.ilike.%${search}%,nome.ilike.%${search}%,cognome.ilike.%${search}%,email.ilike.%${search}%,citta.ilike.%${search}%`,
          )
        }

        const { data, error, count } = await query

        if (error) throw error

        setUsers(data || [])
        setTotalUsers(count || 0)
        setCurrentPage(page)
      } catch (error) {
        console.error("Errore nel caricamento degli utenti:", error)
        toast({
          title: "Errore",
          description: "Impossibile caricare la lista degli utenti",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setIsSearching(false)
      }
    },
    [supabase, pageSize],
  )

  // Carica un singolo utente
  const loadUser = useCallback(
    async (userId: number) => {
      if (!supabase) return

      setLoading(true)
      try {
        const { data, error } = await supabase.from("utenti").select("*").eq("id", userId).single()

        if (error) throw error

        setSelectedUser(data)
        setFormData(data)
        setActiveTab("personal")
      } catch (error) {
        console.error("Errore nel caricamento dell'utente:", error)
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati dell'utente",
          variant: "destructive",
        })
        setSelectedUser(null)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  // Inizializzazione
  useEffect(() => {
    if (supabase) {
      loadRoles()
      loadUsers()
    }
  }, [supabase, loadRoles, loadUsers])

  // Gestione del cambio pagina
  const handlePageChange = (newPage: number) => {
    loadUsers(newPage, searchTerm)
  }

  // Gestione della ricerca
  const handleSearch = () => {
    setIsSearching(true)
    loadUsers(0, searchTerm)
  }

  // Gestione del cambio di un campo del form
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Validazione in tempo reale
    if (typeof value === "string") {
      const validation = validateUserField(field, value)
      if (!validation.valid) {
        setFormErrors((prev) => ({ ...prev, [field]: validation.message || "Campo non valido" }))
      } else {
        setFormErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }
  }

  // Gestione del cambio password
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    if (newPassword) {
      const validation = validatePassword(newPassword)
      setPasswordError(validation.valid ? null : validation.message)
    } else {
      setPasswordError(null)
    }
  }

  // Validazione del form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    // Valida i campi obbligatori
    requiredFields.forEach((field) => {
      if (
        formData[field] === undefined ||
        formData[field] === null ||
        (typeof formData[field] === "string" && formData[field].trim() === "")
      ) {
        errors[field] = "Campo obbligatorio"
        isValid = false
      }
    })

    // Valida i campi con regole specifiche
    Object.keys(formData).forEach((field) => {
      if (formData[field] && typeof formData[field] === "string") {
        const validation = validateUserField(field, formData[field])
        if (!validation.valid) {
          errors[field] = validation.message || "Campo non valido"
          isValid = false
        }
      }
    })

    // Valida la password se è stata inserita
    if (password) {
      const validation = validatePassword(password)
      if (!validation.valid) {
        setPasswordError(validation.message)
        isValid = false
      } else if (password !== confirmPassword) {
        setPasswordError("Le password non corrispondono")
        isValid = false
      } else {
        setPasswordError(null)
      }
    }

    setFormErrors(errors)
    return isValid
  }

  // Salvataggio dell'utente
  const handleSave = async () => {
    if (!supabase || !validateForm()) {
      toast({
        title: "Errore di validazione",
        description: "Correggi gli errori evidenziati prima di salvare",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Prepara i dati da aggiornare
      const updateData: Record<string, any> = { ...formData }

      // Rimuovi i campi di sola lettura
      readOnlyFields.forEach((field) => {
        delete updateData[field]
      })

      // Aggiungi la password hashata se è stata modificata
      if (password) {
        updateData.password = await hashPassword(password)
      } else {
        delete updateData.password
      }

      // Aggiungi sempre la data di modifica
      updateData.modifica = new Date().toISOString()

      // Aggiorna i dati dell'utente
      const { error } = await supabase.from("utenti").update(updateData).eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "Utente aggiornato",
        description: "Le informazioni dell'utente sono state aggiornate con successo",
      })

      // Ricarica l'utente e la lista
      await loadUser(selectedUser.id)
      await loadUsers(currentPage, searchTerm)

      // Resetta lo stato di modifica
      setEditMode(false)
      setPassword("")
      setConfirmPassword("")
      setPasswordError(null)
    } catch (error: any) {
      console.error("Errore nell'aggiornamento dell'utente:", error)
      toast({
        title: "Errore",
        description: `Si è verificato un errore durante l'aggiornamento: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Eliminazione dell'utente
  const handleDelete = async () => {
    if (!supabase || !selectedUser) return

    setDeleting(true)
    try {
      const { error } = await supabase.from("utenti").delete().eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "Utente eliminato",
        description: "L'utente è stato eliminato con successo",
      })

      // Ricarica la lista e chiudi il dettaglio
      await loadUsers(currentPage, searchTerm)
      setSelectedUser(null)
      setFormData({})
    } catch (error: any) {
      console.error("Errore nell'eliminazione dell'utente:", error)
      toast({
        title: "Errore",
        description: `Si è verificato un errore durante l'eliminazione: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Creazione di un nuovo utente
  const handleCreateUser = () => {
    // Inizializza un nuovo utente vuoto
    const newUser = {
      username: "",
      email: "",
      ruolo: "user",
      attivo: true,
      data_creazione: new Date().toISOString(),
    }

    setSelectedUser(null) // Deseleziona l'utente corrente
    setFormData(newUser)
    setEditMode(true)
    setActiveTab("personal")
  }

  // Salvataggio di un nuovo utente
  const handleSaveNewUser = async () => {
    if (!supabase || !validateForm()) {
      toast({
        title: "Errore di validazione",
        description: "Correggi gli errori evidenziati prima di salvare",
        variant: "destructive",
      })
      return
    }

    // Verifica che la password sia stata inserita per un nuovo utente
    if (!password) {
      setPasswordError("La password è obbligatoria per un nuovo utente")
      return
    }

    setSaving(true)
    try {
      // Prepara i dati da inserire
      const insertData: Record<string, any> = { ...formData }

      // Rimuovi i campi di sola lettura
      readOnlyFields.forEach((field) => {
        delete insertData[field]
      })

      // Aggiungi la password hashata
      insertData.password = await hashPassword(password)

      // Aggiungi le date di creazione e modifica
      insertData.data_creazione = new Date().toISOString()
      insertData.modifica = new Date().toISOString()

      // Inserisci il nuovo utente
      const { data, error } = await supabase.from("utenti").insert(insertData).select()

      if (error) throw error

      toast({
        title: "Utente creato",
        description: "Il nuovo utente è stato creato con successo",
      })

      // Ricarica la lista e seleziona il nuovo utente
      await loadUsers(currentPage, searchTerm)
      if (data && data[0]) {
        await loadUser(data[0].id)
      }

      // Resetta lo stato di modifica
      setEditMode(false)
      setPassword("")
      setConfirmPassword("")
      setPasswordError(null)
    } catch (error: any) {
      console.error("Errore nella creazione dell'utente:", error)
      toast({
        title: "Errore",
        description: `Si è verificato un errore durante la creazione: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Annulla la modifica
  const handleCancelEdit = () => {
    if (selectedUser) {
      // Se stava modificando un utente esistente, ripristina i dati originali
      setFormData(selectedUser)
      setEditMode(false)
    } else {
      // Se stava creando un nuovo utente, torna alla lista
      setFormData({})
      setEditMode(false)
    }

    // Resetta gli stati della password
    setPassword("")
    setConfirmPassword("")
    setPasswordError(null)
    setFormErrors({})
  }

  // Renderizza la lista degli utenti
  const renderUsersList = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cerca utenti..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerca"}
            </Button>
          </div>

          <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Nuovo Utente
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ultimo Accesso</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <span className="mt-2 block text-sm text-muted-foreground">Caricamento utenti...</span>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <User className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Nessun utente trovato</p>
                          {searchTerm && (
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearchTerm("")
                                loadUsers(0, "")
                              }}
                            >
                              Cancella ricerca
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => loadUser(user.id)}
                      >
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {user.nome} {user.cognome}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.ruolo === "admin" ? "default" : "outline"}>
                            {(() => {
                              const roleObj = availableRoles.find((role) => role.value === user.ruolo)
                              return roleObj?.name || user.ruolo || "Non definito"
                            })()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.attivo ? "success" : "destructive"}>
                            {user.attivo ? "Attivo" : "Disattivato"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.ultimo_accesso ? formatDateIT(user.ultimo_accesso) : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              loadUser(user.id)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Visualizza</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {users.length} di {totalUsers} utenti
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || loading}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Pagina precedente</span>
              </Button>
              <div className="text-sm">
                Pagina {currentPage + 1} di {Math.max(1, Math.ceil(totalUsers / pageSize))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={(currentPage + 1) * pageSize >= totalUsers || loading}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">Pagina successiva</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Renderizza il dettaglio dell'utente
  const renderUserDetail = () => {
    const isNewUser = !selectedUser

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedUser(null)
              setFormData({})
              setEditMode(false)
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna alla lista
          </Button>

          <div className="flex gap-2">
            {!editMode ? (
              <>
                <Button onClick={() => setEditMode(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="mr-2 h-4 w-4" /> Modifica
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione non può essere annullata. L'utente verrà eliminato permanentemente dal database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminazione...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" /> Elimina
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  onClick={isNewUser ? handleSaveNewUser : handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Salva
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" /> Annulla
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isNewUser
                ? "Nuovo Utente"
                : `${formData.nome || ""} ${formData.cognome || ""} (${formData.username || ""})`}
            </CardTitle>
            <CardDescription>
              {isNewUser ? "Crea un nuovo utente nel sistema" : `ID: ${formData.id} - ${formData.email || ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Info Personali
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Info Aziendali
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Sistema
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                {/* Riga 1: Username - Email (50% - 50%) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className={formErrors.username ? "text-red-500" : ""}>
                      Username*
                    </Label>
                    <Input
                      id="username"
                      value={formData.username || ""}
                      onChange={(e) => handleFieldChange("username", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.username ? "border-red-500" : ""}
                    />
                    {formErrors.username && <p className="text-sm text-red-500">{formErrors.username}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={formErrors.email ? "text-red-500" : ""}>
                      Email*
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                  </div>
                </div>

                {/* Riga 2: Nome - Cognome (50% - 50%) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome || ""}
                      onChange={(e) => handleFieldChange("nome", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cognome">Cognome</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome || ""}
                      onChange={(e) => handleFieldChange("cognome", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {/* Riga 3: Città - CAP (75% - 25%) */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="citta">Città</Label>
                    <Input
                      id="citta"
                      value={formData.citta || ""}
                      onChange={(e) => handleFieldChange("citta", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="cap" className={formErrors.cap ? "text-red-500" : ""}>
                      CAP
                    </Label>
                    <Input
                      id="cap"
                      value={formData.cap || ""}
                      onChange={(e) => handleFieldChange("cap", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.cap ? "border-red-500" : ""}
                    />
                    {formErrors.cap && <p className="text-sm text-red-500">{formErrors.cap}</p>}
                  </div>
                </div>

                {/* Riga 4: Indirizzo (100%) */}
                <div className="space-y-2">
                  <Label htmlFor="indirizzo">Indirizzo</Label>
                  <Input
                    id="indirizzo"
                    value={formData.indirizzo || ""}
                    onChange={(e) => handleFieldChange("indirizzo", e.target.value)}
                    disabled={!editMode}
                  />
                </div>

                {/* Riga 5: Telefono - Immagine (50% - 50%) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono" className={formErrors.telefono ? "text-red-500" : ""}>
                      Telefono
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ""}
                      onChange={(e) => handleFieldChange("telefono", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.telefono ? "border-red-500" : ""}
                    />
                    {formErrors.telefono && <p className="text-sm text-red-500">{formErrors.telefono}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="immagine" className={formErrors.immagine ? "text-red-500" : ""}>
                      Immagine (URL)
                    </Label>
                    <Input
                      id="immagine"
                      value={formData.immagine || ""}
                      onChange={(e) => handleFieldChange("immagine", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.immagine ? "border-red-500" : ""}
                    />
                    {formErrors.immagine && <p className="text-sm text-red-500">{formErrors.immagine}</p>}
                  </div>
                </div>

                {/* Preview immagine */}
                {formData.immagine && !formErrors.immagine && (
                  <div className="mt-2">
                    <Label className="text-sm text-gray-600">Anteprima:</Label>
                    <div className="mt-1 w-20 h-20 border rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={formData.immagine || "/placeholder.svg"}
                        alt="Anteprima profilo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">Errore caricamento</div>'
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Riga 6: Bio (100%) */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                    disabled={!editMode}
                  />
                </div>

                {/* Riga 7: Note (100%) */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Input
                    id="note"
                    value={formData.note || ""}
                    onChange={(e) => handleFieldChange("note", e.target.value)}
                    disabled={!editMode}
                  />
                </div>
              </TabsContent>

              <TabsContent value="company" className="space-y-4 mt-4">
                {/* Riga 1: Nome Studio (100%) */}
                <div className="space-y-2">
                  <Label htmlFor="nomestudio">Nome Studio</Label>
                  <Input
                    id="nomestudio"
                    value={formData.nomestudio || ""}
                    onChange={(e) => handleFieldChange("nomestudio", e.target.value)}
                    disabled={!editMode}
                  />
                </div>

                {/* Riga 2: Codice Fiscale - P.IVA (60% - 40%) */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="codfisc" className={formErrors.codfisc ? "text-red-500" : ""}>
                      Codice Fiscale
                    </Label>
                    <Input
                      id="codfisc"
                      value={formData.codfisc || ""}
                      onChange={(e) => handleFieldChange("codfisc", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.codfisc ? "border-red-500" : ""}
                    />
                    {formErrors.codfisc && <p className="text-sm text-red-500">{formErrors.codfisc}</p>}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="piva" className={formErrors.piva ? "text-red-500" : ""}>
                      P.IVA
                    </Label>
                    <Input
                      id="piva"
                      value={formData.piva || ""}
                      onChange={(e) => handleFieldChange("piva", e.target.value)}
                      disabled={!editMode}
                      className={formErrors.piva ? "border-red-500" : ""}
                    />
                    {formErrors.piva && <p className="text-sm text-red-500">{formErrors.piva}</p>}
                  </div>
                </div>

                {/* Riga 3: Sede - PEC (60% - 40%) */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="sede">Sede</Label>
                    <Input
                      id="sede"
                      value={formData.sede || ""}
                      onChange={(e) => handleFieldChange("sede", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="pec">PEC</Label>
                    <Input
                      id="pec"
                      type="email"
                      value={formData.pec || ""}
                      onChange={(e) => handleFieldChange("pec", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {/* Riga 4: Recapiti - Orari (50% - 50%) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recapiti">Recapiti</Label>
                    <Input
                      id="recapiti"
                      value={formData.recapiti || ""}
                      onChange={(e) => handleFieldChange("recapiti", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orari">Orari</Label>
                    <Input
                      id="orari"
                      value={formData.orari || ""}
                      onChange={(e) => handleFieldChange("orari", e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {/* Riga 5: Note Studio (100%) */}
                <div className="space-y-2">
                  <Label htmlFor="notestudio">Note Studio</Label>
                  <Input
                    id="notestudio"
                    value={formData.notestudio || ""}
                    onChange={(e) => handleFieldChange("notestudio", e.target.value)}
                    disabled={!editMode}
                  />
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-4 mt-4">
                {/* Riga 1: Ruolo - Stato (50% - 50%) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruolo" className={formErrors.ruolo ? "text-red-500" : ""}>
                      Ruolo*
                    </Label>
                    <Select
                      value={formData.ruolo || ""}
                      onValueChange={(value) => {
                        console.log("Ruolo selezionato:", value)
                        handleFieldChange("ruolo", value)
                      }}
                      disabled={!editMode}
                    >
                      <SelectTrigger className={formErrors.ruolo ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleziona ruolo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.ruolo && <p className="text-sm text-red-500">{formErrors.ruolo}</p>}

                    {/* Debug info - rimuovi in produzione */}
                    {editMode && (
                      <div className="text-xs text-gray-500">
                        Debug: Ruolo attuale = "{formData.ruolo || "undefined"}", Ruoli disponibili ={" "}
                        {availableRoles.length}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attivo" className={formErrors.attivo ? "text-red-500" : ""}>
                      Stato*
                    </Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="attivo"
                        checked={formData.attivo || false}
                        onCheckedChange={(checked) => handleFieldChange("attivo", checked)}
                        disabled={!editMode}
                      />
                      <Label htmlFor="attivo" className="font-normal">
                        {formData.attivo ? "Attivo" : "Disattivato"}
                      </Label>
                    </div>
                    {formErrors.attivo && <p className="text-sm text-red-500">{formErrors.attivo}</p>}
                  </div>
                </div>

                {/* Cambia Password */}
                {editMode && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">{isNewUser ? "Imposta Password" : "Cambia Password"}</h3>

                    {/* Campi password affiancati */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">{isNewUser ? "Password*" : "Nuova Password"}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder={isNewUser ? "Inserisci password" : "Inserisci nuova password"}
                            aria-invalid={passwordError ? "true" : "false"}
                            aria-describedby={passwordError ? "password-error" : undefined}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? "Nascondi password" : "Mostra password"}</span>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          {isNewUser ? "Conferma Password*" : "Conferma Nuova Password"}
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Conferma password"
                            aria-invalid={password !== confirmPassword ? "true" : "false"}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Nascondi password" : "Mostra password"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">
                              {showConfirmPassword ? "Nascondi password" : "Mostra password"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {password && password !== confirmPassword && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Le password non corrispondono</AlertDescription>
                      </Alert>
                    )}

                    {passwordError && (
                      <Alert variant="destructive" id="password-error">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    <Alert>
                      <AlertDescription>
                        La password deve contenere almeno 8 caratteri, una lettera maiuscola, una lettera minuscola e
                        una cifra.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Informazioni di sistema (solo lettura) */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Informazioni di Sistema</h3>

                  {/* ID */}
                  {formData.id && (
                    <div className="space-y-2">
                      <Label>ID Utente</Label>
                      <Input value={formData.id} readOnly className="bg-gray-100" />
                    </div>
                  )}

                  {/* Date di sistema */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Creazione</Label>
                      <Input
                        value={formData.data_creazione ? formatDateIT(formData.data_creazione) : "-"}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ultimo Accesso</Label>
                      <Input
                        value={formData.ultimo_accesso ? formatDateIT(formData.ultimo_accesso) : "-"}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Ultima modifica */}
                  <div className="space-y-2">
                    <Label>Ultima Modifica</Label>
                    <Input
                      value={formData.modifica ? formatDateIT(formData.modifica) : "-"}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    console.log("Available roles:", availableRoles)
    console.log("Form data ruolo:", formData.ruolo)
    console.log("Selected user:", selectedUser)
  }, [availableRoles, formData.ruolo, selectedUser])

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestione Utenti</h1>
            <p className="text-muted-foreground">Visualizza, modifica e gestisci gli utenti del sistema</p>
          </div>
        </div>

        {selectedUser || editMode ? renderUserDetail() : renderUsersList()}
      </div>
    </ProtectedRoute>
  )
}
