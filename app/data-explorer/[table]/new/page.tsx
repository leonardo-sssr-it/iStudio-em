"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { TagInput } from "@/components/ui/tag-input"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: "📅" },
  { id: "attivita", label: "Attività", icon: "📋" },
  { id: "scadenze", label: "Scadenze", icon: "⏰" },
  { id: "todolist", label: "To-Do List", icon: "✓" },
  { id: "note", label: "Note", icon: "📄" },
  { id: "progetti", label: "Progetti", icon: "📊" },
  { id: "clienti", label: "Clienti", icon: "👥" },
  { id: "pagine", label: "Pagine", icon: "📄" },
]

// Funzione per pulire i dati prima del salvataggio
function cleanDataForSave(data: any, readOnlyFields: string[] = []): any {
  const cleaned = { ...data }

  // Rimuovi campi di sola lettura per i nuovi elementi
  readOnlyFields.forEach((field) => {
    if (field !== "id_utente") {
      delete cleaned[field]
    }
  })

  // Pulisci tutti i campi
  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key]

    if (value === undefined || value === "undefined") {
      delete cleaned[key]
      return
    }

    if (typeof value === "string" && value.trim() === "") {
      cleaned[key] = null
    }

    if (typeof value === "number" && isNaN(value)) {
      delete cleaned[key]
    }
  })

  return cleaned
}

// Configurazione dei campi per tabella
const TABLE_FIELDS = {
  appuntamenti: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      attivo: true,
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      note: "text",
      luogo: "string",
      tags: "tags",
      attivo: "boolean",
      id_utente: "number",
      id_pro: "number",
      id_att: "number",
      id_cli: "number",
      data_creazione: "datetime",
      modifica: "datetime",
      notifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "pianificato", label: "Pianificato" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "annullato", label: "Annullato" },
      ],
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
    },
  },
  attivita: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "da_fare",
      priorita: 3,
      attivo: true,
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      priorita: "number",
      note: "text",
      luogo: "text",
      tags: "tags",
      attivo: "boolean",
      id_utente: "number",
      id_pro: "number",
      id_app: "number",
      id_cli: "number",
      data_creazione: "datetime",
      modifica: "datetime",
      notifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "da_fare", label: "Da fare" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "sospeso", label: "Sospeso" },
      ],
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      priorita: { min: 1, max: 5 },
    },
  },
  scadenze: {
    requiredFields: ["titolo", "scadenza"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      stato: "attivo",
      priorita: 3,
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "datetime",
      stato: "select",
      priorita: "number",
      note: "text",
      tags: "tags",
      privato: "boolean",
      id_utente: "number",
      id_pro: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "attivo", label: "Attivo" },
        { value: "completato", label: "Completato" },
        { value: "scaduto", label: "Scaduto" },
      ],
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      priorita: { min: 1, max: 5 },
    },
  },
  todolist: {
    requiredFields: ["titolo", "descrizione"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      completato: false,
      priorita: 3,
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "number",
      scadenza: "datetime",
      tags: "tags",
      stato: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      descrizione: { minLength: 3, maxLength: 500 },
      priorita: { min: 1, max: 5 },
    },
  },
  note: {
    requiredFields: ["titolo", "contenuto"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      priorita: 3,
    },
    types: {
      id: "number",
      titolo: "string",
      contenuto: "text",
      priorita: "number",
      tags: "tags",
      notebook_id: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
      synced: "boolean",
      notifica: "datetime",
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      descrizione: { minLength: 3, maxLength: 500 },
      priorita: { min: 1, max: 5 },
    },
  },
  progetti: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      attivo: true,
      avanzamento: 0,
      colore: "#3B82F6",
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      stato: "select",
      priorita: "number",
      colore: "color",
      gruppo: "string",
      budget: "number",
      data_inizio: "datetime",
      data_fine: "datetime",
      tags: "tags",
      colore: "string",
      avanzamento: "number",
      note: "text",
      allegati: "text",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
      notifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "pianificato", label: "Pianificato" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "sospeso", label: "Sospeso" },
      ],
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      avanzamento: { min: 0, max: 100 },
      budget: { min: 0 },
    },
  },
  clienti: {
    requiredFields: ["nome", "cognome", "email"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      attivo: true,
    },
    types: {
      id: "number",
      nome: "string",
      cognome: "string",
      email: "email",
      telefono: "tel",
      citta: "string",
      indirizzo: "string",
      cap: "string",
      rappresentante: "boolean", 
      societa: "text",
      indirizzosocieta: "text",
      cittasocieta: "text",
      partitaiva: "string",
      codicefiscale: "string",
      recapiti: "text",
      note: "text",
      attivo: "boolean",
      qr: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    validation: {
      nome: { minLength: 2, maxLength: 50 },
      cognome: { minLength: 2, maxLength: 50 },
      email: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
      telefono: { pattern: "^[+]?[0-9\\s-()]+$" },
      cap: { pattern: "^[0-9]{5}$" },
      partitaiva: { pattern: "^[0-9]{11}$" },
      codicefiscale: { pattern: "^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$" },
    },
  },
  pagine: {
    requiredFields: ["titolo", "slug"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      stato: "bozza",
      privato: false,
      attivo: true,
    },
    types: {
      id: "number",
      titolo: "string",
      slug: "string",
      contenuto: "richtext",
      stato: "select",
      privato: "boolean",
      attivo: "boolean",
      meta_title: "string",
      meta_description: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "bozza", label: "Bozza" },
        { value: "pubblicato", label: "Pubblicato" },
        { value: "archiviato", label: "Archiviato" },
      ],
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      slug: { pattern: "^[a-z0-9-]+$", minLength: 3, maxLength: 100 },
      meta_title: { maxLength: 60 },
      meta_description: { maxLength: 160 },
    },
  },
}

