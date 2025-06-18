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
import { normalizeDate, formatDateDisplay } from "@/lib/date-utils"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: "📅" },
  { id: "attivita", label: "Attività", icon: "📋" },
  { id: "scadenze", label: "Scadenze", icon: "⏰" },
  { id: "todolist", label: "To-Do List", icon: "✓" },
  { id: "progetti", label: "Progetti", icon: "📊" },
  { id: "clienti", label: "Clienti", icon: "👥" },
  { id: "pagine", label: "Pagine", icon: "📄" },
  { id: "note", label: "Note", icon: "📄" },
]

// Definizione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica", "id_pro", "id_att", "id_cli"], // Rimosso "attivo"
    requiredFields: ["titolo"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      luogo: "text",
      data_inizio: "datetime", // Preserva orario
      data_fine: "datetime", // Preserva orario
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
        { value: "da_pianificare", label: "Da pianificare" },
        { value: "pianificato", label: "Pianificato" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "sospeso", label: "Sospeso" },
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
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica", "id_pro", "id_app", "id_cli"], // Rimosso "attivo"
    requiredFields: ["titolo"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime", // Preserva orario
      data_fine: "datetime", // Preserva orario
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
      "Note e dettagli": ["note", "luogo", "tags", "notifica"], // Aggiunto luogo, tags, notifica se esistono
      "Informazioni di sistema": ["id", "id_utente", "modifica", "attivo", "id_pro", "id_app", "id_cli"],
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "scadenza", "stato", "priorita", "privato"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"], // Rimosso campi che dovrebbero essere modificabili
    requiredFields: ["titolo"],
    defaultSort: "scadenza",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "datetime", // Normalizza a fine giornata
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
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"], // Rimosso campi che dovrebbero essere modificabili
    requiredFields: ["titolo", "descrizione"],
    defaultSort: "priorita",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "priority_select",
      scadenza: "datetime", // Normalizza a fine giornata
      notifica: "datetime",
      note: "text",
      stato: "text",
      tags: "json",
      id_utente: "number",
      modifica: "datetime",
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
        "completato",
        "stato",
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
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica", "id_att", "id_app", "id_cli", "id_sca"], // Rimosso "attivo"
    requiredFields: ["titolo", "stato"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      stato: "select",
      priorita: "priority_select",
      data_inizio: "datetime", // Preserva orario
      data_fine: "datetime", // Preserva orario
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
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"], // Rimosso "attivo"
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
    listFields: ["id", "titolo", "categoria", "pubblicato", "attivo"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"], // Rimosso campi che dovrebbero essere modificabili
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
      // Aggiunti campi mancanti dalla definizione della tabella utente
      estratto: "text",
      categoria: "string",
      tags: "json",
      immagine: "string", // Potrebbe essere un URL o un riferimento a un file
      pubblicato: "datetime", // Preserva orario
      privato: "boolean",
      attivo: "boolean", // Assicurati che sia presente se usato
    },
    groups: {
      "Informazioni principali": ["titolo", "slug", "stato", "categoria", "pubblicato", "privato", "attivo"],
      Contenuto: ["estratto", "contenuto", "immagine"],
      SEO: ["meta_title", "meta_description", "tags"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
    },
  },
  note: {
    listFields: ["id", "titolo", "priorita"],
    readOnlyFields: ["id", "modifica", "id_utente"],
    defaultSort: "priorita",
    types: {
      id: "number",
      modifica: "datetime",
      id_utente: "number",
      titolo: "string",
      contenuto: "text",
      priorita: "string",
    },
  },
}

// Funzione per pulire i dati prima del salvataggio
function cleanDataForSave(data: any, readOnlyFields: string[] = []): any {
  const cleaned = { ...data }
  readOnlyFields.forEach((field) => {
    if (field !== "id_utente") delete cleaned[field]
  })
  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key]
    if (value === undefined) delete cleaned[key]
    else if (typeof value === "string" && value.trim() === "") cleaned[key] = null
    else if (typeof value === "number" && isNaN(value)) delete cleaned[key]
  })
  return cleaned
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
  useEffect(() => setLocalValue(value || 0), [value])
  const handleSliderChange = (newValue: number[]) => {
    const val = newValue[0]
    setLocalValue(val)
    if (onChange) onChange(val)
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
            style={{ width: `${percentage}%`, backgroundColor: progressColor }}
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
          style={{ width: `${percentage}%`, backgroundColor: progressColor }}
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
          <span>0%</span> <span>50%</span> <span>100%</span>
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

  if (!isValidTable && tableName) console.error(`Tabella non valida: ${tableName}`)

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
        value: item.nome || item.value,
        nome: item.nome || item.label || `Gruppo ${item.value}`,
        descrizione: item.descrizione || item.description || "",
      }))
      setGroupOptions(mappedGroups)
    } catch (error: any) {
      console.error("Errore nel caricamento dei gruppi:", error)
      setGroupOptions([])
    }
  }, [supabase])

  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !itemId || itemId === "new" || !user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from(tableName).select("*").eq("id", itemId).single()
      if (error) throw error
      if (data.id_utente && data.id_utente !== user.id) {
        toast({
          title: "Accesso negato",
          description: "Non hai i permessi per visualizzare questo elemento",
          variant: "destructive",
        })
        router.push(`/data-explorer?table=${tableName}`)
        return
      }
      setItem(data)
      setEditedItem({ ...data })
    } catch (error: any) {
      console.error("Errore nel caricamento dell'elemento:", error)
      toast({
        title: "Errore",
        description: `Impossibile caricare l'elemento: ${error.message}`,
        variant: "destructive",
      })
      router.push(`/data-explorer?table=${tableName}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, router])

  useEffect(() => {
    if (isNewItem) {
      const newItem = { id_utente: user?.id }
      setItem(newItem)
      setEditedItem(newItem)
      setLoading(false)
    } else {
      loadItem()
    }
  }, [isNewItem, loadItem, user?.id])

  useEffect(() => {
    loadPriorityOptions()
    loadGroupOptions()
  }, [loadPriorityOptions, loadGroupOptions])

  const validateForm = (): boolean => {
    const errors: string[] = []
    requiredFields.forEach((field) => {
      const value = editedItem?.[field]
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors.push(`Il campo "${field}" è obbligatorio`)
      }
    })
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id) return
    if (!validateForm()) {
      toast({
        title: "Errori di validazione",
        description: "Correggi gli errori evidenziati prima di salvare",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const dataToSave = cleanDataForSave(editedItem, readOnlyFields)
      dataToSave.id_utente = user.id
      dataToSave.modifica = new Date().toISOString()
      if (isNewItem) {
        const { data, error } = await supabase.from(tableName).insert([dataToSave]).select().single()
        if (error) throw error
        toast({
          title: "Successo",
          description: "Elemento creato con successo",
        })
        router.push(`/data-explorer/${tableName}/${data.id}`)
      } else {
        const { error } = await supabase.from(tableName).update(dataToSave).eq("id", itemId).eq("id_utente", user.id)
        if (error) throw error
        setItem({ ...editedItem })
        setIsEditMode(false)
        toast({
          title: "Successo",
          description: "Elemento aggiornato con successo",
        })
      }
    } catch (error: any) {
      console.error("Errore nel salvataggio:", error)
      toast({
        title: "Errore",
        description: `Impossibile salvare: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId || itemId === "new" || !user?.id) return
    setDeleting(true)
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", itemId).eq("id_utente", user.id)
      if (error) throw error
      toast({
        title: "Successo",
        description: "Elemento eliminato con successo",
      })
      router.push(`/data-explorer?table=${tableName}`)
    } catch (error: any) {
      console.error("Errore nell'eliminazione:", error)
      toast({
        title: "Errore",
        description: `Impossibile eliminare: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    if (isNewItem) {
      router.push(`/data-explorer?table=${tableName}`)
    } else {
      setEditedItem({ ...item })
      setIsEditMode(false)
      setValidationErrors([])
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedItem((prev: any) => ({ ...prev, [fieldName]: value }))
    if (validationErrors.length > 0) {
      setValidationErrors((prev) => prev.filter((error) => !error.includes(fieldName)))
    }
  }

  const renderFieldInput = (fieldName: string, fieldType: string, value: any, isReadOnly: boolean) => {
    const isRequired = requiredFields.includes(fieldName)
    const hasError = validationErrors.some((error) => error.includes(fieldName))
    const commonProps = {
      id: fieldName,
      disabled: isReadOnly,
      className: hasError ? "border-red-500" : "",
    }

    switch (fieldType) {
      case "string":
        return (
          <Input
            {...commonProps}
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={isRequired ? `${fieldName} (obbligatorio)` : fieldName}
          />
        )

      case "text":
        return (
          <Textarea
            {...commonProps}
            value={value || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={isRequired ? `${fieldName} (obbligatorio)` : fieldName}
            rows={4}
          />
        )

      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(fieldName, Number.parseFloat(e.target.value) || null)}
            placeholder={isRequired ? `${fieldName} (obbligatorio)` : fieldName}
          />
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldName}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
              disabled={isReadOnly}
            />
            <Label htmlFor={fieldName} className="text-sm">
              {value ? "Sì" : "No"}
            </Label>
          </div>
        )

      case "datetime":
        return (
          <EnhancedDatePicker
            date={value ? new Date(value) : undefined}
            onChange={(date) => handleFieldChange(fieldName, date ? date.toISOString() : null)}
            placeholder={isRequired ? `${fieldName} (obbligatorio)` : fieldName}
            showTimeSelect={true}
          />
        )

      case "date":
        return (
          <EnhancedDatePicker
            date={value ? new Date(value) : undefined}
            onChange={(date) => handleFieldChange(fieldName, date ? normalizeDate(date).toISOString() : null)}
            placeholder={isRequired ? `${fieldName} (obbligatorio)` : fieldName}
            showTimeSelect={false}
          />
        )

      case "select":
        const options = selectOptions[fieldName] || []
        return (
          <Select value={value || ""} onValueChange={(newValue) => handleFieldChange(fieldName, newValue)}>
            <SelectTrigger className={hasError ? "border-red-500" : ""}>
              <SelectValue
                placeholder={isRequired ? `Seleziona ${fieldName} (obbligatorio)` : `Seleziona ${fieldName}`}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "priority_select":
        return (
          <Select value={value || ""} onValueChange={(newValue) => handleFieldChange(fieldName, newValue)}>
            <SelectTrigger className={hasError ? "border-red-500" : ""}>
              <SelectValue
                placeholder={isRequired ? `Seleziona ${fieldName} (obbligatorio)` : `Seleziona ${fieldName}`}
              />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "group_select":
        return (
          <Select value={value || ""} onValueChange={(newValue) => handleFieldChange(fieldName, newValue)}>
            <SelectTrigger className={hasError ? "border-red-500" : ""}>
              <SelectValue
                placeholder={isRequired ? `Seleziona ${fieldName} (obbligatorio)` : `Seleziona ${fieldName}`}
              />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "color":
        return <ColorPicker value={value || ""} onChange={(newValue) => handleFieldChange(fieldName, newValue)} />

      case "progress":
        return (
          <ProgressBar
            value={value || 0}
            color={editedItem?.colore || "#3b82f6"}
            onChange={(newValue) => handleFieldChange(fieldName, newValue)}
            readOnly={isReadOnly}
          />
        )

      case "json":
        if (fieldName === "tags" || fieldName === "tag") {
          return (
            <TagInput
              value={Array.isArray(value) ? value : []}
              onChange={(newTags) => handleFieldChange(fieldName, newTags)}
              placeholder={isRequired ? `Aggiungi ${fieldName} (obbligatorio)` : `Aggiungi ${fieldName}`}
            />
          )
        }
        return (
          <Textarea
            {...commonProps}
            value={value ? JSON.stringify(value, null, 2) : ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleFieldChange(fieldName, parsed)
              } catch {
                // Ignora errori di parsing durante la digitazione
              }
            }}
            placeholder={isRequired ? `${fieldName} JSON (obbligatorio)` : `${fieldName} JSON`}
            rows={4}
          />
        )

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={isRequired ? `${fieldName} (obbligatorio)` : fieldName}
          />
        )
    }
  }

  const renderFieldValue = (fieldName: string, fieldType: string, value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-500">-</span>

    switch (fieldType) {
      case "boolean":
        return <Badge variant={value ? "default" : "secondary"}>{value ? "Sì" : "No"}</Badge>

      case "datetime":
        return <span className="text-sm">{formatDateDisplay(value)}</span>

      case "date":
        return <span className="text-sm">{formatDateDisplay(value)}</span>

      case "json":
        if (fieldName === "tags" || fieldName === "tag") {
          return (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(value) && value.length > 0 ? (
                value.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500">Nessun tag</span>
              )}
            </div>
          )
        }
        return (
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">{JSON.stringify(value, null, 2)}</pre>
        )

      case "color":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: value || "#000000" }} />
            <span className="text-sm font-mono">{value || "#000000"}</span>
          </div>
        )

      case "progress":
        return <ProgressBar value={value || 0} color={item?.colore || "#3b82f6"} readOnly={true} />

      case "text":
        return <div className="text-sm whitespace-pre-wrap">{value}</div>

      default:
        return <span className="text-sm">{formatValue(value)}</span>
    }
  }

  const renderFieldGroup = (groupName: string, fields: string[]) => {
    const currentData = isEditMode ? editedItem : item
    const availableFields = fields.filter((field) => currentData && currentData.hasOwnProperty(field))

    if (availableFields.length === 0) return null

    return (
      <div key={groupName} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{groupName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableFields.map((fieldName) => {
            const fieldType = fieldTypes[fieldName] || "string"
            const value = currentData[fieldName]
            const isReadOnly = readOnlyFields.includes(fieldName) || !isEditMode
            const isRequired = requiredFields.includes(fieldName)

            return (
              <div key={fieldName} className="space-y-2">
                <Label htmlFor={fieldName} className="text-sm font-medium">
                  {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                  {isReadOnly && <span className="text-gray-400 ml-1">(sola lettura)</span>}
                </Label>
                {isEditMode && !isReadOnly
                  ? renderFieldInput(fieldName, fieldType, value, isReadOnly)
                  : renderFieldValue(fieldName, fieldType, value)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!isValidTable) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tabella non trovata</h2>
            <p className="text-gray-600 mb-4">La tabella "{tableName}" non è disponibile.</p>
            <Button onClick={() => router.push("/data-explorer")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna all'esploratore
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const tableLabel = AVAILABLE_TABLES.find((t) => t.id === tableName)?.label || tableName
  const currentData = isEditMode ? editedItem : item

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push(`/data-explorer?table=${tableName}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla lista
                </Button>
              </div>
              <CardTitle className="text-xl sm:text-2xl">
                {isNewItem ? `Nuovo ${tableLabel}` : `${tableLabel} #${itemId}`}
              </CardTitle>
              <CardDescription>
                {isNewItem
                  ? `Crea un nuovo elemento in ${tableLabel}`
                  : isEditMode
                    ? `Modifica elemento in ${tableLabel}`
                    : `Visualizza elemento in ${tableLabel}`}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {!isNewItem && !isEditMode && (
                <Button onClick={() => setIsEditMode(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              )}

              {isEditMode && (
                <>
                  <Button onClick={handleCancel} variant="outline" disabled={saving}>
                    <X className="h-4 w-4 mr-2" />
                    Annulla
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvataggio..." : "Salva"}
                  </Button>
                </>
              )}

              {!isNewItem && !isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        {deleting ? "Eliminazione..." : "Elimina"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Errori di validazione */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h4 className="text-sm font-medium text-red-800">Errori di validazione</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {Object.keys(fieldGroups).length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Object.keys(fieldGroups).map((groupName) => (
                  <TabsTrigger key={groupName} value={groupName} className="text-xs">
                    {groupName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(fieldGroups).map(([groupName, fields]) => (
                <TabsContent key={groupName} value={groupName} className="mt-6">
                  {renderFieldGroup(groupName, fields)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="space-y-6">
              {currentData &&
                Object.keys(currentData).map((fieldName) => {
                  const fieldType = fieldTypes[fieldName] || "string"
                  const value = currentData[fieldName]
                  const isReadOnly = readOnlyFields.includes(fieldName) || !isEditMode
                  const isRequired = requiredFields.includes(fieldName)

                  return (
                    <div key={fieldName} className="space-y-2">
                      <Label htmlFor={fieldName} className="text-sm font-medium">
                        {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                        {isReadOnly && <span className="text-gray-400 ml-1">(sola lettura)</span>}
                      </Label>
                      {isEditMode && !isReadOnly
                        ? renderFieldInput(fieldName, fieldType, value, isReadOnly)
                        : renderFieldValue(fieldName, fieldType, value)}
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
