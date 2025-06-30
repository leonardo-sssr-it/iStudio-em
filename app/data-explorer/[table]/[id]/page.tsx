"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { formatDateDisplay } from "@/lib/date-utils"
import {
  CheckCircle2,
  FileText,
  Settings,
  Calendar,
  CheckSquare,
  Clock,
  ListTodo,
  Briefcase,
  Users,
  StickyNote,
  ArrowLeft,
  Save,
  Edit,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: Calendar },
  { id: "attivita", label: "Attività", icon: CheckSquare },
  { id: "scadenze", label: "Scadenze", icon: Clock },
  { id: "todolist", label: "To-Do List", icon: ListTodo },
  { id: "progetti", label: "Progetti", icon: Briefcase },
  { id: "clienti", label: "Clienti", icon: Users },
  { id: "pagine", label: "Pagine", icon: FileText },
  { id: "note", label: "Note", icon: StickyNote },
]

// Funzione per pulire i dati prima del salvataggio
function cleanDataForSave(data: any, readOnlyFields: string[] = []): any {
  const cleaned = { ...data }

  readOnlyFields.forEach((field) => {
    if (field !== "id_utente") {
      delete cleaned[field]
    }
  })

  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key]

    if (value === undefined) {
      delete cleaned[key]
      return
    }

    if (value === "undefined") {
      delete cleaned[key]
      return
    }

    if (typeof value === "string") {
      if (value.trim() === "") {
        cleaned[key] = null
      }
    }

    if (typeof value === "number" && isNaN(value)) {
      delete cleaned[key]
    }
  })

  return cleaned
}

