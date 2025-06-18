"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Input } from "@/components/ui/input"

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
  },
