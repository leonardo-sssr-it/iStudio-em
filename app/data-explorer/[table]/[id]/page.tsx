"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { formatDateDisplay } from "@/lib/date-utils"
import { Calendar, CheckSquare, Clock, ListTodo, Briefcase, Users, FileText, StickyNote, User } from "lucide-react"

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
  { id: "utenti", label: "Utenti", icon: User },
]

// Configurazione dei campi per ogni tabella (CORRETTA e CONSISTENTE)
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
        icon: Calendar,
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
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita", "data_inizio", "data_fine"],
      "Note e dettagli": ["note", "luogo", "attivo", "tags", "notifica"],
      "Informazioni di sistema": ["id", "id_utente", "modifica", "id_pro", "id_app", "id_cli"],
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
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "scadenza"],
      Dettagli: ["note", "notifica", "privato", "id_pro"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
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
    groups: {
      "Informazioni principali": [
        "titolo",
        "descrizione",
        "scadenza",
        "stato",
        "priorita",
        "note",
        "completato",
        "notifica",
      ],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
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
      "Note e dettagli": ["note", "allegati", "notifica"],
      "Informazioni di sistema": ["id", "id_utente", "modifica", "attivo", "id_att", "id_app", "id_cli", "id_sca"],
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
    groups: {
      "Informazioni principali": ["titolo", "slug", "stato", "categoria", "pubblicato", "privato", "attivo"],
      Contenuto: ["estratto", "contenuto", "immagine"],
      SEO: ["meta_title", "meta_description", "tags"],
      "Informazioni di sistema": ["id", "id_utente", "modifica"],
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
    groups: {
      "Informazioni principali": ["titolo", "contenuto", "priorita"],
      Dettagli: ["tags", "notifica", "notebook_id", "synced"],
      "Informazioni di sistema": ["id", "data_creazione", "modifica", "id_utente"],
    },
  },
  utenti: {
    requiredFields: ["username", "email", "password"],
    autoFields: ["id", "data_creazione", "ultimo_accesso"],
    defaultValues: {
      ruolo: "user",
      attivo: true,
    },
    types: {
      id: "string",
      username: "string",
      email: "string",
      password: "password",
      nome: "string",
      cognome: "string",
      ruolo: "select",
      attivo: "boolean",
      ultimo_accesso: "datetime",
      data_creazione: "datetime",
    },
    selectOptions: {
      ruolo: [
        { value: "admin", label: "Amministratore" },
        { value: "user", label: "Utente" },
        { value: "guest", label: "Ospite" },
      ],
    },
    groups: {
      "Informazioni principali": ["username", "email", "password", "ruolo", "attivo"],
      "Dati personali": ["nome", "cognome"],
      "Informazioni di sistema": ["id", "data_creazione", "ultimo_accesso"],
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

  const tableName = Array.isArray(params.table) ? params.table[0] : params.table
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id
  const isValidTable = AVAILABLE_TABLES.some((table) => table.id === tableName)

  if (!isValidTable && tableName) console.error(`Tabella non valida: ${tableName}`)

  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const autoFields = tableConfig?.autoFields || []
  const requiredFields = tableConfig?.requiredFields || []
  const fieldTypes = tableConfig?.types || {}
  const fieldGroups = tableConfig?.groups || {}
  const selectOptions = tableConfig?.selectOptions || {}

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
    if (!supabase || !tableName || !isValidTable) return
    setLoading(true)
    try {
      if (isNewItem) {
        const newItem: any = {}

        // Per la tabella utenti, non usiamo id_utente come filtro
        if (tableName !== "utenti" && user?.id) {
          newItem.id_utente = user.id
        }

        setItem(newItem)
        setEditedItem(newItem)
        setLoading(false)
        return
      }

      // Per la tabella utenti, non filtriamo per id_utente
      let query = supabase.from(tableName).select("*").eq("id", itemId)

      if (tableName !== "utenti" && user?.id) {
        query = query.eq("id_utente", user.id)
      }

      const { data, error } = await query.single()

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
    if (supabase && tableName && isValidTable) loadItem()
  }, [supabase, loadItem, tableName, isValidTable])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    console.log(`Campo ${field} cambiato a:`, value)
    setEditedItem((prev: any) => {
      const newData = { ...prev, [field]: value }

      // ✅ AGGIUNTA: Auto-aggiornamento data_fine quando cambia data_inizio
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

          // Mostra un toast per informare l'utente
          toast({
            title: "Data fine aggiornata",
            description: "Data fine impostata automaticamente a +1 ora dalla data inizio",
          })
        } catch (e) {
          console.warn("Errore nell'aggiornamento automatico di data_fine:", e)
        }
      }

      return newData
    })

    // Rimuovi l'errore quando il campo viene modificato
    if (validationErrors.some((error) => error.includes(field))) {
      setValidationErrors((prevErrors) => prevErrors.filter((error) => !error.includes(field)))
    }
  }

  const handleSave = async () => {
    if (!supabase || !tableName || !editedItem || !isValidTable) return
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
      const updateData = cleanDataForSave(editedItem, isNewItem ? autoFields : [])

      // Per le tabelle che hanno il campo modifica
      if (fieldTypes.modifica) {
        updateData.modifica = new Date().toISOString()
      }

      if (isNewItem) {
        // Solo per tabelle che usano id_utente
        if (tableName !== "utenti" && user?.id) {
          updateData.id_utente = user.id
        }
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

  // Renderizza un campo del form - QUESTA È LA PARTE CORRETTA DAL NEW PAGE
  const renderField = (field: string) => {
    const fieldType = fieldTypes[field]
    const fieldValue = editedItem[field]
    const hasError = validationErrors.some((error) => error.includes(field))
    const isRequired = requiredFields.includes(field)

    // Non renderizzare i campi automatici
    if (autoFields.includes(field)) return null

    const commonProps = {
      id: field,
      value: fieldValue || "",
      onChange: (e: any) => handleFieldChange(field, e.target.value),
      className: hasError ? "border-red-500" : "",
    }

    console.log(`Rendering field: ${field}, type: ${fieldType}, isEditMode: ${isEditMode}`)

    // MODALITÀ VISUALIZZAZIONE
    if (!isEditMode) {
      let displayValue = fieldValue
      if (fieldType === "datetime") {
        displayValue = formatDateDisplay(fieldValue)
      } else if (fieldType === "boolean") {
        displayValue = fieldValue ? "✓" : "✗"
      } else if (fieldType === "priority_select") {
        const priorityOption = priorityOptions.find((option) => option.value === fieldValue)
        displayValue = priorityOption ? priorityOption.nome : fieldValue
      } else {
        displayValue = formatValue(fieldValue)
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

    // MODALITÀ MODIFICA
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
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
            <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}</Label>
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
          </div>
        )

      case "priority_select":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
          </div>
        )

      case "color":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}</Label>
            <ColorPicker value={fieldValue || ""} onChange={(value) => handleFieldChange(field, value)} />
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
            {hasError && <p className="text-sm text-red-500">Campo obbligatorio</p>}
          </div>
        )
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
    if (item.username) return item.username
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
                    if (!allFields.includes(field) && !isNewItem) return null
                    return renderField(field)
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
            <Button onClick={() => router.push("/data-explorer")}>
              <ArrowLeft size={16} className="mr-2" /> Torna a Data Explorer
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
              <Button variant="ghost" onClick={() => router.push(`/data-explorer?table=${tableName}`)} className="mb-2">
                <ArrowLeft size={16} className="mr-2" /> Torna alla lista
              </Button>
              <CardTitle className="text-2xl">{getItemTitle()}</CardTitle>
              <div className="flex items-center">
                <CardDescription>{getTableTitle()}</CardDescription>
                {!isNewItem && (
                  <Badge variant="outline" className="ml-2">
                    ID: {itemId}
                  </Badge>
                )}
              </div>
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
