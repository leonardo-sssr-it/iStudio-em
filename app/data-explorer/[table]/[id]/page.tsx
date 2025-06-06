"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ArrowLeft, Save, Trash2, Edit, X, AlertCircle } from "lucide-react"
import { formatValue } from "@/lib/utils-db"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { TagInput } from "@/components/ui/tag-input"
import { normalizeDate, formatDateDisplay } from "@/lib/date-utils" // Importa le nuove utility

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

// Definizione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_pro", "id_att", "id_cli", "data_creazione"],
    requiredFields: ["titolo"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      luogo: "text",
      data_inizio: "datetime",
      data_fine: "datetime", // Campo da normalizzare a fine giornata
      data_creazione: "datetime",
      stato: "select",
      priorita: "priority_select",
      note: "text",
      tags: "json",
      id_utente: "number",
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
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita", "data_inizio", "data_fine"],
      "Note e dettagli": ["note", "luogo", "tags", "notifica"],
      "Informazioni di sistema": [
        "id",
        "id_utente",
        "modifica",
        "attivo",
        "id_pro",
        "id_att",
        "id_cli",
        "data_creazione",
      ],
    },
  },
  attivita: {
    listFields: ["id", "titolo", "data_inizio", "stato", "priorita", "attivo"],
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_pro", "id_app", "id_cli"],
    requiredFields: ["titolo"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime", // Campo da normalizzare a fine giornata
      stato: "select",
      priorita: "priority_select",
      note: "text",
      id_utente: "number",
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
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita", "data_inizio", "data_fine"],
      "Note e dettagli": ["note", "luogo", "tags", "notifica"],
      "Informazioni di sistema": ["id", "id_utente", "modifica", "attivo", "id_pro", "id_app", "id_cli"],
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "scadenza", "stato", "priorita", "privato"],
    readOnlyFields: ["id", "id_utente", "modifica"],
    requiredFields: ["titolo"],
    defaultSort: "data_scadenza", // Assumendo che il campo sia 'scadenza'
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "datetime", // Campo da normalizzare a fine giornata
      stato: "select",
      priorita: "priority_select",
      note: "text",
      id_utente: "number",
      id_pro: "number",
      modifica: "datetime",
      notifica: "datetime",
      privato: "boolean",
      tags: "json",
    },
    selectOptions: {
      stato: [
        { value: "attivo", label: "Attivo" },
        { value: "completato", label: "Completato" },
        { value: "scaduto", label: "Scaduto" },
      ],
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita", "scadenza"],
      Dettagli: ["note", "tags", "notifica", "privato", "id_pro"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
    },
  },
  todolist: {
    listFields: ["id", "titolo", "completato", "priorita", "scadenza"],
    readOnlyFields: ["id", "id_utente", "modifica"],
    requiredFields: ["titolo", "descrizione"],
    defaultSort: "priorita",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "priority_select",
      scadenza: "datetime", // Campo da normalizzare a fine giornata
      notifica: "datetime",
      note: "text",
      tags: "json",
      id_utente: "number",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": [
        "titolo",
        "descrizione",
        "completato",
        "priorita",
        "scadenza",
        "note",
        "notifica",
        "tags",
      ],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
    },
  },
  progetti: {
    listFields: ["id", "titolo", "stato", "data_inizio", "data_fine", "budget"],
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_att", "id_app", "id_cli", "id_sca"],
    requiredFields: ["titolo", "stato"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      stato: "select",
      priorita: "priority_select",
      data_inizio: "datetime",
      data_fine: "datetime", // Campo da normalizzare a fine giornata
      budget: "number",
      note: "text",
      id_utente: "number",
      modifica: "datetime",
      colore: "color",
      gruppo: "group_select",
      avanzamento: "progress",
      tags: "json",
      allegati: "json",
      notifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "da_pianificare", label: "Da pianificare" },
        { value: "pianificato", label: "Pianificato" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "sospeso", label: "Sospeso" },
      ],
    },
    groups: {
      "Informazioni principali": [
        "titolo",
        "descrizione",
        "stato",
        "colore",
        "priorita",
        "gruppo",
        "budget",
        "data_inizio",
        "data_fine",
        "avanzamento",
      ],
      "Note e dettagli": ["note", "allegati", "notifica", "tags"],
      "Informazioni di sistema": ["id", "id_utente", "modifica", "attivo", "id_att", "id_app", "id_cli", "id_sca"],
    },
  },
  clienti: {
    listFields: ["id", "nome", "cognome", "email", "societa", "citta"],
    readOnlyFields: ["id", "id_utente", "modifica"],
    requiredFields: ["nome", "cognome", "email"],
    defaultSort: "cognome",
    types: {
      id: "number",
      nome: "string",
      cognome: "string",
      email: "string",
      indirizzo: "string",
      citta: "string",
      cap: "string",
      codicefiscale: "string",
      rappresentante: "boolean",
      societa: "string",
      indirizzosocieta: "string",
      cittasocieta: "string",
      partitaiva: "string",
      recapiti: "text",
      note: "text",
      attivo: "boolean",
      qr: "string",
      id_utente: "number",
      modifica: "datetime",
    },
    groups: {
      "Dati personali": ["nome", "cognome", "email", "codicefiscale", "rappresentante"],
      "Indirizzo personale": ["indirizzo", "citta", "cap"],
      "Dati azienda": ["societa", "partitaiva"],
      "Indirizzo azienda": ["indirizzosocieta", "cittasocieta"],
      "Contatti e note": ["recapiti", "note", "qr"],
      "Informazioni di sistema": ["id", "id_utente", "modifica", "attivo"],
    },
  },
  pagine: {
    listFields: ["id", "titolo", "slug", "stato", "data_creazione"],
    readOnlyFields: ["id", "id_utente", "modifica"],
    requiredFields: ["titolo"],
    defaultSort: "data_creazione",
    types: {
      id: "number",
      titolo: "string",
      slug: "string",
      contenuto: "text",
      stato: "select",
      meta_title: "string",
      meta_description: "text",
      id_utente: "number",
      modifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "bozza", label: "Bozza" },
        { value: "pubblicato", label: "Pubblicato" },
        { value: "archiviato", label: "Archiviato" },
      ],
    },
    groups: {
      "Informazioni principali": ["titolo", "slug", "stato"],
      Contenuto: ["contenuto"],
      SEO: ["meta_title", "meta_description"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
    },
  },
}

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
    if (typeof value === "string" && value.trim() === "") {
      cleaned[key] = null
    }
    if (typeof value === "number" && isNaN(value)) {
      delete cleaned[key]
    }
  })
  return cleaned
}

