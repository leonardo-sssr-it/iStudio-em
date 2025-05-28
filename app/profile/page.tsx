"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Save, User, Building, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Funzione di validazione per i campi del profilo
function validateProfileField(field: string, value: string): { valid: boolean; message?: string } {
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
  }
  return { valid: true }
}

// Funzione per formattare le date in formato italiano
function formatDateIT(dateString: string | null | undefined): string {
  if (!dateString) return "Non disponibile"
  try {
    return new Date(dateString).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Errore nella formattazione della data:", error)
    return "Data non valida"
  }
}

export default function ProfilePage() {
  const { user, refreshUser, hashPassword } = useAuth()
  const { supabase } = useSupabase()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  // Stati per la gestione della password
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Campi che non possono essere modificati dall'utente
  const readOnlyFields = ["id", "username", "ruolo", "ultimo_accesso", "data_creazione", "attivo"]

  // Inizializza il form con i dati dell'utente
  useEffect(() => {
    if (user && !isInitialized) {
      const initialData: Record<string, any> = {}

      // Copia tutti i campi dell'utente tranne quelli di sola lettura
      Object.entries(user).forEach(([key, value]) => {
        if (!readOnlyFields.includes(key)) {
          // Filtra URL blob non validi per il campo immagine
          if (key === "immagine" && value && typeof value === "string" && value.includes("blob:")) {
            initialData[key] = "" // Reset blob URLs non validi
          } else {
            initialData[key] = value !== null ? value : ""
          }
        }
      })

      setFormData(initialData)
      setAvailableFields(Object.keys(initialData))
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [user, isInitialized])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validazione in tempo reale
    const validation = validateProfileField(name, value)
    if (!validation.valid) {
      setFormErrors((prev) => ({ ...prev, [name]: validation.message || "Campo non valido" }))
    } else {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validazione della password
  const validatePassword = (pass: string): boolean => {
    // Verifica lunghezza minima
    if (pass.length < 8) {
      setPasswordError("La password deve essere lunga almeno 8 caratteri")
      return false
    }

    // Verifica presenza di almeno una lettera maiuscola
    if (!/[A-Z]/.test(pass)) {
      setPasswordError("La password deve contenere almeno una lettera maiuscola")
      return false
    }

    // Verifica presenza di almeno una lettera minuscola
    if (!/[a-z]/.test(pass)) {
      setPasswordError("La password deve contenere almeno una lettera minuscola")
      return false
    }

    // Verifica presenza di almeno una cifra
    if (!/[0-9]/.test(pass)) {
      setPasswordError("La password deve contenere almeno una cifra")
      return false
    }

    // Se tutte le verifiche sono passate
    setPasswordError(null)
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    if (newPassword) {
      validatePassword(newPassword)
    } else {
      setPasswordError(null)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
  }

  const validateForm = (): boolean => {
    let isValid = true
    const errors: Record<string, string> = {}

    // Valida tutti i campi disponibili
    availableFields.forEach((field) => {
      if (formData[field] !== undefined && !readOnlyFields.includes(field)) {
        const validation = validateProfileField(field, formData[field])
        if (!validation.valid) {
          errors[field] = validation.message || "Campo non valido"
          isValid = false
        }
      }
    })

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase || !user) return

    // Validazione del form
    if (!validateForm()) {
      toast({
        title: "Errore di validazione",
        description: "Alcuni campi contengono errori. Correggi prima di procedere.",
        variant: "destructive",
      })
      return
    }

    // Verifica se è stata inserita una nuova password
    if (password) {
      // Verifica che le password corrispondano
      if (password !== confirmPassword) {
        toast({
          title: "Errore",
          description: "Le password non corrispondono",
          variant: "destructive",
        })
        return
      }

      // Valida la password
      if (!validatePassword(password)) {
        toast({
          title: "Errore",
          description: passwordError || "La password non soddisfa i requisiti di sicurezza",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Prepara i dati da aggiornare (solo i campi modificabili)
      const updateData: Record<string, any> = {}

      availableFields.forEach((field) => {
        if (formData[field] !== undefined && !readOnlyFields.includes(field)) {
          updateData[field] = formData[field]
        }
      })

      // Aggiungi la password hashata se è stata modificata
      if (password) {
        updateData.password = await hashPassword(password)
      }

      // Aggiungi sempre la data di modifica (anche se non è nei campi del form)
      updateData.modifica = new Date().toISOString()

      // Aggiorna i dati dell'utente
      const { error } = await supabase.from("utenti").update(updateData).eq("id", user.id)

      if (error) {
        console.error("Errore Supabase:", error)
        throw error
      }

      // Aggiorna i dati dell'utente nel contesto
      await refreshUser()

      toast({
        title: "Profilo aggiornato",
        description: "Le tue informazioni sono state aggiornate con successo",
      })

      // Reindirizza alla dashboard dopo il salvataggio
      router.push("/dashboard")
    } catch (error) {
      console.error("Errore nell'aggiornamento del profilo:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento del profilo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Formatta l'etichetta del campo
  const formatFieldLabel = (field: string) => {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Contenuto della pagina
  const content = (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profilo Utente</h1>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alla Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifica Profilo</CardTitle>
          <CardDescription>Aggiorna le tue informazioni personali e aziendali</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
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
                  <TabsTrigger value="other" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Altre Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  {/* Riga 1: Nome - Cognome (50% - 50%) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={formData.nome || ""}
                        onChange={handleChange}
                        placeholder="Inserisci nome"
                        className={formErrors.nome ? "border-red-500" : ""}
                      />
                      {formErrors.nome && <p className="text-sm text-red-500">{formErrors.nome}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cognome">Cognome</Label>
                      <Input
                        id="cognome"
                        name="cognome"
                        value={formData.cognome || ""}
                        onChange={handleChange}
                        placeholder="Inserisci cognome"
                        className={formErrors.cognome ? "border-red-500" : ""}
                      />
                      {formErrors.cognome && <p className="text-sm text-red-500">{formErrors.cognome}</p>}
                    </div>
                  </div>

                  {/* Riga 2: Città - CAP (75% - 25%) */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="citta">Città</Label>
                      <Input
                        id="citta"
                        name="citta"
                        value={formData.citta || ""}
                        onChange={handleChange}
                        placeholder="Inserisci città"
                        className={formErrors.citta ? "border-red-500" : ""}
                      />
                      {formErrors.citta && <p className="text-sm text-red-500">{formErrors.citta}</p>}
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="cap">CAP</Label>
                      <Input
                        id="cap"
                        name="cap"
                        value={formData.cap || ""}
                        onChange={handleChange}
                        placeholder="CAP"
                        className={formErrors.cap ? "border-red-500" : ""}
                      />
                      {formErrors.cap && <p className="text-sm text-red-500">{formErrors.cap}</p>}
                    </div>
                  </div>

                  {/* Riga 3: Indirizzo (100%) */}
                  <div className="space-y-2">
                    <Label htmlFor="indirizzo">Indirizzo</Label>
                    <Input
                      id="indirizzo"
                      name="indirizzo"
                      value={formData.indirizzo || ""}
                      onChange={handleChange}
                      placeholder="Inserisci indirizzo completo"
                      className={formErrors.indirizzo ? "border-red-500" : ""}
                    />
                    {formErrors.indirizzo && <p className="text-sm text-red-500">{formErrors.indirizzo}</p>}
                  </div>

                  {/* Riga 4: Email - Telefono (50% - 50%) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="Inserisci email"
                        className={formErrors.email ? "border-red-500" : ""}
                      />
                      {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Telefono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        value={formData.telefono || ""}
                        onChange={handleChange}
                        placeholder="Inserisci telefono"
                        className={formErrors.telefono ? "border-red-500" : ""}
                      />
                      {formErrors.telefono && <p className="text-sm text-red-500">{formErrors.telefono}</p>}
                    </div>
                  </div>

                  {/* Riga 5: Bio (100%) */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      name="bio"
                      value={formData.bio || ""}
                      onChange={handleChange}
                      placeholder="Inserisci una breve biografia"
                      className={formErrors.bio ? "border-red-500" : ""}
                    />
                    {formErrors.bio && <p className="text-sm text-red-500">{formErrors.bio}</p>}
                  </div>

                  {/* Riga 6: Note (100%) */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Input
                      id="note"
                      name="note"
                      value={formData.note || ""}
                      onChange={handleChange}
                      placeholder="Inserisci note personali"
                      className={formErrors.note ? "border-red-500" : ""}
                    />
                    {formErrors.note && <p className="text-sm text-red-500">{formErrors.note}</p>}
                  </div>
                </TabsContent>

                <TabsContent value="company" className="space-y-4 mt-4">
                  {/* Riga 1: Nome Studio (100%) */}
                  <div className="space-y-2">
                    <Label htmlFor="nomestudio">Nome Studio</Label>
                    <Input
                      id="nomestudio"
                      name="nomestudio"
                      value={formData.nomestudio || ""}
                      onChange={handleChange}
                      placeholder="Inserisci nome studio"
                      className={formErrors.nomestudio ? "border-red-500" : ""}
                    />
                    {formErrors.nomestudio && <p className="text-sm text-red-500">{formErrors.nomestudio}</p>}
                  </div>

                  {/* Riga 2: Codice Fiscale - P.IVA (60% - 40%) */}
                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="codfisc">Codice Fiscale</Label>
                      <Input
                        id="codfisc"
                        name="codfisc"
                        value={formData.codfisc || ""}
                        onChange={handleChange}
                        placeholder="Inserisci codice fiscale"
                        className={formErrors.codfisc ? "border-red-500" : ""}
                      />
                      {formErrors.codfisc && <p className="text-sm text-red-500">{formErrors.codfisc}</p>}
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="piva">P.IVA</Label>
                      <Input
                        id="piva"
                        name="piva"
                        value={formData.piva || ""}
                        onChange={handleChange}
                        placeholder="Inserisci P.IVA"
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
                        name="sede"
                        value={formData.sede || ""}
                        onChange={handleChange}
                        placeholder="Inserisci sede"
                        className={formErrors.sede ? "border-red-500" : ""}
                      />
                      {formErrors.sede && <p className="text-sm text-red-500">{formErrors.sede}</p>}
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="pec">PEC</Label>
                      <Input
                        id="pec"
                        name="pec"
                        type="email"
                        value={formData.pec || ""}
                        onChange={handleChange}
                        placeholder="Inserisci PEC"
                        className={formErrors.pec ? "border-red-500" : ""}
                      />
                      {formErrors.pec && <p className="text-sm text-red-500">{formErrors.pec}</p>}
                    </div>
                  </div>

                  {/* Riga 4: Recapiti - Orari (50% - 50%) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recapiti">Recapiti</Label>
                      <Input
                        id="recapiti"
                        name="recapiti"
                        value={formData.recapiti || ""}
                        onChange={handleChange}
                        placeholder="Inserisci recapiti"
                        className={formErrors.recapiti ? "border-red-500" : ""}
                      />
                      {formErrors.recapiti && <p className="text-sm text-red-500">{formErrors.recapiti}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orari">Orari</Label>
                      <Input
                        id="orari"
                        name="orari"
                        value={formData.orari || ""}
                        onChange={handleChange}
                        placeholder="Inserisci orari"
                        className={formErrors.orari ? "border-red-500" : ""}
                      />
                      {formErrors.orari && <p className="text-sm text-red-500">{formErrors.orari}</p>}
                    </div>
                  </div>

                  {/* Riga 5: Note Studio (100%) */}
                  <div className="space-y-2">
                    <Label htmlFor="notestudio">Note Studio</Label>
                    <Input
                      id="notestudio"
                      name="notestudio"
                      value={formData.notestudio || ""}
                      onChange={handleChange}
                      placeholder="Inserisci note studio"
                      className={formErrors.notestudio ? "border-red-500" : ""}
                    />
                    {formErrors.notestudio && <p className="text-sm text-red-500">{formErrors.notestudio}</p>}
                  </div>
                </TabsContent>

                <TabsContent value="other" className="space-y-4 mt-4">
                  {/* Campi di sola lettura */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-700">Informazioni di Sistema</h3>

                    {/* Riga 1: ID - Username - Attivo */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>ID Utente</Label>
                        <Input value={user?.id || ""} readOnly className="bg-gray-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={user?.username || ""} readOnly className="bg-gray-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Stato Account</Label>
                        <Input value={user?.attivo ? "Attivo" : "Disattivato"} readOnly className="bg-gray-100" />
                      </div>
                    </div>

                    {/* Riga 2: Data Creazione - Ultimo Accesso - Ultima Modifica */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Data Creazione</Label>
                        <Input value={formatDateIT(user?.data_creazione)} readOnly className="bg-gray-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ultimo Accesso</Label>
                        <Input value={formatDateIT(user?.ultimo_accesso)} readOnly className="bg-gray-100" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ultima Modifica</Label>
                        <Input value={formatDateIT(user?.modifica)} readOnly className="bg-gray-100" />
                      </div>
                    </div>
                  </div>

                  {/* Immagine Profilo */}
                  <div className="space-y-2">
                    <Label htmlFor="immagine">Immagine Profilo (URL)</Label>
                    <Input
                      id="immagine"
                      name="immagine"
                      type="url"
                      value={formData.immagine || ""}
                      onChange={handleChange}
                      placeholder="Inserisci URL immagine profilo (es: https://example.com/image.jpg)"
                      className={formErrors.immagine ? "border-red-500" : ""}
                    />
                    {formErrors.immagine && <p className="text-sm text-red-500">{formErrors.immagine}</p>}

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
                  </div>

                  {/* Sezione Password */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Modifica Password</h3>

                    {/* Campi password affiancati */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Nuova Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Inserisci nuova password"
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
                        <Label htmlFor="confirmPassword">Conferma Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            placeholder="Conferma nuova password"
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
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          {/* Footer del form con pulsante visibile */}
          <CardFooter className="flex justify-end pt-6 bg-white border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salva Modifiche
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )

  // Utilizziamo ProtectedRoute senza adminOnly=true
  return <ProtectedRoute>{content}</ProtectedRoute>
}
