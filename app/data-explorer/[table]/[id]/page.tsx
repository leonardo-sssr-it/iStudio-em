"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeft, Save, Trash2, Edit, Eye, Calendar } from "lucide-react"
import { formatValue } from "@/lib/utils-db"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: "📅" },
  { id: "attivita", label: "Attività", icon: "📋" },
  { id: "scadenze", label: "Scadenze", icon: "⏰" },
  { id: "todolist", label: "To-Do List", icon: "✓" },
  { id: "progetti", label: "Progetti", icon: "📊" },
  { id: "clienti", label: "Clienti", icon: "👥" },
]

// Definizione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    listFields: ["id", "titolo", "data_inizio", "data_fine", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
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
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita"],
      "Date e orari": ["data_inizio", "data_fine"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  attivita: {
    listFields: ["id", "titolo", "data_inizio", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
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
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita"],
      "Date e orari": ["data_inizio", "data_fine"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  scadenze: {
    listFields: ["id", "titolo", "data_scadenza", "stato", "priorita"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "data_scadenza",
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_scadenza: "datetime",
      stato: "string",
      priorita: "number",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "stato", "priorita"],
      Date: ["data_scadenza"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  todolist: {
    listFields: ["id", "titolo", "completato", "priorita", "data_scadenza"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "priorita",
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
    groups: {
      "Informazioni principali": ["titolo", "descrizione", "completato", "priorita"],
      Date: ["data_scadenza"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  progetti: {
    listFields: ["id", "nome", "stato", "data_inizio", "data_fine", "budget"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
    defaultSort: "data_inizio",
    types: {
      id: "number",
      nome: "string",
      descrizione: "text",
      stato: "string",
      data_inizio: "datetime",
      data_fine: "datetime",
      budget: "number",
      note: "text",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni principali": ["nome", "descrizione", "stato", "budget"],
      Date: ["data_inizio", "data_fine"],
      "Note e dettagli": ["note"],
      "Informazioni di sistema": ["id", "id_utente", "data_creazione", "modifica"],
    },
  },
  clienti: {
    listFields: ["id", "nome", "cognome", "email", "telefono", "citta"],
    readOnlyFields: ["id", "id_utente", "data_creazione", "modifica"],
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
      data_creazione: "datetime",
      modifica: "datetime",
    },
    groups: {
      "Informazioni personali": ["nome", "cognome", "email", "telefono"],
      Indirizzo: ["citta", "indirizzo", "cap"],
      "Informazioni fiscali": ["piva", "codfisc"],
      "Note e dettagli": ["note"],
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

// Componente principale
export default function ItemDetailPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get("edit") === "true" || params.id === "new"
  const isNewItem = params.id === "new"

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [item, setItem] = useState<any>(null)
  const [editedItem, setEditedItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("main")

  const tableName = params.table as string
  const itemId = params.id as string

  // Ottieni la configurazione della tabella
  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const readOnlyFields = tableConfig?.readOnlyFields || []
  const fieldTypes = tableConfig?.types || {}
  const fieldGroups = tableConfig?.groups || {}

  // Carica i dati dell'elemento
  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !user?.id) return

    setLoading(true)
    try {
      if (isNewItem) {
        // Crea un nuovo elemento vuoto
        const newItem: any = {
          id_utente: user.id,
        }
        setItem(newItem)
        setEditedItem(newItem)
        setLoading(false)
        return
      }

      // Carica l'elemento esistente
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", itemId)
        .eq("id_utente", user.id)
        .single()

      if (error) {
        throw error
      }

      setItem(data)
      setEditedItem(data)
    } catch (error: any) {
      console.error(`Errore nel caricamento dell'elemento:`, error)
      toast({
        title: "Errore",
        description: `Impossibile caricare i dati: ${error.message}`,
        variant: "destructive",
      })
      router.push(`/data-explorer`)
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, isNewItem, router])

  // Carica i dati all'avvio
  useEffect(() => {
    if (supabase && user?.id) {
      loadItem()
    }
  }, [supabase, user?.id, loadItem])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    setEditedItem((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Salva le modifiche
  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id || !editedItem) return

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

      // Salva i dati
      let result
      if (isNewItem) {
        result = await supabase.from(tableName).insert(updateData).select()
      } else {
        result = await supabase.from(tableName).update(updateData).eq("id", itemId).select()
      }

      if (result.error) {
        throw result.error
      }

      toast({
        title: "Salvato",
        description: "I dati sono stati salvati con successo",
      })

      // Aggiorna i dati locali
      setItem(result.data[0])
      setEditedItem(result.data[0])

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

  // Elimina l'elemento
  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId) return

    setDeleting(true)
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", itemId)

      if (error) {
        throw error
      }

      toast({
        title: "Eliminato",
        description: "L'elemento è stato eliminato con successo",
      })

      // Torna alla lista
      router.push(`/data-explorer`)
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
            <div className="flex items-center mt-1">
              <Input
                id={field}
                type="datetime-local"
                value={formatDateForInput(value)}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="flex-grow"
              />
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => handleFieldChange(field, new Date().toISOString())}
                className="ml-2"
              >
                <Calendar size={16} />
              </Button>
            </div>
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
              <Button variant="ghost" onClick={() => router.push("/data-explorer")} className="mb-2">
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
              {!isNewItem && !isEditMode && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/data-explorer/${tableName}/${itemId}?edit=true`)}
                >
                  <Edit size={16} className="mr-2" /> Modifica
                </Button>
              )}
              {!isNewItem && isEditMode && (
                <Button variant="outline" onClick={() => router.push(`/data-explorer/${tableName}/${itemId}`)}>
                  <Eye size={16} className="mr-2" /> Visualizza
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
        {isEditMode && (
          <CardFooter className="flex justify-end border-t bg-white pt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            >
              {saving ? "Salvataggio..." : "Salva modifiche"}
              {!saving && <Save size={16} className="ml-2" />}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