// Campi che rappresentano una data di fine o scadenza e devono essere normalizzati a fine giornata
const END_OF_DAY_FIELDS = ["data_fine", "scadenza"]

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

// Componente per la barra di avanzamento
const ProgressBar = ({
  value,
  color,
  onChange,
  readOnly = false,
}: {
  value: number
  color: string
  onChange?: (value: number) => void
  readOnly?: boolean
}) => {
  const [localValue, setLocalValue] = useState(value || 0)

  useEffect(() => {
    setLocalValue(value || 0)
  }, [value])

  const handleSliderChange = (newValue: number[]) => {
    const val = newValue[0]
    setLocalValue(val)
    if (onChange) {
      onChange(val)
    }
  }

  const progressColor = color || "#3b82f6"
  const percentage = Math.min(Math.max(localValue, 0), 100)
  const textInColoredPart = percentage > 50

  if (readOnly) {
    return (
      <div className="w-full">
        <div className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-in-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: progressColor,
            }}
          />
          <div
            className={`absolute inset-0 flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
              textInColoredPart ? "text-white" : "text-gray-700"
            }`}
          >
            {percentage}%
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-in-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: progressColor,
          }}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
            textInColoredPart ? "text-white" : "text-gray-700"
          }`}
        >
          {percentage}%
        </div>
      </div>
      <div className="px-2">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={localValue}
          onChange={(e) => handleSliderChange([Number.parseInt(e.target.value)])}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
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
  const [isEditMode, setIsEditMode] = useState<boolean>(searchParams.get("edit") === "true" || params.id === "new")
  const isNewItem = params.id === "new"

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [item, setItem] = useState<any>(null)
  const [editedItem, setEditedItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("main")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [priorityOptions, setPriorityOptions] = useState<any[]>([])
  const [groupOptions, setGroupOptions] = useState<any[]>([])

  const tableName = Array.isArray(params.table) ? params.table[0] : params.table
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id
  const isValidTable = AVAILABLE_TABLES.some((table) => table.id === tableName)

  if (!isValidTable && tableName) {
    console.error(`Tabella non valida: ${tableName}`)
  }

  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const readOnlyFields = tableConfig?.readOnlyFields || []
  const requiredFields = tableConfig?.requiredFields || []
  const fieldTypes = tableConfig?.types || {}
  const fieldGroups = tableConfig?.groups || {}
  const selectOptions = tableConfig?.selectOptions || {}

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

  const loadGroupOptions = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("configurazione").select("gruppi").single()
      if (error) throw error
      let groupArray = null
      if (data?.gruppi) {
        if (Array.isArray(data.gruppi)) groupArray = data.gruppi
        else if (data.gruppi.gruppi && Array.isArray(data.gruppi.gruppi)) groupArray = data.gruppi.gruppi
      }
      if (!groupArray || groupArray.length === 0) {
        setGroupOptions([])
        return
      }
      const mappedGroups = groupArray.map((item: any) => ({
        value: item.id || item.value,
        nome: item.gruppo || item.nome || item.label || `Gruppo ${item.id || item.value}`,
        descrizione: item.descrizione || item.description || "",
      }))
      setGroupOptions(mappedGroups)
    } catch (error: any) {
      console.error("Errore nel caricamento dei gruppi:", error)
      setGroupOptions([])
    }
  }, [supabase])

  useEffect(() => {
    if (supabase) {
      loadPriorityOptions()
      loadGroupOptions()
    }
  }, [supabase, loadPriorityOptions, loadGroupOptions])

  const validateForm = (): string[] => {
    const errors: string[] = []
    if (!editedItem) return errors
    requiredFields.forEach((field) => {
      const value = editedItem[field]
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
        errors.push(`Il campo "${label}" è obbligatorio`)
      }
    })
    if (tableName === "todolist" && editedItem.descrizione && editedItem.descrizione.trim().length < 3) {
      errors.push("La descrizione deve contenere almeno 3 caratteri")
    }
    return errors
  }

  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !user?.id || !isValidTable) return
    setLoading(true)
    try {
      if (isNewItem) {
        const newItem: any = { id_utente: user.id }
        // Imposta valori di default specifici per tabella
        if (tableName === "todolist") {
          newItem.titolo = ""
          newItem.descrizione = ""
          newItem.completato = false
          newItem.priorita = 1
        } else if (tableName === "clienti") {
          newItem.nome = ""
          newItem.cognome = ""
          newItem.email = ""
          newItem.attivo = true
          newItem.rappresentante = false
        } else if (tableName === "progetti") {
          newItem.titolo = ""
          newItem.stato = "da_pianificare"
          newItem.avanzamento = 0
        } else if (tableName === "attivita") {
          newItem.titolo = ""
          newItem.stato = "da_fare"
          newItem.priorita = 1
        } else if (tableName === "appuntamenti") {
          newItem.titolo = ""
          newItem.stato = "pianificato"
          newItem.priorita = 1
        } else if (tableName === "scadenze") {
          newItem.titolo = ""
          newItem.stato = "attivo"
          newItem.priorita = 1
          newItem.privato = false
        } else if (tableName === "pagine") {
          newItem.titolo = ""
          newItem.stato = "bozza"
        }
        setItem(newItem)
        setEditedItem(newItem)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", itemId)
        .eq("id_utente", user.id)
        .single()
      if (error) throw error
      setItem(data)
      setEditedItem(data)
    } catch (error: any) {
      toast({ title: "Errore", description: `Impossibile caricare i dati: ${error.message}`, variant: "destructive" })
      router.push(`/data-explorer?table=${tableName}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, isNewItem, router, isValidTable])

  useEffect(() => {
    if (supabase && user?.id && tableName && isValidTable) loadItem()
  }, [supabase, user?.id, loadItem, tableName, isValidTable])

  const handleFieldChange = (field: string, value: any) => {
    setEditedItem((prev: any) => {
      let processedValue = value
      // Normalizza i campi datetime che rappresentano scadenze/fine giornata
      if (fieldTypes[field] === "datetime" && END_OF_DAY_FIELDS.includes(field) && value) {
        const normalized = normalizeDate(value, "end")
        processedValue = normalized ? normalized.toISOString() : null
      } else if (fieldTypes[field] === "datetime" && field === "data_inizio" && value) {
        // Normalizza data_inizio a inizio giornata
        const normalized = normalizeDate(value, "start")
        processedValue = normalized ? normalized.toISOString() : null
      }

      const updated = { ...prev, [field]: processedValue }

      // Logica di auto-impostazione di data_fine basata su data_inizio
      if (field === "data_inizio" && updated.data_inizio && !prev.data_fine) {
        const startDate = normalizeDate(updated.data_inizio, "start") // data_inizio è già normalizzata
        if (startDate) {
          const endDate = normalizeDate(startDate, "end") // Imposta data_fine alla fine dello stesso giorno
          if (endDate) {
            updated.data_fine = endDate.toISOString()
          }
        }
      }
      return updated
    })
    setValidationErrors([])
  }

  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id || !editedItem || !isValidTable) return
    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      toast({
        title: "Errori di validazione",
        description: "Correggi gli errori evidenziati prima di salvare",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const updateData = cleanDataForSave(editedItem, isNewItem ? readOnlyFields : [])
      updateData.modifica = new Date().toISOString()
      if (isNewItem) {
        updateData.id_utente = user.id
        if (fieldTypes.data_creazione) updateData.data_creazione = new Date().toISOString()
      }
      let result
      if (isNewItem) {
        result = await supabase.from(tableName).insert(updateData).select()
      } else {
        result = await supabase.from(tableName).update(updateData).eq("id", itemId).select()
      }
      if (result.error) {
        let errorMessage = result.error.message
        if (result.error.message.includes("check constraint") && result.error.message.includes("descrizione_check")) {
          errorMessage =
            "La descrizione non rispetta i requisiti del database. Assicurati che sia compilata correttamente."
        }
        throw new Error(errorMessage)
      }
      toast({ title: "Salvato", description: "I dati sono stati salvati con successo" })
      setItem(result.data[0])
      setEditedItem(result.data[0])
      setIsEditMode(false)
      setValidationErrors([])
      if (isNewItem) router.push(`/data-explorer/${tableName}/${result.data[0].id}`)
    } catch (error: any) {
      toast({ title: "Errore", description: `Impossibile salvare i dati: ${error.message}`, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedItem(item)
    setIsEditMode(false)
    setValidationErrors([])
    if (isNewItem) router.push(`/data-explorer?table=${tableName}`)
  }

  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return
    setDeleting(true)
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", itemId)
      if (error) throw error
      toast({ title: "Eliminato", description: "L'elemento è stato eliminato con successo" })
      router.push(`/data-explorer?table=${tableName}`)
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile eliminare l'elemento: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const renderField = (field: string, value: any, type: string, readOnly = false) => {
    const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
    const isRequired = requiredFields.includes(field)
    const hasError = validationErrors.some((error) => error.includes(label))

    if (!isEditMode || readOnly) {
      let displayValue = value
      if (type === "datetime") {
        // Per la visualizzazione, normalizza le date di fine/scadenza
        if (END_OF_DAY_FIELDS.includes(field)) {
          const normalized = normalizeDate(value, "end")
          displayValue = normalized ? formatDateDisplay(normalized) : formatDateDisplay(value)
        } else if (field === "data_inizio") {
          // Normalizza data_inizio a inizio giornata per visualizzazione
          const normalized = normalizeDate(value, "start")
          displayValue = normalized ? formatDateDisplay(normalized) : formatDateDisplay(value)
        } else {
          displayValue = formatDateDisplay(value)
        }
      } else {
        displayValue = renderFieldValue(value, type)
      }
      return (
        <div className="mb-4" key={field}>
          <Label className="text-sm font-medium">{label}</Label>
          <div className={`mt-1 p-2 rounded-md ${readOnly ? "bg-gray-100" : ""}`}>{displayValue}</div>
        </div>
      )
    }

    switch (type) {
      case "text":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field}
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
              rows={4}
              placeholder={isRequired ? `${label} è obbligatorio` : `Inserisci ${label.toLowerCase()}`}
            />
          </div>
        )
      case "boolean":
        return (
          <div className="flex items-center space-x-2 mb-4" key={field}>
            <Switch
              id={field}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
            />
            <Label htmlFor={field}>{label}</Label>
          </div>
        )
      case "datetime":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <EnhancedDatePicker
              id={field}
              value={value || ""}
              onChange={(newValue) => handleFieldChange(field, newValue)}
              placeholder={`Seleziona ${label.toLowerCase()}`}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
              showCurrentTime={!value}
            />
          </div>
        )
      case "number":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field}
              type="number"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, Number.parseFloat(e.target.value) || null)}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
              placeholder={isRequired ? `${label} è obbligatorio` : `Inserisci ${label.toLowerCase()}`}
            />
          </div>
        )
      case "priority_select":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {priorityOptions.length > 0 ? (
              <Select value={String(value || "")} onValueChange={(val) => handleFieldChange(field, Number(val))}>
                <SelectTrigger className={`mt-1 ${hasError ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={`Seleziona ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.nome}
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
                <Button variant="outline" size="sm" className="mt-2" onClick={loadPriorityOptions}>
                  Riprova caricamento
                </Button>
              </div>
            )}
          </div>
        )
      case "group_select":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            {groupOptions.length > 0 ? (
              <Select value={String(value || "")} onValueChange={(val) => handleFieldChange(field, val)}>
                <SelectTrigger className={`mt-1 ${hasError ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={`Seleziona ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 p-2 border border-red-300 bg-red-50 rounded-md text-red-600 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Impossibile caricare le opzioni di gruppo. Verificare la configurazione.</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={loadGroupOptions}>
                  Riprova caricamento
                </Button>
              </div>
            )}
          </div>
        )
      case "select":
        const options = selectOptions[field] || []
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value || ""} onValueChange={(val) => handleFieldChange(field, val)}>
              <SelectTrigger className={`mt-1 ${hasError ? "border-red-500" : ""}`}>
                <SelectValue placeholder={`Seleziona ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "color":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <div className="mt-1">
              <ColorPicker value={value || "#000000"} onChange={(val) => handleFieldChange(field, val)} />
            </div>
          </div>
        )
      case "json":
        if (field === "tags") {
          return (
            <div className="mb-4" key={field}>
              <Label htmlFor={field}>{label}</Label>
              <TagInput
                id={field}
                value={Array.isArray(value) ? value : []}
                onChange={(tags) => handleFieldChange(field, tags)}
                placeholder="Aggiungi tag..."
                className="mt-1"
              />
            </div>
          )
        }
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Textarea
              id={field}
              value={typeof value === "object" ? JSON.stringify(value, null, 2) : value || ""}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  handleFieldChange(field, parsed)
                } catch {
                  handleFieldChange(field, e.target.value)
                }
              }}
              className="mt-1 font-mono text-sm"
              rows={4}
              placeholder="JSON valido..."
            />
          </div>
        )
      case "progress":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="mt-1">
              <ProgressBar
                value={value || 0}
                color={editedItem.colore || "#3b82f6"}
                onChange={readOnly ? undefined : (val) => handleFieldChange(field, val)}
                readOnly={readOnly || !isEditMode}
              />
            </div>
          </div>
        )
      default:
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field}
              type="text"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
              placeholder={isRequired ? `${label} è obbligatorio` : `Inserisci ${label.toLowerCase()}`}
            />
          </div>
        )
    }
  }

  const renderFieldValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "-"
    switch (type) {
      case "datetime": // Questa formattazione è ora gestita direttamente in renderField per la visualizzazione
        return formatDateDisplay(value)
      case "boolean":
        return value ? "✓" : "✗"
      case "number":
        return typeof value === "number" ? value.toLocaleString("it-IT") : value
      case "priority_select":
        if (priorityOptions.length === 0) return <span className="text-red-500">Errore configurazione</span>
        const priorityOption = priorityOptions.find((option) => option.value === value)
        return priorityOption ? priorityOption.nome : value
      case "group_select":
        if (groupOptions.length === 0) return <span className="text-red-500">Errore configurazione</span>
        const groupOption = groupOptions.find((option) => option.value === value)
        return groupOption ? groupOption.nome : value
      case "text":
        return <div className="whitespace-pre-wrap">{value}</div>
      case "json":
        if (Array.isArray(value))
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="secondary">
                  {String(item)}
                </Badge>
              ))}
            </div>
          )
        return <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>
      case "color":
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: value || "#ffffff" }} />
            <span>{value || "-"}</span>
          </div>
        )
      case "progress":
        return <ProgressBar value={value} color={editedItem?.colore || "#3b82f6"} readOnly />
      default:
        return formatValue(value)
    }
  }

  const getTableTitle = () => {
    const table = AVAILABLE_TABLES.find((t) => t.id === tableName)
    return table ? table.label : "Dettaglio"
  }

  const getItemTitle = () => {
    if (isNewItem) return "Nuovo elemento"
    if (!item) return "Caricamento..."
    if (item.titolo) return item.titolo
    if (item.nome) return item.cognome ? `${item.nome} ${item.cognome}` : item.nome
    return `ID: ${item.id}`
  }

  const renderFieldGroups = () => {
    if (!editedItem) return null
    const allFields = Object.keys(editedItem)
    const tabs = Object.keys(fieldGroups)

    return (
      <div>
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <h4 className="text-sm font-medium text-red-800">Errori di validazione:</h4>
            </div>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            {tabs.map((group) => (
              <TabsTrigger key={group} value={group.toLowerCase().replace(/\s+/g, "-")}>
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((group) => {
            const groupFields = fieldGroups[group as keyof typeof fieldGroups] || []
            return (
              <TabsContent key={group} value={group.toLowerCase().replace(/\s+/g, "-")}>
                <div className="space-y-4">
                  {groupFields.map((field) => {
                    if (!allFields.includes(field)) return null
                    const isReadOnly = readOnlyFields.includes(field)
                    const fieldType = fieldTypes[field as keyof typeof fieldTypes] || "string"

                    // Gestione speciale per data_inizio e data_fine sulla stessa riga
                    if (
                      field === "data_inizio" &&
                      groupFields.includes("data_fine") &&
                      allFields.includes("data_fine")
                    ) {
                      if (!isEditMode) {
                        return (
                          <div key="date-range" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Data inizio</Label>
                              <div className="mt-1 p-2 rounded-md">
                                {formatDateDisplay(normalizeDate(editedItem.data_inizio, "start"))}
                              </div>
                            </div>
                            <div>
                              <Label>Data fine</Label>
                              <div className="mt-1 p-2 rounded-md">
                                {formatDateDisplay(normalizeDate(editedItem.data_fine, "end"))}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div key="date-range" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="data_inizio">Data inizio</Label>
                            <EnhancedDatePicker
                              id="data_inizio"
                              value={editedItem.data_inizio || ""}
                              onChange={(newValue) => handleFieldChange("data_inizio", newValue)}
                              placeholder="Seleziona data inizio"
                              className="mt-1"
                              showCurrentTime={!editedItem.data_inizio}
                            />
                          </div>
                          <div>
                            <Label htmlFor="data_fine">Data fine</Label>
                            <EnhancedDatePicker
                              id="data_fine"
                              value={editedItem.data_fine || ""}
                              onChange={(newValue) => handleFieldChange("data_fine", newValue)}
                              placeholder="Seleziona data fine"
                              className="mt-1"
                              showCurrentTime={!editedItem.data_fine}
                            />
                          </div>
                        </div>
                      )
                    }
                    // Gestione speciale per priorita e scadenza sulla stessa riga
                    if (field === "priorita" && groupFields.includes("scadenza") && allFields.includes("scadenza")) {
                      if (!isEditMode) {
                        return (
                          <div key="priority-deadline" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Priorità</Label>
                              <div className="mt-1 p-2 rounded-md">
                                {renderFieldValue(editedItem.priorita, fieldTypes.priorita || "priority_select")}
                              </div>
                            </div>
                            <div>
                              <Label>Scadenza</Label>
                              <div className="mt-1 p-2 rounded-md">
                                {formatDateDisplay(normalizeDate(editedItem.scadenza, "end"))}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div key="priority-deadline" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {renderField(
                              "priorita",
                              editedItem.priorita,
                              fieldTypes.priorita || "priority_select",
                              readOnlyFields.includes("priorita"),
                            )}
                          </div>
                          <div>
                            {renderField(
                              "scadenza",
                              editedItem.scadenza,
                              fieldTypes.scadenza || "datetime",
                              readOnlyFields.includes("scadenza"),
                            )}
                          </div>
                        </div>
                      )
                    }
                    // Gestione speciale per stato e colore sulla stessa riga
                    if (field === "stato" && groupFields.includes("colore") && allFields.includes("colore")) {
                      if (!isEditMode) {
                        return (
                          <div key="status-color" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Stato</Label>
                              <div className="mt-1 p-2 rounded-md">
                                {renderFieldValue(editedItem.stato, fieldTypes.stato || "select")}
                              </div>
                            </div>
                            <div>
                              <Label>Colore</Label>
                              <div className="mt-1 p-2 rounded-md">
                                {renderFieldValue(editedItem.colore, fieldTypes.colore || "color")}
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <div key="status-color" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {renderField(
                              "stato",
                              editedItem.stato,
                              fieldTypes.stato || "select",
                              readOnlyFields.includes("stato"),
                            )}
                          </div>
                          <div>
                            {renderField(
                              "colore",
                              editedItem.colore,
                              fieldTypes.colore || "color",
                              readOnlyFields.includes("colore"),
                            )}
                          </div>
                        </div>
                      )
                    }

                    if (
                      field === "data_fine" &&
                      groupFields.includes("data_inizio") &&
                      allFields.includes("data_inizio")
                    )
                      return null
                    if (field === "scadenza" && groupFields.includes("priorita") && allFields.includes("priorita"))
                      return null
                    if (field === "colore" && groupFields.includes("stato") && allFields.includes("stato")) return null

                    return renderField(field, editedItem[field], fieldType, isReadOnly)
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    )
  }

  useEffect(() => {
    if (fieldGroups && Object.keys(fieldGroups).length > 0) {
      setActiveTab(Object.keys(fieldGroups)[0].toLowerCase().replace(/\s+/g, "-"))
    }
  }, [fieldGroups])

  if (tableName && !isValidTable) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Errore</CardTitle>
            <CardDescription>La tabella "{tableName}" non è disponibile o non esiste.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/data-explorer?table=" + tableName)}>
              <ArrowLeft size={16} className="mr-2" /> Torna alla lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
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

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => router.push(`/data-explorer?table=${tableName}`)} className="mb-2"><ArrowLeft size={16} className="mr-2" /> Torna alla lista</Button>
              <CardTitle className="text-2xl">{getItemTitle()}</CardTitle>
              <CardDescription>{getTableTitle()} {!isNewItem && (<Badge variant="outline" className="ml-2">ID: {itemId}</Badge>)}</CardDescription>
            </div>
            <div className="flex space-x-2">
              {isEditMode && (<><Button onClick={handleSave} disabled={saving} className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white">{saving ? "Salvataggio..." : "Salva modifiche"}{!saving && <Save size={16} className="ml-2" />}</Button><Button variant="outline" onClick={handleCancelEdit}><X size={16} className="mr-2" /> Annulla modifica</Button></>)}
              {!isNewItem && !isEditMode && (<Button variant="outline" onClick={() => setIsEditMode(true)}><Edit size={16} className="mr-2" /> Modifica</Button>)}
              {!isNewItem && (<AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 size={16} className="mr-2" /> Elimina</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sei sicuro?</AlertDialogTitle><AlertDialogDescription>Questa azione non può essere annullata. L'elemento verrà eliminato permanentemente dal database.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annulla</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">{deleting ? "Eliminazione..." : "Elimina"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></AlertDialog>)}
            </div>
          </div>
        </CardHeader>
        <CardContent>{editedItem && renderFieldGroups()}</CardContent>
      </Card>
  </div>
  )
}
