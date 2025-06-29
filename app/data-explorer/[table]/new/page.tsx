"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { parseISO, formatISO } from "date-fns"
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
} from "lucide-react"

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
export default function NewItemPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [priorityOptions, setPriorityOptions] = useState<any[]>([])

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

      if (tableName === "note") {
        initialData.titolo = ""
        initialData.contenuto = ""
        initialData.priorita = 2
        initialData.synced = false
      }

      if (tableName === "scadenze") {
        initialData.titolo = ""
        initialData.stato = "attivo"
        initialData.privato = false
      }

      setFormData(initialData)
    }
  }, [tableConfig, user, tableName])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value }

      // Preimposta data_fine se data_inizio cambia e data_fine è vuota o non impostata
      if (field === "data_inizio" && value) {
        try {
          const startDate = parseISO(value)
          if (!newData.data_fine) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
            newData.data_fine = formatISO(endDate)
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
            <CheckCircle2 className="\
