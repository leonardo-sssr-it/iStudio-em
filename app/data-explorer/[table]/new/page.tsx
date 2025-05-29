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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, X, Calendar, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: "📅" },
  { id: "attivita", label: "Attività", icon: "📋" },
  { id: "scadenze", label: "Scadenze", icon: "⏰" },
  { id: "todolist", label: "To-Do List", icon: "✓" },
  { id: "progetti", label: "Progetti", icon: "📊" },
  { id: "clienti", label: "Clienti", icon: "👥" },
  { id: "pagine", label: "Pagine", icon: "📄" },
]

// Estendi la configurazione dei campi con più dettagli
const TABLE_FIELDS = {
  appuntamenti: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      priorita: 3,
      attivo: true,
    },
    fieldOrder: ["titolo", "descrizione", "data_inizio", "data_fine", "stato", "priorita", "luogo", "note", "tags"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      priorita: "number",
      note: "text",
      luogo: "string",
      tags: "json",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
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
      priorita: { min: 1, max: 5 },
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
    fieldOrder: ["titolo", "descrizione", "data_inizio", "data_fine", "stato", "priorita", "note"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      priorita: "number",
      note: "text",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
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
    requiredFields: ["titolo", "data_scadenza"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      stato: "attivo",
      priorita: 3,
    },
    fieldOrder: ["titolo", "descrizione", "data_scadenza", "stato", "priorita", "note"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_scadenza: "datetime",
      stato: "select",
      priorita: "number",
      note: "text",
      id_utente: "number",
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
    requiredFields: ["titolo"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      completato: false,
      priorita: 3,
    },
    fieldOrder: ["titolo", "descrizione", "data_scadenza", "priorita", "completato", "note"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "number",
      data_scadenza: "datetime",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      priorita: { min: 1, max: 5 },
    },
  },
  progetti: {
    requiredFields: ["nome", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      attivo: true,
      avanzamento: 0,
      colore: "#3B82F6",
    },
    fieldOrder: [
      "nome",
      "descrizione",
      "stato",
      "colore",
      "gruppo",
      "budget",
      "data_inizio",
      "data_fine",
      "avanzamento",
      "note",
    ],
    types: {
      id: "number",
      nome: "string",
      descrizione: "text",
      stato: "select",
      colore: "color",
      gruppo: "string",
      budget: "number",
      data_inizio: "datetime",
      data_fine: "datetime",
      avanzamento: "number",
      note: "text",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
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
      nome: { minLength: 3, maxLength: 100 },
      avanzamento: { min: 0, max: 100 },
      budget: { min: 0 },
    },
  },
  clienti: {
    requiredFields: ["nome", "cognome"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      attivo: true,
    },
    fieldOrder: ["nome", "cognome", "email", "telefono", "citta", "indirizzo", "cap", "piva", "codfisc", "note"],
    types: {
      id: "number",
      nome: "string",
      cognome: "string",
      email: "email",
      telefono: "tel",
      citta: "string",
      indirizzo: "string",
      cap: "string",
      piva: "string",
      codfisc: "string",
      note: "text",
      attivo: "boolean",
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
      piva: { pattern: "^[0-9]{11}$" },
      codfisc: { pattern: "^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$" },
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
    fieldOrder: ["titolo", "slug", "contenuto", "stato", "privato", "meta_title", "meta_description"],
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

// Componente per l'editor JSON
const JsonEditor = ({ value, onChange }: { value: any; onChange: (value: any) => void }) => {
  const [jsonString, setJsonString] = useState(JSON.stringify(value || [], null, 2))
  const [error, setError] = useState<string | null>(null)

  const handleChange = (newValue: string) => {
    setJsonString(newValue)
    try {
      const parsed = JSON.parse(newValue)
      onChange(parsed)
      setError(null)
    } catch (e) {
      setError("JSON non valido")
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={jsonString}
        onChange={(e) => handleChange(e.target.value)}
        className={cn("font-mono text-xs sm:text-sm", error && "border-red-500")}
        rows={4}
      />
      {error && (
        <div className="flex items-center text-sm text-red-500">
          <AlertCircle size={16} className="mr-1 flex-shrink-0" />
          {error}
        </div>
      )}
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
  const [activeTab, setActiveTab] = useState("principale")

  // Estrai il nome della tabella
  const tableName = Array.isArray(params.table) ? params.table[0] : params.table

  // Verifica che la tabella sia valida
  const isValidTable = AVAILABLE_TABLES.some((table) => table.id === tableName)

  // Ottieni la configurazione della tabella
  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const requiredFields = tableConfig?.requiredFields || []
  const autoFields = tableConfig?.autoFields || []
  const defaultValues = tableConfig?.defaultValues || {}
  const fieldOrder = tableConfig?.fieldOrder || []
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
      setFormData(initialData)
    }
  }, [tableConfig, user])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))

    // Rimuovi l'errore quando il campo viene modificato
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
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
      // Prepara i dati da salvare
      const dataToSave = {
        ...formData,
        id_utente: user.id,
        data_creazione: new Date().toISOString(),
        modifica: new Date().toISOString(),
      }

      // Rimuovi i campi vuoti o undefined
      Object.keys(dataToSave).forEach((key) => {
        if (dataToSave[key] === "" || dataToSave[key] === undefined) {
          delete dataToSave[key]
        }
      })

      console.log(`Inserimento nuovo elemento in tabella: ${tableName}`, dataToSave)

      // Inserisci nel database
      const { data, error } = await supabase.from(tableName).insert(dataToSave).select()

      if (error) {
        console.error("Errore inserimento:", error)
        throw error
      }

      toast({
        title: "Elemento creato",
        description: "Il nuovo elemento è stato creato con successo",
      })

      // Reindirizza alla pagina di dettaglio
      router.push(`/data-explorer/${tableName}/${data[0].id}`)
    } catch (error: any) {
      console.error(`Errore nell'inserimento:`, error)
      toast({
        title: "Errore",
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
        return fieldWrapper(
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              id={field}
              type="datetime-local"
              value={value ? new Date(value).toISOString().slice(0, 16) : ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={cn("w-full sm:flex-1", error && "border-red-500")}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleFieldChange(field, new Date().toISOString())}
              className="w-full sm:w-auto"
            >
              <Calendar size={16} />
              <span className="ml-2 sm:hidden">Ora</span>
            </Button>
          </div>,
        )

      case "number":
        const validationRules = validation[field] || {}
        return fieldWrapper(
          <Input
            id={field}
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value ? Number(e.target.value) : "")}
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

      case "json":
        return fieldWrapper(<JsonEditor value={value} onChange={(val) => handleFieldChange(field, val)} />)

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

  // Organizza i campi in gruppi per i tab
  const organizeFieldsInGroups = () => {
    const groups: Record<string, string[]> = {
      principale: [],
      dettagli: [],
      avanzate: [],
    }

    // Distribuisci i campi nei gruppi
    fieldOrder.forEach((field, index) => {
      if (autoFields.includes(field)) return

      if (index < 4) {
        groups.principale.push(field)
      } else if (index < 8) {
        groups.dettagli.push(field)
      } else {
        groups.avanzate.push(field)
      }
    })

    // Rimuovi gruppi vuoti
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key]
      }
    })

    return groups
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

  const fieldGroups = organizeFieldsInGroups()
  const hasMultipleGroups = Object.keys(fieldGroups).length > 1

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

            {/* Pulsanti di azione - stack su mobile, inline su desktop */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto order-1 sm:order-1">
                {saving ? "Salvataggio..." : "Crea elemento"}
                {!saving && <Save size={16} className="ml-2" />}
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
          {hasMultipleGroups ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 w-full flex-col sm:flex-row h-auto sm:h-10">
                {Object.keys(fieldGroups).map((group) => (
                  <TabsTrigger key={group} value={group} className="capitalize w-full sm:w-auto">
                    {group}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(fieldGroups).map(([group, fields]) => (
                <TabsContent key={group} value={group} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {fields.map((field) => (
                      <div
                        key={field}
                        className={cn(
                          fieldTypes[field] === "text" ||
                            fieldTypes[field] === "richtext" ||
                            fieldTypes[field] === "json"
                            ? "lg:col-span-2"
                            : "lg:col-span-1",
                        )}
                      >
                        {renderField(field, fieldTypes[field] || "string")}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {fieldOrder.map((field) => (
                <div
                  key={field}
                  className={cn(
                    fieldTypes[field] === "text" || fieldTypes[field] === "richtext" || fieldTypes[field] === "json"
                      ? "lg:col-span-2"
                      : "lg:col-span-1",
                  )}
                >
                  {renderField(field, fieldTypes[field] || "string")}
                </div>
              ))}
            </div>
          )}

          {/* Mostra informazioni sui campi auto-compilati */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Campi compilati automaticamente:</h4>
            <div className="flex flex-wrap gap-2">
              {autoFields.map((field) => (
                <Badge key={field} variant="secondary">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t bg-gray-50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-600 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span>
                I campi contrassegnati con <span className="text-red-500 mx-1">*</span> sono obbligatori
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
