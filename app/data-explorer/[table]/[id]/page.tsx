"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { TagInput } from "@/components/ui/tag-input"
import { JsonEditor } from "@/components/ui/json-editor"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase-provider"
import Link from "next/link"

// Configurazione dei campi per ogni tabella
const TABLE_FIELDS = {
  utenti: {
    readOnly: ["id", "created_at", "updated_at", "ultimo_accesso"],
    fields: {
      username: { type: "text", label: "Username", required: true },
      email: { type: "email", label: "Email", required: true },
      nome: { type: "text", label: "Nome" },
      cognome: { type: "text", label: "Cognome" },
      ruolo: { type: "select", label: "Ruolo", options: ["admin", "user", "guest"] },
      attivo: { type: "boolean", label: "Attivo" },
      bio: { type: "textarea", label: "Biografia" },
      avatar_url: { type: "text", label: "URL Avatar" },
      preferenze: { type: "json", label: "Preferenze" },
      tags: { type: "tags", label: "Tag" },
    },
  },
  scadenze: {
    readOnly: ["id", "created_at", "updated_at"],
    fields: {
      titolo: { type: "text", label: "Titolo", required: true },
      descrizione: { type: "textarea", label: "Descrizione" },
      scadenza: { type: "datetime", label: "Data Scadenza", required: true },
      priorita: { type: "select", label: "Priorità", options: ["bassa", "media", "alta", "critica"] },
      stato: { type: "select", label: "Stato", options: ["pending", "in_progress", "completed", "cancelled"] },
      utente_id: { type: "text", label: "ID Utente" },
      completata: { type: "boolean", label: "Completata" },
      tags: { type: "tags", label: "Tag" },
      metadata: { type: "json", label: "Metadata" },
    },
  },
  appuntamenti: {
    readOnly: ["id", "created_at", "updated_at"],
    fields: {
      titolo: { type: "text", label: "Titolo", required: true },
      descrizione: { type: "textarea", label: "Descrizione" },
      data_inizio: { type: "datetime", label: "Data Inizio", required: true },
      data_fine: { type: "datetime", label: "Data Fine" },
      luogo: { type: "text", label: "Luogo" },
      partecipanti: { type: "tags", label: "Partecipanti" },
      stato: { type: "select", label: "Stato", options: ["programmato", "in_corso", "completato", "annullato"] },
      utente_id: { type: "text", label: "ID Utente" },
      promemoria: { type: "boolean", label: "Promemoria" },
      metadata: { type: "json", label: "Metadata" },
    },
  },
  progetti: {
    readOnly: ["id", "created_at", "updated_at"],
    fields: {
      nome: { type: "text", label: "Nome", required: true },
      descrizione: { type: "textarea", label: "Descrizione" },
      data_inizio: { type: "datetime", label: "Data Inizio" },
      data_fine: { type: "datetime", label: "Data Fine" },
      stato: { type: "select", label: "Stato", options: ["pianificazione", "in_corso", "completato", "sospeso"] },
      priorita: { type: "select", label: "Priorità", options: ["bassa", "media", "alta"] },
      budget: { type: "number", label: "Budget" },
      responsabile_id: { type: "text", label: "ID Responsabile" },
      team_members: { type: "tags", label: "Membri Team" },
      tags: { type: "tags", label: "Tag" },
      metadata: { type: "json", label: "Metadata" },
    },
  },
  attivita: {
    readOnly: ["id", "created_at", "updated_at"],
    fields: {
      titolo: { type: "text", label: "Titolo", required: true },
      descrizione: { type: "textarea", label: "Descrizione" },
      data_inizio: { type: "datetime", label: "Data Inizio" },
      data_fine: { type: "datetime", label: "Data Fine" },
      stato: { type: "select", label: "Stato", options: ["todo", "in_progress", "done"] },
      priorita: { type: "select", label: "Priorità", options: ["bassa", "media", "alta"] },
      progetto_id: { type: "text", label: "ID Progetto" },
      assegnato_a: { type: "text", label: "Assegnato a" },
      tags: { type: "tags", label: "Tag" },
      metadata: { type: "json", label: "Metadata" },
    },
  },
  note: {
    readOnly: ["id", "created_at", "updated_at"],
    fields: {
      titolo: { type: "text", label: "Titolo", required: true },
      contenuto: { type: "textarea", label: "Contenuto" },
      categoria: { type: "text", label: "Categoria" },
      tags: { type: "tags", label: "Tag" },
      pubblico: { type: "boolean", label: "Pubblico" },
      utente_id: { type: "text", label: "ID Utente" },
      metadata: { type: "json", label: "Metadata" },
    },
  },
  pagine: {
    readOnly: ["id", "created_at", "updated_at"],
    fields: {
      titolo: { type: "text", label: "Titolo", required: true },
      slug: { type: "text", label: "Slug", required: true },
      contenuto: { type: "textarea", label: "Contenuto" },
      stato: { type: "select", label: "Stato", options: ["bozza", "pubblicato", "archiviato"] },
      autore_id: { type: "text", label: "ID Autore" },
      tags: { type: "tags", label: "Tag" },
      metadata: { type: "json", label: "Metadata" },
    },
  },
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const tableName = params.table as string
  const recordId = params.id as string

  const [data, setData] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [originalData, setOriginalData] = useState<any>({})
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]

  useEffect(() => {
    if (supabase && tableName && recordId) {
      loadRecord()
    }
  }, [supabase, tableName, recordId])

  const loadRecord = async () => {
    try {
      setLoading(true)
      const { data: record, error } = await supabase.from(tableName).select("*").eq("id", recordId).single()

      if (error) {
        console.error("Errore nel caricamento del record:", error)
        toast({
          title: "Errore",
          description: "Impossibile caricare il record",
          variant: "destructive",
        })
        return
      }

      setData(record)
      setFormData({ ...record })
      setOriginalData({ ...record })
    } catch (error) {
      console.error("Errore nel caricamento del record:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel caricamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    console.log(`Modifica campo ${field}:`, value)

    const newData = { ...formData, [field]: value }

    // ✅ Auto-aggiornamento data_fine quando cambia data_inizio
    if (
      field === "data_inizio" &&
      value &&
      (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti")
    ) {
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

      toast({
        title: "Data fine aggiornata",
        description: "Data fine impostata automaticamente a +1 ora dalla data inizio",
      })
    }

    setFormData(newData)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Rimuovi i campi readonly
      const dataToSave = { ...formData }
      if (tableConfig?.readOnly) {
        tableConfig.readOnly.forEach((field) => {
          delete dataToSave[field]
        })
      }

      console.log("Salvataggio dati:", dataToSave)

      const { error } = await supabase.from(tableName).update(dataToSave).eq("id", recordId)

      if (error) {
        console.error("Errore nel salvataggio:", error)
        toast({
          title: "Errore",
          description: "Impossibile salvare le modifiche",
          variant: "destructive",
        })
        return
      }

      setData({ ...formData })
      setOriginalData({ ...formData })
      setIsEditing(false)

      toast({
        title: "Successo",
        description: "Record aggiornato con successo",
      })
    } catch (error) {
      console.error("Errore nel salvataggio:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel salvataggio",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({ ...originalData })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo record? L'azione non può essere annullata.")) {
      return
    }

    try {
      setDeleting(true)

      const { error } = await supabase.from(tableName).delete().eq("id", recordId)

      if (error) {
        console.error("Errore nell'eliminazione:", error)
        toast({
          title: "Errore",
          description: "Impossibile eliminare il record",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Successo",
        description: "Record eliminato con successo",
      })

      router.push(`/data-explorer/${tableName}`)
    } catch (error) {
      console.error("Errore nell'eliminazione:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore nell'eliminazione",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const renderField = (key: string, value: any, fieldConfig: any) => {
    const isReadOnly = tableConfig?.readOnly?.includes(key)
    const isViewMode = !isEditing || isReadOnly

    if (isViewMode) {
      // Modalità visualizzazione
      switch (fieldConfig?.type) {
        case "boolean":
          return (
            <div className="flex items-center space-x-2">
              <Switch checked={!!value} disabled />
              <span>{value ? "Sì" : "No"}</span>
            </div>
          )
        case "datetime":
          return <div className="text-sm">{value ? new Date(value).toLocaleString("it-IT") : "Non impostato"}</div>
        case "tags":
          return (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(value) && value.length > 0 ? (
                value.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Nessun tag</span>
              )}
            </div>
          )
        case "json":
          return (
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {value ? JSON.stringify(value, null, 2) : "{}"}
            </pre>
          )
        case "textarea":
          return <div className="text-sm whitespace-pre-wrap max-h-32 overflow-auto">{value || "Nessun contenuto"}</div>
        default:
          return <div className="text-sm">{value?.toString() || "Non impostato"}</div>
      }
    }

    // Modalità modifica
    switch (fieldConfig?.type) {
      case "text":
      case "email":
        return (
          <Input
            type={fieldConfig.type}
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            required={fieldConfig.required}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value ? Number(e.target.value) : null)}
            required={fieldConfig.required}
          />
        )
      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            rows={4}
            required={fieldConfig.required}
          />
        )
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch checked={!!value} onCheckedChange={(checked) => handleFieldChange(key, checked)} />
            <span>{value ? "Sì" : "No"}</span>
          </div>
        )
      case "select":
        return (
          <Select value={value || ""} onValueChange={(newValue) => handleFieldChange(key, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona..." />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "datetime":
        return (
          <EnhancedDatePicker
            value={value}
            onChange={(newValue) => handleFieldChange(key, newValue)}
            placeholder="Seleziona data e ora..."
          />
        )
      case "tags":
        return (
          <TagInput
            value={Array.isArray(value) ? value : []}
            onChange={(newTags) => handleFieldChange(key, newTags)}
            placeholder="Aggiungi tag..."
          />
        )
      case "json":
        return <JsonEditor value={value} onChange={(newValue) => handleFieldChange(key, newValue)} />
      default:
        return (
          <Input
            value={value?.toString() || ""}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            required={fieldConfig?.required}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Caricamento record...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !tableConfig) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Record non trovato</h1>
          <p className="text-muted-foreground mb-4">
            Il record richiesto non esiste o non hai i permessi per visualizzarlo.
          </p>
          <Link href={`/data-explorer/${tableName}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla lista
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/data-explorer/${tableName}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {tableName} - {data.id}
            </h1>
            <p className="text-muted-foreground">Dettagli del record</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Annulla
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
              <Button onClick={handleDelete} variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? "Eliminazione..." : "Elimina"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dettagli Record</span>
            {isEditing && <Badge variant="secondary">Modalità Modifica</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(formData).map(([key, value]) => {
              const fieldConfig = tableConfig.fields[key]
              const isReadOnly = tableConfig.readOnly?.includes(key)

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {fieldConfig?.label || key}
                      {fieldConfig?.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {isReadOnly && (
                      <Badge variant="outline" className="text-xs">
                        Solo lettura
                      </Badge>
                    )}
                  </div>
                  {renderField(key, value, fieldConfig)}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
