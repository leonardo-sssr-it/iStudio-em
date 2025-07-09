"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Trash2, Edit, Eye, Calendar } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
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

// Configurazione dei tipi di campo per tabella
const TABLE_CONFIGS: Record<
  string,
  Record<string, { type: string; label: string; required?: boolean; readOnly?: boolean }>
> = {
  appuntamenti: {
    id: { type: "number", label: "ID", readOnly: true },
    titolo: { type: "text", label: "Titolo", required: true },
    descrizione: { type: "textarea", label: "Descrizione" },
    data_inizio: { type: "datetime", label: "Data Inizio", required: true },
    data_fine: { type: "datetime", label: "Data Fine" },
    luogo: { type: "text", label: "Luogo" },
    partecipanti: { type: "textarea", label: "Partecipanti" },
    stato: { type: "text", label: "Stato" },
    priorita: { type: "text", label: "Priorità" },
    note: { type: "textarea", label: "Note" },
    created_at: { type: "datetime", label: "Creato il", readOnly: true },
    updated_at: { type: "datetime", label: "Aggiornato il", readOnly: true },
  },
  note: {
    id: { type: "number", label: "ID", readOnly: true },
    titolo: { type: "text", label: "Titolo", required: true },
    contenuto: { type: "textarea", label: "Contenuto" },
    categoria: { type: "text", label: "Categoria" },
    tags: { type: "text", label: "Tags" },
    pubblico: { type: "boolean", label: "Pubblico" },
    created_at: { type: "datetime", label: "Creato il", readOnly: true },
    updated_at: { type: "datetime", label: "Aggiornato il", readOnly: true },
  },
  pagine: {
    id: { type: "number", label: "ID", readOnly: true },
    titolo: { type: "text", label: "Titolo", required: true },
    contenuto: { type: "textarea", label: "Contenuto" },
    slug: { type: "text", label: "Slug" },
    pubblicato: { type: "boolean", label: "Pubblicato" },
    meta_description: { type: "textarea", label: "Meta Description" },
    created_at: { type: "datetime", label: "Creato il", readOnly: true },
    updated_at: { type: "datetime", label: "Aggiornato il", readOnly: true },
  },
}

interface RecordData {
  [key: string]: any
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<RecordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<RecordData>({})

  const tableName = params.table as string
  const recordId = params.id as string
  const isNewRecord = recordId === "new"

  const supabase = createClient()

  // Carica il record esistente
  useEffect(() => {
    if (isNewRecord) {
      setEditMode(true)
      setLoading(false)
      // Inizializza con valori di default
      const defaultData: RecordData = {}
      const config = TABLE_CONFIGS[tableName] || {}
      Object.entries(config).forEach(([field, fieldConfig]) => {
        if (fieldConfig.type === "boolean") {
          defaultData[field] = false
        } else if (fieldConfig.type === "datetime" && field.includes("data_inizio")) {
          // Per data_inizio, usa l'ora corrente arrotondata
          defaultData[field] = new Date().toISOString()
        }
      })
      setFormData(defaultData)
      return
    }

    const fetchRecord = async () => {
      try {
        const { data, error } = await supabase.from(tableName).select("*").eq("id", recordId).single()

        if (error) throw error

        setRecord(data)
        setFormData(data)
      } catch (error) {
        console.error("Error fetching record:", error)
        toast.error("Errore nel caricamento del record")
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [tableName, recordId, isNewRecord, supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Prepara i dati per il salvataggio
      const saveData = { ...formData }

      // Rimuovi campi readonly per gli update
      if (!isNewRecord) {
        delete saveData.id
        delete saveData.created_at
        delete saveData.updated_at
      }

      let result
      if (isNewRecord) {
        result = await supabase.from(tableName).insert([saveData]).select().single()
      } else {
        result = await supabase.from(tableName).update(saveData).eq("id", recordId).select().single()
      }

      if (result.error) throw result.error

      setRecord(result.data)
      setFormData(result.data)
      setEditMode(false)

      toast.success(isNewRecord ? "Record creato con successo" : "Record aggiornato con successo")

      if (isNewRecord) {
        router.replace(`/data-explorer/${tableName}/${result.data.id}`)
      }
    } catch (error) {
      console.error("Error saving record:", error)
      toast.error("Errore nel salvataggio del record")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNewRecord) return

    try {
      const { error } = await supabase.from(tableName).delete().eq("id", recordId)

      if (error) throw error

      toast.success("Record eliminato con successo")
      router.push(`/data-explorer`)
    } catch (error) {
      console.error("Error deleting record:", error)
      toast.error("Errore nell'eliminazione del record")
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Auto-set data_fine quando viene impostata data_inizio
    if (field === "data_inizio" && value && !formData.data_fine) {
      const startDate = new Date(value)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 ora
      setFormData((prev) => ({
        ...prev,
        data_fine: endDate.toISOString(),
      }))
    }
  }

  const renderField = (field: string, fieldConfig: any, value: any) => {
    const isReadOnly = fieldConfig.readOnly || (!editMode && !isNewRecord)

    switch (fieldConfig.type) {
      case "datetime":
        return (
          <EnhancedDatePicker
            value={value || ""}
            onChange={(newValue) => handleFieldChange(field, newValue)}
            readOnly={isReadOnly}
            showCurrentTime={field.includes("data_inizio")}
            onDateTimeSet={field === "data_inizio" ? (dateTime) => handleFieldChange("data_fine", dateTime) : undefined}
            placeholder={`Seleziona ${fieldConfig.label.toLowerCase()}`}
          />
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
              disabled={isReadOnly}
            />
            <span className="text-sm text-muted-foreground">{value ? "Sì" : "No"}</span>
          </div>
        )

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            readOnly={isReadOnly}
            rows={4}
            className={isReadOnly ? "bg-muted" : ""}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            readOnly={isReadOnly}
            className={isReadOnly ? "bg-muted" : ""}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            readOnly={isReadOnly}
            className={isReadOnly ? "bg-muted" : ""}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const config = TABLE_CONFIGS[tableName] || {}
  const title = isNewRecord ? `Nuovo ${tableName}` : `${tableName} #${recordId}`

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">
              Tabella: <Badge variant="secondary">{tableName}</Badge>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNewRecord && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizza
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sei sicuro di voler eliminare questo record? Questa azione non può essere annullata.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Elimina
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {(editMode || isNewRecord) && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dettagli Record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(config).map(([field, fieldConfig]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="flex items-center gap-2">
                  {fieldConfig.label}
                  {fieldConfig.required && <span className="text-destructive">*</span>}
                  {fieldConfig.readOnly && (
                    <Badge variant="outline" className="text-xs">
                      Solo lettura
                    </Badge>
                  )}
                </Label>
                {renderField(field, fieldConfig, formData[field])}
              </div>
            ))}
          </div>

          {(editMode || isNewRecord) && (
            <>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isNewRecord) {
                      router.back()
                    } else {
                      setEditMode(false)
                      setFormData(record || {})
                    }
                  }}
                >
                  Annulla
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvataggio..." : "Salva"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