// Configurazione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      attivo: true,
    },
    fieldGroups: {
      principale: {
        title: "Informazioni Principali",
        icon: FileText,
        fields: ["titolo", "descrizione", "stato"],
      },
      date: {
        title: "Date e Orari",
        icon: Calendar,
        fields: ["data_inizio", "data_fine"],
      },
      dettagli: {
        title: "Dettagli Aggiuntivi",
        icon: Settings,
        fields: ["luogo", "note", "tags"],
      },
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      priorita: "priority_select",
      note: "text",
      luogo: "string",
      tags: "tags",
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
      priorita: "priority_select",
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
    requiredFields: ["titolo", "scadenza"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      stato: "attivo",
      privato: false,
      attivo: true,
    },
    fieldOrder: ["titolo", "descrizione", "scadenza", "stato", "note"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "datetime",
      stato: "select",
      note: "text",
      privato: "boolean",
      attivo: "boolean",
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
    },
  },
  todolist: {
    requiredFields: ["titolo", "descrizione"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultValues: {
      completato: false,
      priorita: 3,
    },
    fieldOrder: ["titolo", "descrizione", "scadenza", "priorita", "completato", "note"],
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "priority_select",
      scadenza: "datetime",
      note: "text",
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
  progetti: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      attivo: true,
      avanzamento: 0,
      colore: "#3B82F6",
    },
    fieldOrder: [
      "titolo",
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
      titolo: "string",
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
      titolo: { minLength: 3, maxLength: 100 },
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
  note: {
    requiredFields: ["titolo", "contenuto"],
    autoFields: ["id", "data_creazione", "modifica", "id_utente"],
    defaultValues: {
      priorita: 2,
      synced: false,
    },
    fieldOrder: ["titolo", "contenuto", "tags", "priorita", "notifica", "notebook_id"],
    types: {
      id: "number",
      titolo: "string",
      contenuto: "text",
      data_creazione: "datetime",
      modifica: "datetime",
      tags: "array",
      priorita: "priority_select",
      notifica: "datetime",
      notebook_id: "string",
      id_utente: "string",
      synced: "boolean",
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
      contenuto: { minLength: 1, maxLength: 10000 },
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
export default function ItemDetailPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const [originalData, setOriginalData] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [priorityOptions, setPriorityOptions] = useState<any[]>([])
  const [isEditMode, setIsEditMode] = useState<boolean>(searchParams.get("edit") === "true")

  // Estrai il nome della tabella e l'ID
  const tableName = Array.isArray(params.table) ? params.table[0] : params.table
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id

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

  // Funzione per caricare le opzioni di priorità da Supabase
  const loadPriorityOptions = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("configurazione").select("priorita").single()
      if (error) throw error
      let priorityArray = null
      if (data?.priorita) {
        if (Array.isArray(data.priorita)) priorityArray = data.priorita
        else if (data.priorita.priorità && Array.isArray(data.priorita.priorità)) priorityArray = data.priorita.priorità
        else if (data.priorita.priorita && Array.isArray(data.priorita.priorita)) priorityArray = data.priorita.priorita
      }
      if (!priorityArray || priorityArray.length === 0) {
        setPriorityOptions([])
        return
      }
      const mappedPriorities = priorityArray.map((item: any) => ({
        value: item.livello || item.value,
        nome: item.nome || item.label || `Priorità ${item.livello || item.value}`,
        descrizione: item.descrizione || item.description || "",
      }))
      setPriorityOptions(mappedPriorities)
    } catch (error: any) {
      console.error("Errore nel caricamento delle priorità:", error)
      setPriorityOptions([])
    }
  }, [supabase])

  // Carica le opzioni di priorità all'avvio
  useEffect(() => {
    if (supabase) {
      loadPriorityOptions()
    }
  }, [supabase, loadPriorityOptions])

  // Carica i dati dell'elemento
  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return

    setLoading(true)
    try {
      let query = supabase.from(tableName).select("*").eq("id", itemId)

      if (tableName !== "utenti" && user?.id) {
        query = query.eq("id_utente", user.id)
      }

      const { data, error } = await query.single()

      if (error) throw error

      setFormData(data)
      setOriginalData(data)
    } catch (error: any) {
      console.error("Errore nel caricamento dell'elemento:", error)
      toast({
        title: "Errore",
        description: `Impossibile caricare l'elemento: ${error.message}`,
        variant: "destructive",
      })
      router.push(`/data-explorer/${tableName}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, isValidTable, router])

  useEffect(() => {
    if (supabase && tableName && itemId && isValidTable) {
      loadItem()
    }
  }, [supabase, loadItem, tableName, itemId, isValidTable])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    console.log(`Campo ${field} cambiato a:`, value)

    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value }

      // Se cambia data_inizio, aggiorna automaticamente data_fine con +1 ora
      if (
        field === "data_inizio" &&
        value &&
        (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti")
      ) {
        try {
          // Crea una nuova data aggiungendo 1 ora
          const startDate = new Date(value)
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 ora

          // Formatta come stringa ISO locale (senza conversione timezone)
          const year = endDate.getFullYear()
          const month = String(endDate.getMonth() + 1).padStart(2, "0")
          const day = String(endDate.getDate()).padStart(2, "0")
          const hour = String(endDate.getHours()).padStart(2, "0")
          const minute = String(endDate.getMinutes()).padStart(2, "0")
          const second = String(endDate.getSeconds()).padStart(2, "0")

          const localISOString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
          newData.data_fine = localISOString

          console.log(`Auto-aggiornamento data_fine: ${localISOString}`)
        } catch (e) {
          console.warn("Errore nell'aggiornamento automatico di data_fine:", e)
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

  // Salva le modifiche
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
      dataToSave.modifica = new Date().toISOString()

      console.log(`Aggiornamento elemento in tabella: ${tableName}`, dataToSave)

      // Aggiorna nel database
      const { data, error } = await supabase.from(tableName).update(dataToSave).eq("id", itemId).select()

      if (error) {
        console.error("Errore aggiornamento:", error)

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
        title: "Elemento aggiornato con successo!",
        description: "Le modifiche sono state salvate nel database",
        action: (
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
        ),
      })

      // Aggiorna i dati locali
      if (data && data[0]) {
        setFormData(data[0])
        setOriginalData(data[0])
      }
      setIsEditMode(false)
      setErrors({})
    } catch (error: any) {
      console.error("Errore durante il salvataggio:", error)
      toast({
        title: "Errore durante il salvataggio",
        description: error.message || "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Annulla le modifiche
  const handleCancelEdit = () => {
    setFormData(originalData)
    setIsEditMode(false)
    setErrors({})
  }

  // Elimina l'elemento
  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return

    setDeleting(true)
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", itemId)

      if (error) throw error

      toast({
        title: "Elemento eliminato con successo!",
        description: "L'elemento è stato rimosso dal database",
      })

      router.push(`/data-explorer/${tableName}`)
    } catch (error: any) {
      console.error("Errore durante l'eliminazione:", error)
      toast({
        title: "Errore durante l'eliminazione",
        description: error.message || "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Renderizza un campo del form
  const renderField = (field: string) => {
    const fieldType = fieldTypes[field]
    const fieldValue = formData[field]
    const hasError = !!errors[field]
    const isRequired = requiredFields.includes(field)

    // Non renderizzare i campi automatici
    if (autoFields.includes(field)) return null

    const commonProps = {
      id: field,
      value: fieldValue || "",
      onChange: (e: any) => handleFieldChange(field, e.target.value),
      className: hasError ? "border-red-500" : "",
    }

    // Se non siamo in modalità modifica, mostra solo il valore
    if (!isEditMode) {
      let displayValue = fieldValue
      if (fieldType === "datetime" && fieldValue) {
        displayValue = formatDateDisplay(fieldValue)
      } else if (fieldType === "boolean") {
        displayValue = fieldValue ? "Sì" : "No"
      } else if (fieldType === "priority_select") {
        const priorityOption = priorityOptions.find((option) => option.value === fieldValue)
        displayValue = priorityOption ? priorityOption.nome : fieldValue
      } else if (fieldType === "select") {
        const options = selectOptions[field] || []
        const selectedOption = options.find((option: any) => option.value === fieldValue)
        displayValue = selectedOption ? selectedOption.label : fieldValue
      }

      return (
        <div key={field} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
          </Label>
          <div className="mt-1 p-2 rounded-md bg-gray-50">{displayValue || "-"}</div>
        </div>
      )
    }

    switch (fieldType) {
      case "string":
      case "email":
      case "tel":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} type={fieldType === "email" ? "email" : fieldType === "tel" ? "tel" : "text"} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "text":
      case "richtext":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea {...commonProps} rows={fieldType === "richtext" ? 8 : 4} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "number":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              onChange={(e) => handleFieldChange(field, Number.parseFloat(e.target.value) || 0)}
            />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "datetime":
        console.log(`Rendering EnhancedDatePicker for ${field} with value:`, fieldValue)
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <EnhancedDatePicker
              id={field}
              value={fieldValue || ""}
              onChange={(newValue) => {
                console.log(`EnhancedDatePicker onChange for ${field}:`, newValue)
                handleFieldChange(field, newValue)
              }}
              placeholder={`Seleziona ${field.replace(/_/g, " ").toLowerCase()}`}
              className={hasError ? "border-red-500" : ""}
              showCurrentTime={true}
            />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "boolean":
        return (
          <div key={field} className="flex items-center space-x-2">
            <Checkbox
              id={field}
              checked={!!fieldValue}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
            />
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
            </Label>
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "select":
        const options = selectOptions[field] || []
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={fieldValue || ""} onValueChange={(value) => handleFieldChange(field, value)}>
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "priority_select":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {priorityOptions.length > 0 ? (
              <Select
                value={fieldValue?.toString() || ""}
                onValueChange={(value) => handleFieldChange(field, Number.parseInt(value))}
              >
                <SelectTrigger className={hasError ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleziona priorità..." />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.nome}
                      {option.descrizione && <span className="text-sm text-gray-500 ml-2">({option.descrizione})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 p-2 border border-red-300 bg-red-50 rounded-md text-red-600 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Impossibile caricare le opzioni di priorità. Verificare la configurazione.</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={loadPriorityOptions}>
                  Riprova caricamento
                </Button>
              </div>
            )}
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "color":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <ColorPicker value={fieldValue || ""} onChange={(value) => handleFieldChange(field, value)} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      default:
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )
    }
  }

  // Se la tabella non è valida, mostra un errore
  if (!isValidTable) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Tabella non trovata</h1>
              <p className="text-gray-600 mb-4">La tabella "{tableName}" non è disponibile.</p>
              <Button onClick={() => router.push("/data-explorer")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Data Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se non c'è configurazione per la tabella
  if (!tableConfig) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Configurazione mancante</h1>
              <p className="text-gray-600 mb-4">La configurazione per la tabella "{tableName}" non è disponibile.</p>
              <Button onClick={() => router.push("/data-explorer")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Data Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tableInfo = AVAILABLE_TABLES.find((table) => table.id === tableName)
  const Icon = tableInfo?.icon || FileText

  const getItemTitle = () => {
    if (formData.titolo) return formData.titolo
    if (formData.username) return formData.username
    if (formData.nome) return formData.cognome ? `${formData.nome} ${formData.cognome}` : formData.nome
    return `ID: ${itemId}`
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button onClick={() => router.push(`/data-explorer/${tableName}`)} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla lista
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 mb-2">
            <Icon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">{getItemTitle()}</h1>
              <div className="flex items-center space-x-2">
                <p className="text-gray-600">{tableInfo?.label}</p>
                <Badge variant="outline">ID: {itemId}</Badge>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditMode ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salva
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Annulla
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditMode(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifica
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione non può essere annullata. L'elemento verrà eliminato permanentemente dal database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Eliminazione..." : "Elimina"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <span>Dettagli {tableInfo?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fieldOrder.length > 0
              ? fieldOrder.map((field) => renderField(field))
              : Object.keys(fieldTypes)
                  .filter((field) => !autoFields.includes(field))
                  .map((field) => renderField(field))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
