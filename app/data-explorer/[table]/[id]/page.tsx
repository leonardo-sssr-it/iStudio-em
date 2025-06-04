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
import { ArrowLeft, Save, Trash2, Edit, X } from "lucide-react"
import { formatValue } from "@/lib/utils-db"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { TagInput } from "@/components/ui/tag-input"

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
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      luogo: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      data_creazione: "datetime",
      stato: "select",
      priorita: "number",
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
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      priorita: "number",
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
    defaultSort: "data_scadenza",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      scadenza: "datetime",
      stato: "select",
      priorita: "number",
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
    defaultSort: "priorita",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "number",
      scadenza: "datetime",
      note: "text",
      id_utente: "number",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "completato", "priorita", "scadenza"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
    },
  },
  progetti: {
    listFields: ["id", "nome", "stato", "data_inizio", "data_fine", "budget"],
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_att", "id_app", "id_cli", "id_sca"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      nome: "string",
      descrizione: "text",
      stato: "select",
      data_inizio: "datetime",
      data_fine: "datetime",
      budget: "number",
      note: "text",
      id_utente: "number",
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
    groups: {
      "Informazioni principali": [
        "nome",
        "descrizione",
        "stato",
        "colore",
        "gruppo",
        "budget",
        "data_inizio",
        "data_fine",
        "avanzamento",
      ],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "modifica", "attivo", "id_att", "id_app", "id_cli", "id_sca"],
    },
  },
  clienti: {
    listFields: ["id", "nome", "cognome", "email", "telefono", "citta"],
    readOnlyFields: ["id", "id_utente", "modifica"],
    defaultSort: "cognome",
    types: {
      id: "number",
      nome: "string",
      cognome: "string",
      email: "string",
      telefono: "string",
      citta: "string",
      indirizzo: "string",
      cap: "string",
      piva: "string",
      codfisc: "string",
      note: "text",
      id_utente: "number",
      modifica: "datetime",
    },
    groups: {
      "Informazioni personali": ["nome", "cognome", "email", "telefono"],
      Indirizzo: ["citta", "indirizzo", "cap"],
      "Informazioni fiscali": ["piva", "codfisc"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
    },
  },
  pagine: {
    listFields: ["id", "titolo", "slug", "stato", "data_creazione"],
    readOnlyFields: ["id", "id_utente", "modifica"],
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

// Funzione per formattare le date in italiano
function formatDateIT(date: string | null | undefined): string {
  if (!date) return ""
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (e) {
    return ""
  }
}

// Funzione per formattare le date per input datetime-local
function formatDateForInput(date: string | null | undefined): string {
  if (!date) return ""
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 16) // formato YYYY-MM-DDThh:mm
  } catch (e) {
    return ""
  }
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
  const [isEditMode, setIsEditMode] = useState<boolean>(searchParams.get("edit") === "true" || params.id === "new")
  const isNewItem = params.id === "new"

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [item, setItem] = useState<any>(null)
  const [editedItem, setEditedItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("main")

  // Estrai e valida i parametri
  const tableName = Array.isArray(params.table) ? params.table[0] : params.table
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id

  // Debug logging
  console.log("Parametri URL:", { tableName, itemId, params })

  // Verifica che la tabella sia valida
  const isValidTable = AVAILABLE_TABLES.some((table) => table.id === tableName)

  if (!isValidTable && tableName) {
    console.error(`Tabella non valida: ${tableName}`)
  }

  // Ottieni la configurazione della tabella
  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const readOnlyFields = tableConfig?.readOnlyFields || []
  const fieldTypes = tableConfig?.types || {}
  const fieldGroups = tableConfig?.groups || {}
  const selectOptions = tableConfig?.selectOptions || {}

  // Carica i dati dell'elemento
  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !user?.id || !isValidTable) {
      console.log("Condizioni non soddisfatte:", { supabase: !!supabase, tableName, userId: user?.id, isValidTable })
      return
    }

    setLoading(true)
    try {
      if (isNewItem) {
        // Crea un nuovo elemento vuoto
        const now = new Date()
        const currentDateTime = now.toISOString()

        const newItem: any = {
          id_utente: user.id,
        }

        // NON aggiungere automaticamente data/ora attuale per i campi datetime
        // Verranno aggiunti solo quando l'utente interagisce con il form

        setItem(newItem)
        setEditedItem(newItem)
        setLoading(false)
        return
      }

      console.log(`Caricamento elemento da tabella: ${tableName}, ID: ${itemId}`)

      // Carica l'elemento esistente
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", itemId)
        .eq("id_utente", user.id)
        .single()

      if (error) {
        console.error("Errore query Supabase:", error)
        throw error
      }

      console.log("Dati caricati:", data)
      setItem(data)
      setEditedItem(data)
    } catch (error: any) {
      console.error(`Errore nel caricamento dell'elemento:`, error)
      toast({
        title: "Errore",
        description: `Impossibile caricare i dati: ${error.message}`,
        variant: "destructive",
      })
      router.push(`/data-explorer?table=${tableName}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, isNewItem, router, isValidTable, fieldTypes])

  // Carica i dati all'avvio
  useEffect(() => {
    if (supabase && user?.id && tableName && isValidTable) {
      loadItem()
    }
  }, [supabase, user?.id, loadItem, tableName, isValidTable])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    setEditedItem((prev: any) => {
      const updated = {
        ...prev,
        [field]: value,
      }

      // Se stiamo modificando data_inizio, aggiorna automaticamente data_fine (+1 ora)
      if (field === "data_inizio" && value && !prev.data_fine) {
        const startDate = new Date(value)
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 ora
        updated.data_fine = endDate.toISOString()
      }

      return updated
    })
  }

  // Salva le modifiche
  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id || !editedItem || !isValidTable) return

    setSaving(true)
    try {
      // Prepara i dati da salvare
      const updateData = { ...editedItem }

      // Aggiorna il campo modifica
      updateData.modifica = new Date().toISOString()

      // Imposta l'id_utente per i nuovi elementi
      if (isNewItem) {
        updateData.id_utente = user.id
        updateData.data_creazione = new Date().toISOString()
      }

      console.log(`Salvataggio in tabella: ${tableName}`, updateData)

      // Salva i dati
      let result
      if (isNewItem) {
        result = await supabase.from(tableName).insert(updateData).select()
      } else {
        result = await supabase.from(tableName).update(updateData).eq("id", itemId).select()
      }

      if (result.error) {
        console.error("Errore salvataggio:", result.error)
        throw result.error
      }

      toast({
        title: "Salvato",
        description: "I dati sono stati salvati con successo",
      })

      // Aggiorna i dati locali
      setItem(result.data[0])
      setEditedItem(result.data[0])
      setIsEditMode(false)

      // Reindirizza alla pagina di dettaglio per i nuovi elementi
      if (isNewItem) {
        router.push(`/data-explorer/${tableName}/${result.data[0].id}`)
      }
    } catch (error: any) {
      console.error(`Errore nel salvataggio dei dati:`, error)
      toast({
        title: "Errore",
        description: `Impossibile salvare i dati: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Annulla le modifiche
  const handleCancelEdit = () => {
    setEditedItem(item)
    setIsEditMode(false)
    if (isNewItem) {
      router.push(`/data-explorer?table=${tableName}`)
    }
  }

  // Elimina l'elemento
  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return

    setDeleting(true)
    try {
      console.log(`Eliminazione da tabella: ${tableName}, ID: ${itemId}`)

      const { error } = await supabase.from(tableName).delete().eq("id", itemId)

      if (error) {
        console.error("Errore eliminazione:", error)
        throw error
      }

      toast({
        title: "Eliminato",
        description: "L'elemento è stato eliminato con successo",
      })

      // Torna alla lista della tabella
      router.push(`/data-explorer?table=${tableName}`)
    } catch (error: any) {
      console.error(`Errore nell'eliminazione dell'elemento:`, error)
      toast({
        title: "Errore",
        description: `Impossibile eliminare l'elemento: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Renderizza un campo in base al tipo
  const renderField = (field: string, value: any, type: string, readOnly = false) => {
    // Ottieni il label del campo
    const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")

    // Se è in modalità visualizzazione, mostra solo il valore
    if (!isEditMode || readOnly) {
      return (
        <div className="mb-4" key={field}>
          <Label className="text-sm font-medium">{label}</Label>
          <div className={`mt-1 p-2 rounded-md ${readOnly ? "bg-gray-100" : ""}`}>{renderFieldValue(value, type)}</div>
        </div>
      )
    }

    // Altrimenti, mostra il campo di input appropriato
    switch (type) {
      case "text":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Textarea
              id={field}
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="mt-1"
              rows={4}
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
            <Label htmlFor={field}>{label}</Label>
            <EnhancedDatePicker
              id={field}
              value={value || ""}
              onChange={(newValue) => handleFieldChange(field, newValue)}
              placeholder={`Seleziona ${label.toLowerCase()}`}
              className="mt-1"
            />
          </div>
        )
      case "number":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Input
              id={field}
              type="number"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, Number.parseFloat(e.target.value))}
              className="mt-1"
            />
          </div>
        )
      case "select":
        const options = selectOptions[field] || []
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Select value={value || ""} onValueChange={(val) => handleFieldChange(field, val)}>
              <SelectTrigger className="mt-1">
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
      case "color":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <ColorPicker value={value || "#000000"} onChange={(val) => handleFieldChange(field, val)} />
          </div>
        )
      default:
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Input
              id={field}
              type="text"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="mt-1"
            />
          </div>
        )
    }
  }

  // Renderizza il valore di un campo in base al tipo
  const renderFieldValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "-"

    switch (type) {
      case "datetime":
        return formatDateIT(value)
      case "boolean":
        return value ? "✓" : "✗"
      case "number":
        return typeof value === "number" ? value.toLocaleString("it-IT") : value
      case "text":
        return <div className="whitespace-pre-wrap">{value}</div>
      case "json":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="secondary">
                  {String(item)}
                </Badge>
              ))}
            </div>
          )
        }
        return <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>
      case "color":
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: value || "#ffffff" }} />
            <span>{value || "-"}</span>
          </div>
        )
      default:
        return formatValue(value)
    }
  }

  // Ottieni il titolo della tabella
  const getTableTitle = () => {
    const table = AVAILABLE_TABLES.find((t) => t.id === tableName)
    return table ? table.label : "Dettaglio"
  }

  // Ottieni il titolo dell'elemento
  const getItemTitle = () => {
    if (isNewItem) return "Nuovo elemento"
    if (!item) return "Caricamento..."

    // Usa il campo più appropriato come titolo
    if (item.titolo) return item.titolo
    if (item.nome) {
      if (item.cognome) return `${item.nome} ${item.cognome}`
      return item.nome
    }
    return `ID: ${item.id}`
  }

  // Renderizza i gruppi di campi
  const renderFieldGroups = () => {
    if (!editedItem) return null

    // Ottieni tutti i campi dell'elemento
    const allFields = Object.keys(editedItem)

    // Crea tabs per i gruppi
    const tabs = Object.keys(fieldGroups)

    return (
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

                  // Gestione speciale per data_inizio e data_fine sulla stessa riga
                  if (field === "data_inizio" && groupFields.includes("data_fine") && allFields.includes("data_fine")) {
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
                          />
                        </div>
                      </div>
                    )
                  }

                  // Salta data_fine se è già stata renderizzata con data_inizio
                  if (
                    field === "data_fine" &&
                    groupFields.includes("data_inizio") &&
                    allFields.includes("data_inizio")
                  ) {
                    return null
                  }

                  return renderField(
                    field,
                    editedItem[field],
                    fieldTypes[field as keyof typeof fieldTypes] || "string",
                    isReadOnly,
                  )
                })}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    )
  }

  // Imposta i tab iniziali
  useEffect(() => {
    if (fieldGroups && Object.keys(fieldGroups).length > 0) {
      setActiveTab(Object.keys(fieldGroups)[0].toLowerCase().replace(/\s+/g, "-"))
    }
  }, [fieldGroups])

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
            <Button onClick={() => router.push("/data-explorer?table=" + tableName)}>
              <ArrowLeft size={16} className="mr-2" /> Torna alla lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Renderizza lo scheletro durante il caricamento
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
              <Button variant="ghost" onClick={() => router.push(`/data-explorer?table=${tableName}`)} className="mb-2">
                <ArrowLeft size={16} className="mr-2" /> Torna alla lista
              </Button>
              <CardTitle className="text-2xl">{getItemTitle()}</CardTitle>
              <CardDescription>
                {getTableTitle()}{" "}
                {!isNewItem && (
                  <Badge variant="outline" className="ml-2">
                    ID: {itemId}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {isEditMode && (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? "Salvataggio..." : "Salva modifiche"}
                    {!saving && <Save size={16} className="ml-2" />}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X size={16} className="mr-2" /> Annulla modifica
                  </Button>
                </>
              )}
              {!isNewItem && !isEditMode && (
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit size={16} className="mr-2" /> Modifica
                </Button>
              )}
              {!isNewItem && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 size={16} className="mr-2" /> Elimina
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
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? "Eliminazione..." : "Elimina"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>{editedItem && renderFieldGroups()}</CardContent>
      </Card>
    </div>
  )
}