// Componente per il color picker
const ColorPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <Input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:w-20 h-10 p-1 cursor-pointer"
      />
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="w-full sm:flex-1"
        pattern="^#[0-9A-Fa-f]{6}$"
      />
    </div>
  )
}

// Componente principale
export default function NewItemPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estrai il nome della tabella
  const tableName = Array.isArray(params.table) ? params.table[0] : params.table

  // Verifica che la tabella sia valida
  const isValidTable = AVAILABLE_TABLES.some((table) => table.id === tableName)

  // Ottieni la configurazione della tabella
  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const requiredFields = tableConfig?.requiredFields || []
  const autoFields = tableConfig?.autoFields || []
  const defaultValues = tableConfig?.defaultValues || {}
  const fieldTypes = tableConfig?.types || {}
  const selectOptions = tableConfig?.selectOptions || {}
  const validation = tableConfig?.validation || {}

  // Inizializza i dati del form
  useEffect(() => {
    if (tableConfig && user) {
      const initialData = {
        ...defaultValues,
        id_utente: user.id,
      }

      // Imposta valori di default specifici per tabella
      if (tableName === "todolist") {
        initialData.titolo = ""
        initialData.descrizione = ""
        initialData.completato = false
        initialData.priorita = 3
      }

      setFormData(initialData)
    }
  }, [tableConfig, user, tableName])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    console.log(`Campo ${field} cambiato:`, value) // Debug

    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value }

      // Preimposta data_fine se data_inizio cambia e data_fine è vuota
      if (field === "data_inizio" && value && !newData.data_fine) {
        try {
          const startDate = new Date(value)
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // Aggiungi 1 ora
            const year = endDate.getFullYear()
            const month = String(endDate.getMonth() + 1).padStart(2, "0")
            const day = String(endDate.getDate()).padStart(2, "0")
            const hour = String(endDate.getHours()).padStart(2, "0")
            const minute = String(endDate.getMinutes()).padStart(2, "0")

            newData.data_fine = `${year}-${month}-${day}T${hour}:${minute}:00`
          }
        } catch (e) {
          console.warn("Data inizio non valida per calcolare data fine:", value)
        }
      }

      return newData
    })

    // Rimuovi l'errore quando il campo viene modificato
    if (errors[field]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }

    // Validazione in tempo reale per alcuni campi
    validateField(field, value)
  }

  // Valida un singolo campo
  const validateField = (field: string, value: any): boolean => {
    const rules = validation[field]
    if (!rules) return true

    let error = ""

    // Validazione lunghezza minima
    if (rules.minLength && (!value || value.length < rules.minLength)) {
      error = `Minimo ${rules.minLength} caratteri`
    }

    // Validazione lunghezza massima
    if (rules.maxLength && value && value.length > rules.maxLength) {
      error = `Massimo ${rules.maxLength} caratteri`
    }

    // Validazione valore minimo
    if (rules.min !== undefined && value < rules.min) {
      error = `Valore minimo: ${rules.min}`
    }

    // Validazione valore massimo
    if (rules.max !== undefined && value > rules.max) {
      error = `Valore massimo: ${rules.max}`
    }

    // Validazione pattern
    if (rules.pattern && value) {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(value)) {
        error = getPatternErrorMessage(field, fieldTypes[field])
      }
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }))
      return false
    }

    return true
  }

  // Ottieni il messaggio di errore per il pattern
  const getPatternErrorMessage = (field: string, type: string): string => {
    switch (type) {
      case "email":
        return "Email non valida"
      case "tel":
        return "Numero di telefono non valido"
      case "string":
        if (field === "slug") return "Solo lettere minuscole, numeri e trattini"
        if (field === "cap") return "CAP deve essere di 5 cifre"
        if (field === "piva") return "P.IVA deve essere di 11 cifre"
        if (field === "codfisc") return "Codice fiscale non valido"
        return "Formato non valido"
      default:
        return "Formato non valido"
    }
  }

  // Valida tutti i campi
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Controlla i campi richiesti
    requiredFields.forEach((field) => {
      if (!formData[field] || (typeof formData[field] === "string" && !formData[field].trim())) {
        newErrors[field] = "Campo obbligatorio"
      }
    })

    // Valida tutti i campi con regole
    Object.keys(formData).forEach((field) => {
      if (!autoFields.includes(field) && !validateField(field, formData[field])) {
        // L'errore è già stato impostato da validateField
      }
    })

    // Validazioni speciali
    if (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti") {
      if (formData.data_fine && formData.data_inizio && new Date(formData.data_fine) < new Date(formData.data_inizio)) {
        newErrors.data_fine = "La data di fine deve essere successiva alla data di inizio"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Salva il nuovo elemento
  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id || !isValidTable) return

    // Valida il form
    if (!validateForm()) {
      toast({
        title: "Errore di validazione",
        description: "Controlla i campi evidenziati in rosso",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Prepara i dati da salvare usando la funzione di pulizia
      const dataToSave = cleanDataForSave(formData, autoFields)

      // Aggiorna i campi di sistema
      dataToSave.id_utente = user.id
      dataToSave.data_creazione = new Date().toISOString()
      dataToSave.modifica = new Date().toISOString()

      console.log(`Inserimento nuovo elemento in tabella: ${tableName}`, dataToSave)

      // Inserisci nel database
      const { data, error } = await supabase.from(tableName).insert(dataToSave).select()

      if (error) {
        console.error("Errore inserimento:", error)

        // Gestisci errori specifici del database
        let errorMessage = error.message
        if (error.message.includes("check constraint")) {
          if (error.message.includes("descrizione_check")) {
            errorMessage =
              "La descrizione non rispetta i requisiti del database. Assicurati che sia compilata correttamente."
          }
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Elemento creato con successo!",
        description: "Il nuovo elemento è stato salvato nel database",
        action: (
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Creato</span>
          </div>
        ),
      })

      // Reindirizza alla pagina di dettaglio
      router.push(`/data-explorer/${tableName}/${data[0].id}`)
    } catch (error: any) {
      console.error(`Errore nell'inserimento:`, error)
      toast({
        title: "Errore durante il salvataggio",
        description: `Impossibile creare l'elemento: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Renderizza un campo in base al tipo
  const renderField = (field: string, type: string) => {
    // Salta i campi auto-generati
    if (autoFields.includes(field)) return null

    const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
    const value = formData[field]
    const error = errors[field]
    const isRequired = requiredFields.includes(field)

    console.log(`Rendering field ${field} of type ${type} with value:`, value) // Debug

    const fieldWrapper = (children: React.ReactNode) => (
      <div className="space-y-2" key={field}>
        <Label htmlFor={field} className="flex items-center">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {children}
        {error && (
          <div className="flex items-center text-sm text-red-500">
            <AlertCircle size={14} className="mr-1" />
            {error}
          </div>
        )}
      </div>
    )

    switch (type) {
      case "text":
      case "richtext":
        return fieldWrapper(
          <Textarea
            id={field}
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={cn(error && "border-red-500")}
            rows={type === "richtext" ? 8 : 4}
            placeholder={`Inserisci ${label.toLowerCase()}`}
          />,
        )

      case "boolean":
        return fieldWrapper(
          <div className="flex items-center space-x-2">
            <Switch
              id={field}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
            />
            <Label htmlFor={field} className="font-normal cursor-pointer">
              {value ? "Sì" : "No"}
            </Label>
          </div>,
        )

      case "datetime":
        console.log(`Rendering datetime field ${field}`) // Debug
        return fieldWrapper(
          <EnhancedDatePicker
            id={field}
            value={value || ""}
            onChange={(val) => {
              console.log(`EnhancedDatePicker onChange for ${field}:`, val) // Debug
              handleFieldChange(field, val)
            }}
            placeholder={`Seleziona ${label.toLowerCase()}`}
            className={cn(error && "border-red-500")}
            showTimeSelect={true}
          />,
        )

      case "number":
        const validationRules = validation[field] || {}
        return fieldWrapper(
          <Input
            id={field}
            type="number"
            value={value || ""}
            onChange={(e) => {
              const numValue = e.target.value ? Number(e.target.value) : null
              handleFieldChange(field, numValue)
            }}
            className={cn(error && "border-red-500")}
            min={validationRules.min}
            max={validationRules.max}
            placeholder={`Inserisci ${label.toLowerCase()}`}
          />,
        )

      case "select":
        const options = selectOptions[field] || []
        return fieldWrapper(
          <Select value={value || ""} onValueChange={(val) => handleFieldChange(field, val)}>
            <SelectTrigger className={cn(error && "border-red-500")}>
              <SelectValue placeholder={`Seleziona ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>,
        )

      case "color":
        return fieldWrapper(<ColorPicker value={value || ""} onChange={(val) => handleFieldChange(field, val)} />)

      case "tags":
        return fieldWrapper(
          <TagInput
            id={field}
            value={value || []}
            onChange={(val) => handleFieldChange(field, val)}
            placeholder={`Aggiungi ${label.toLowerCase()}`}
          />,
        )

      case "email":
        return fieldWrapper(
          <Input
            id={field}
            type="email"
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={cn(error && "border-red-500")}
            placeholder="esempio@email.com"
          />,
        )

      case "tel":
        return fieldWrapper(
          <Input
            id={field}
            type="tel"
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={cn(error && "border-red-500")}
            placeholder="+39 123 456 7890"
          />,
        )

      default:
        return fieldWrapper(
          <Input
            id={field}
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={cn(error && "border-red-500")}
            placeholder={`Inserisci ${label.toLowerCase()}`}
          />,
        )
    }
  }

  // Ottieni il titolo della tabella
  const getTableTitle = () => {
    const table = AVAILABLE_TABLES.find((t) => t.id === tableName)
    return table ? table.label : "Nuovo elemento"
  }

  // Se la tabella non è valida, mostra errore
  if (tableName && !isValidTable) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Errore</CardTitle>
            <CardDescription>La tabella "{tableName}" non è disponibile o non esiste.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/data-explorer")}>
              <ArrowLeft size={16} className="mr-2" /> Torna alla lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Pulsante torna indietro sempre in alto */}
            <Button variant="ghost" onClick={() => router.push(`/data-explorer`)} className="w-fit">
              <ArrowLeft size={16} className="mr-2" /> Torna alla lista
            </Button>

            {/* Titolo e descrizione */}
            <div>
              <CardTitle className="text-xl sm:text-2xl">Nuovo {getTableTitle().slice(0, -1)}</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Compila i campi per creare un nuovo elemento
              </CardDescription>
            </div>

            {/* Pulsanti di azione */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto order-1 sm:order-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-2" />
                    Crea e Salva
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/data-explorer`)}
                className="w-full sm:w-auto order-2 sm:order-2"
              >
                <X size={16} className="mr-2" /> Annulla
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Debug info */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <strong>Debug:</strong> Tabella: {tableName}, Campi: {Object.keys(fieldTypes).length}
          </div>

          {/* Renderizza i campi in base alla configurazione della tabella */}
          <div className="space-y-6">
            {Object.keys(fieldTypes)
              .filter((field) => !autoFields.includes(field))
              .map((field) => {
                const fieldType = fieldTypes[field]
                console.log(`Mapping field ${field} with type ${fieldType}`) // Debug
                return <div key={field}>{renderField(field, fieldType)}</div>
              })}
          </div>

          {/* Mostra informazioni sui campi auto-compilati */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campi compilati automaticamente:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {autoFields.map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span>
                    I campi con <span className="text-red-500 mx-1">*</span> sono obbligatori
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>

        <CardFooter className="border-t bg-gray-50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full text-sm text-gray-600 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span>
                I campi contrassegnati con <span className="text-red-500 mx-1">*</span> sono obbligatori
              </span>
            </div>
            <div className="text-xs text-muted-foreground">iStudio v0.4 - Sistema di gestione dati</div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
