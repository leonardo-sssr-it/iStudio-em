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
import { ArrowLeft, Save, Trash2, Edit, X } from "lucide-react" // Rinominato Calendar per evitare conflitti
import { formatValue } from "@/lib/utils-db"
import { cn } from "@/lib/utils"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker" // Assicurati sia importato
import { TagInput } from "@/components/ui/tag-input" // Importa TagInput

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

// Componente ColorPicker (copiato da new/page.tsx per consistenza)
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

// Definizione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato"], // Rimosso priorita
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_pro", "id_att", "id_cli", "data_creazione"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "string", // Cambiato in string per visualizzazione, ma potrebbe essere select in modifica
      note: "text",
      luogo: "string",
      tags: "tags", // Aggiunto tipo tags
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "data_inizio", "data_fine"], // Rimosso priorita
      "Note e dettagli": ["luogo", "note", "tags"], // Aggiunto tags
      "Informazioni di sistema": [
        "id",
        "id_utente",
        "data_creazione",
        "modifica",
        "attivo",
        "id_pro",
        "id_att",
        "id_cli",
      ],
    },
    selectOptions: {
      // Aggiunto per coerenza con la pagina 'new' se si vuole usare Select in modifica
      stato: [
        { value: "pianificato", label: "Pianificato" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "annullato", label: "Annullato" },
      ],
    },
  },
  attivita: {
    listFields: ["id", "titolo", "data_inizio", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_pro", "id_app", "id_cli", "data_creazione"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "string",
      priorita: "number",
      note: "text",
      tags: "tags",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita", "data_inizio", "data_fine"],
      "Note e dettagli": ["note", "luogo", "tags"],
      "Informazioni di sistema": [
        "id",
        "id_utente",
        "data_creazione",
        "modifica",
        "attivo",
        "id_pro",
        "id_app",
        "id_cli",
      ],
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "data_scadenza", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "modifica", "data_creazione"],
    defaultSort: "data_scadenza",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_scadenza: "datetime",
      stato: "string",
      priorita: "number",
      note: "text",
      tags: "tags",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita"],
      Date: ["data_scadenza"],
      "Note e dettagli": ["note", "tags"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  todolist: {
    listFields: ["id", "titolo", "completato", "priorita", "data_scadenza"],
    readOnlyFields: ["id", "id_utente", "modifica", "data_creazione"],
    defaultSort: "priorita",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      completato: "boolean",
      priorita: "number",
      data_scadenza: "datetime",
      note: "text",
      tags: "tags",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "completato", "priorita"],
      Date: ["data_scadenza"],
      "Note e dettagli": ["note", "tags"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  progetti: {
    listFields: ["id", "nome", "stato", "data_inizio", "data_fine", "budget"],
    readOnlyFields: ["id", "id_utente", "modifica", "attivo", "id_att", "id_app", "id_cli", "id_sca", "data_creazione"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      nome: "string",
      descrizione: "text",
      stato: "string",
      colore: "color", // Aggiunto tipo color
      gruppo: "string",
      budget: "number",
      data_inizio: "datetime",
      data_fine: "datetime",
      avanzamento: "number",
      note: "text",
      tags: "tags",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
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
      "Note e dettagli": ["note", "tags"],
      "Informazioni di sistema": [
        "id",
        "id_utente",
        "data_creazione",
        "modifica",
        "attivo",
        "id_att",
        "id_app",
        "id_cli",
        "id_sca",
      ],
    },
  },
  clienti: {
    listFields: ["id", "nome", "cognome", "email", "telefono", "citta"],
    readOnlyFields: ["id", "id_utente", "modifica", "data_creazione"],
    defaultSort: "cognome",
    types: {
      id: "number",
      nome: "string",
      cognome: "string",
      email: "email", // Usare 'email' per validazione input
      telefono: "tel", // Usare 'tel' per validazione input
      citta: "string",
      indirizzo: "string",
      cap: "string",
      piva: "string",
      codfisc: "string",
      note: "text",
      tags: "tags",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni personali": ["nome", "cognome", "email", "telefono"],
      Indirizzo: ["citta", "indirizzo", "cap"],
      "Informazioni fiscali": ["piva", "codfisc"],
      "Note e dettagli": ["note", "tags"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  pagine: {
    listFields: ["id", "titolo", "slug", "stato", "data_creazione"],
    readOnlyFields: ["id", "id_utente", "modifica", "data_creazione"],
    defaultSort: "data_creazione",
    types: {
      id: "number",
      titolo: "string",
      slug: "string",
      contenuto: "richtext", // Potrebbe richiedere un editor specifico
      stato: "string",
      meta_title: "string",
      meta_description: "text",
      tags: "tags",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "slug", "stato"],
      Contenuto: ["contenuto"],
      SEO: ["meta_title", "meta_description"],
      "Note e dettagli": ["tags"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
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

  const isValidTable = AVAILABLE_TABLES.some((table) => table.id === tableName)

  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const readOnlyFields = tableConfig?.readOnlyFields || []
  const fieldTypes = tableConfig?.types || {}
  const fieldGroups = tableConfig?.groups || {}
  const selectOptions = tableConfig?.selectOptions || {} // Aggiunto per Select in modifica

  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !user?.id || !isValidTable) {
      return
    }

    setLoading(true)
    try {
      if (isNewItem) {
        const newItemData: any = { id_utente: user.id }
        // Inizializza i campi con i defaultValues dalla configurazione della pagina 'new'
        const currentTableConfigForNew = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
        if (currentTableConfigForNew && currentTableConfigForNew.defaultValues) {
          Object.assign(newItemData, currentTableConfigForNew.defaultValues)
        }
        setItem(newItemData)
        setEditedItem(newItemData)
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
      toast({
        title: "Errore",
        description: `Impossibile caricare i dati: ${error.message}`,
        variant: "destructive",
      })
      router.push(`/data-explorer`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, isNewItem, router, isValidTable])

  useEffect(() => {
    if (supabase && user?.id && tableName && isValidTable) {
      loadItem()
    }
  }, [supabase, user?.id, loadItem, tableName, isValidTable])

  const handleFieldChange = (field: string, value: any) => {
    setEditedItem((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id || !editedItem || !isValidTable) return

    setSaving(true)
    try {
      const updateData = { ...editedItem }
      updateData.modifica = new Date().toISOString()

      if (isNewItem) {
        updateData.id_utente = user.id
        if (!updateData.data_creazione) {
          // Assicura che data_creazione sia impostata per i nuovi item
          updateData.data_creazione = new Date().toISOString()
        }
      }

      // Rimuovi i campi read-only che non dovrebbero essere inviati (eccetto id per l'update)
      const dataToSend = { ...updateData }
      if (!isNewItem) {
        // Per gli update, non inviare id_utente o data_creazione se sono read-only
        readOnlyFields.forEach((field) => {
          if (field !== "id" && field !== "modifica") {
            // 'id' e 'modifica' sono gestiti
            delete dataToSend[field]
          }
        })
      }

      let result
      if (isNewItem) {
        // Rimuovi l'id se presente, sarà auto-generato
        const { id, ...insertData } = dataToSend
        result = await supabase.from(tableName).insert(insertData).select()
      } else {
        const { id, ...updatePayload } = dataToSend // L'ID è usato nell'eq, non nel payload
        result = await supabase.from(tableName).update(updatePayload).eq("id", itemId).select()
      }

      if (result.error) throw result.error

      toast({
        title: "Salvato",
        description: "I dati sono stati salvati con successo",
      })

      setItem(result.data[0])
      setEditedItem(result.data[0])
      setIsEditMode(false)

      if (isNewItem) {
        router.push(`/data-explorer/${tableName}/${result.data[0].id}`)
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile salvare i dati: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedItem(item)
    setIsEditMode(false)
    if (isNewItem) {
      router.push(`/data-explorer`)
    }
  }

  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return

    setDeleting(true)
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", itemId)
      if (error) throw error
      toast({
        title: "Eliminato",
        description: "L'elemento è stato eliminato con successo",
      })
      router.push(`/data-explorer`)
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

  const renderField = (field: string, value: any, type: string, readOnlyField = false) => {
    const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
    const isActuallyReadOnly = readOnlyField || readOnlyFields.includes(field)

    if (!isEditMode || isActuallyReadOnly) {
      return (
        <div className="mb-4" key={field}>
          <Label className="text-sm font-medium">{label}</Label>
          <div className={`mt-1 p-2 rounded-md ${isActuallyReadOnly ? "bg-gray-100 dark:bg-gray-800" : ""}`}>
            {renderFieldValue(value, type)}
          </div>
        </div>
      )
    }

    // Logica per la modalità modifica
    switch (type) {
      case "text":
      case "richtext": // richtext potrebbe necessitare di un editor specifico
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Textarea
              id={field}
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="mt-1"
              rows={type === "richtext" ? 6 : 3}
            />
          </div>
        )
      case "boolean":
        return (
          <div className="flex items-center space-x-2 mb-4" key={field}>
            <Switch id={field} checked={!!value} onCheckedChange={(checked) => handleFieldChange(field, checked)} />
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
              onChange={(val) => handleFieldChange(field, val)}
              className="mt-1 w-full"
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
              onChange={(e) =>
                handleFieldChange(field, e.target.value === "" ? null : Number.parseFloat(e.target.value))
              }
              className="mt-1"
            />
          </div>
        )
      case "tags":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <TagInput
              id={field}
              value={Array.isArray(value) ? value : value ? String(value).split(",") : []}
              onChange={(tags) => handleFieldChange(field, tags)}
              className="mt-1"
              placeholder={`Aggiungi ${label.toLowerCase()}`}
            />
          </div>
        )
      case "color":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <ColorPicker value={value || ""} onChange={(val) => handleFieldChange(field, val)} />
          </div>
        )
      case "select": // Aggiunto per gestire i select in modifica
        const options =
          selectOptions && selectOptions[field as keyof typeof selectOptions]
            ? selectOptions[field as keyof typeof selectOptions]
            : []
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <select
              id={field}
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Seleziona...</option>
              {options.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )
      case "email":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Input
              id={field}
              type="email"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="mt-1"
            />
          </div>
        )
      case "tel":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Input
              id={field}
              type="tel"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="mt-1"
            />
          </div>
        )
      default: // string e altri non specificati
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

  const renderFieldValue = (value: any, type: string) => {
    if (value === null || value === undefined || value === "") return "-"

    switch (type) {
      case "datetime":
        return formatDateIT(value)
      case "boolean":
        return value ? "Sì" : "No"
      case "number":
        return typeof value === "number" ? value.toLocaleString("it-IT") : value
      case "text":
      case "richtext":
        return <div className="whitespace-pre-wrap">{value}</div>
      case "tags":
        if (Array.isArray(value)) {
          return value.map((tag) => (
            <Badge key={tag} variant="secondary" className="mr-1 mb-1">
              {tag}
            </Badge>
          ))
        }
        return String(value)
          .split(",")
          .map((tag) => (
            <Badge key={tag} variant="secondary" className="mr-1 mb-1">
              {tag.trim()}
            </Badge>
          ))
      case "color":
        return (
          <div className="flex items-center space-x-2">
            <div style={{ backgroundColor: value }} className="w-6 h-6 rounded border"></div>
            <span>{value}</span>
          </div>
        )
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
    const allFieldsInItem = Object.keys(editedItem)
    const tabsToRender = Object.keys(fieldGroups).filter((groupName) =>
      fieldGroups[groupName as keyof typeof fieldGroups].some((field) => allFieldsInItem.includes(field)),
    )

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-none lg:flex">
          {tabsToRender.map((group) => (
            <TabsTrigger key={group} value={group.toLowerCase().replace(/\s+/g, "-")} className="capitalize">
              {group}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsToRender.map((group) => {
          const groupFields = fieldGroups[group as keyof typeof fieldGroups] || []
          return (
            <TabsContent key={group} value={group.toLowerCase().replace(/\s+/g, "-")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {groupFields.map((field) => {
                  if (!allFieldsInItem.includes(field) && !isNewItem) return null // Non renderizzare se il campo non è nei dati (per item esistenti)
                  // Per i nuovi item, renderizza tutti i campi definiti nel gruppo, anche se non ancora in editedItem
                  const fieldType = fieldTypes[field as keyof typeof fieldTypes] || "string"
                  const fieldValue = editedItem[field]

                  // Per i nuovi item, se il campo non è in editedItem ma ha un default value, usalo
                  const valueToRender =
                    isNewItem &&
                    fieldValue === undefined &&
                    tableConfig?.defaultValues?.[field as keyof typeof tableConfig.defaultValues] !== undefined
                      ? tableConfig.defaultValues[field as keyof typeof tableConfig.defaultValues]
                      : fieldValue

                  return (
                    <div
                      key={field}
                      className={cn(
                        (fieldType === "text" || fieldType === "richtext" || fieldType === "tags") && "md:col-span-2",
                      )}
                    >
                      {renderField(field, valueToRender, fieldType, readOnlyFields.includes(field))}
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    )
  }

  useEffect(() => {
    if (fieldGroups && Object.keys(fieldGroups).length > 0) {
      const firstGroupKey = Object.keys(fieldGroups)[0]
      if (firstGroupKey) {
        setActiveTab(firstGroupKey.toLowerCase().replace(/\s+/g, "-"))
      }
    }
  }, [fieldGroups])

  if (tableName && !isValidTable) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Errore</CardTitle>
            <CardDescription>La tabella "{tableName}" non è disponibile.</CardDescription>
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full md:col-span-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Button variant="ghost" onClick={() => router.push("/data-explorer")} className="mb-2 -ml-4 sm:ml-0">
                <ArrowLeft size={16} className="mr-2" /> Torna alla lista
              </Button>
              <CardTitle className="text-2xl">{getItemTitle()}</CardTitle>
              <CardDescription>
                {getTableTitle()}{" "}
                {!isNewItem && item?.id && (
                  <Badge variant="outline" className="ml-2">
                    ID: {item.id}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {isEditMode ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      "Salvataggio..."
                    ) : (
                      <>
                        <Save size={16} className="mr-2" /> Salva modifiche
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                    <X size={16} className="mr-2" /> Annulla
                  </Button>
                </>
              ) : (
                !isNewItem && (
                  <Button variant="outline" onClick={() => setIsEditMode(true)} className="w-full sm:w-auto">
                    <Edit size={16} className="mr-2" /> Modifica
                  </Button>
                )
              )}
              {!isNewItem && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      <Trash2 size={16} className="mr-2" /> Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                      <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
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
