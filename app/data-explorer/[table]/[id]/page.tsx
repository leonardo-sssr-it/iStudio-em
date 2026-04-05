"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getTableConfig, getVisibleFields, getEditableFields, isFieldRequired, getFieldOptions } from "../../config"

interface RecordData {
  [key: string]: any
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { user } = useAuth()

  const table = params?.table as string
  const id = params?.id as string

  const [record, setRecord] = useState<RecordData | null>(null)
  const [editedRecord, setEditedRecord] = useState<RecordData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const tableConfig = getTableConfig(table)
  const visibleFields = getVisibleFields(table)
  const editableFields = getEditableFields(table)

  useEffect(() => {
    if (!table || !id || !supabase) return

    loadRecord()
  }, [table, id, supabase])

  const loadRecord = async () => {
    if (!supabase || !tableConfig) return

    try {
      setIsLoading(true)

      const { data, error } = await supabase.from(table).select("*").eq(tableConfig.primaryKey, id).single()

      if (error) {
        console.error("Errore caricamento record:", error)
        toast.error("Errore nel caricamento del record")
        return
      }

      setRecord(data)
      setEditedRecord(data)
    } catch (error) {
      console.error("Errore caricamento record:", error)
      toast.error("Errore nel caricamento del record")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!supabase || !tableConfig || !record) return

    try {
      setIsSaving(true)

      // Valida campi obbligatori
      const requiredFields = Object.entries(editableFields)
        .filter(([_, config]) => config.required)
        .map(([fieldName]) => fieldName)

      for (const fieldName of requiredFields) {
        if (!editedRecord[fieldName] && editedRecord[fieldName] !== 0 && editedRecord[fieldName] !== false) {
          toast.error(`Il campo ${fieldName} è obbligatorio`)
          return
        }
      }

      // Prepara i dati per l'aggiornamento
      const updateData: RecordData = {}
      Object.keys(editableFields).forEach((fieldName) => {
        if (editedRecord[fieldName] !== record[fieldName]) {
          updateData[fieldName] = editedRecord[fieldName]
        }
      })

      // Aggiungi timestamp di modifica se esiste
      if (tableConfig.fields.modifica || tableConfig.fields.updated_at) {
        const timestampField = tableConfig.fields.modifica ? "modifica" : "updated_at"
        updateData[timestampField] = new Date().toISOString()
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("Nessuna modifica da salvare")
        setIsEditing(false)
        return
      }

      const { error } = await supabase.from(table).update(updateData).eq(tableConfig.primaryKey, id)

      if (error) {
        console.error("Errore salvataggio:", error)
        toast.error("Errore nel salvataggio")
        return
      }

      toast.success("Record aggiornato con successo")
      setIsEditing(false)
      loadRecord() // Ricarica i dati aggiornati
    } catch (error) {
      console.error("Errore salvataggio:", error)
      toast.error("Errore nel salvataggio")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!supabase || !tableConfig || !record) return

    if (!confirm("Sei sicuro di voler eliminare questo record?")) return

    try {
      const { error } = await supabase.from(table).delete().eq(tableConfig.primaryKey, id)

      if (error) {
        console.error("Errore eliminazione:", error)
        toast.error("Errore nell'eliminazione")
        return
      }

      toast.success("Record eliminato con successo")
      router.push(`/data-explorer/${table}`)
    } catch (error) {
      console.error("Errore eliminazione:", error)
      toast.error("Errore nell'eliminazione")
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedRecord((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const renderFieldValue = (fieldName: string, value: any, config: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }

    switch (config.type) {
      case "boolean":
        return <Badge variant={value ? "default" : "secondary"}>{value ? "Sì" : "No"}</Badge>
      case "date":
      case "datetime":
        return new Date(value).toLocaleString("it-IT")
      case "array":
        if (Array.isArray(value)) {
          return value.map((item, index) => (
            <Badge key={index} variant="outline" className="mr-1">
              {item}
            </Badge>
          ))
        }
        return String(value)
      case "json":
        return (
          <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(value, null, 2)}</pre>
        )
      case "textarea":
        return <div className="whitespace-pre-wrap max-h-32 overflow-auto">{String(value)}</div>
      default:
        return String(value)
    }
  }

  const renderFieldInput = (fieldName: string, value: any, config: any) => {
    const commonProps = {
      value: value || "",
      onChange: (e: any) => handleFieldChange(fieldName, e.target.value),
      placeholder: config.placeholder,
      required: config.required,
    }

    switch (config.type) {
      case "boolean":
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
            className="w-4 h-4"
          />
        )
      case "number":
        return (
          <Input
            type="number"
            {...commonProps}
            onChange={(e) => handleFieldChange(fieldName, Number.parseFloat(e.target.value) || 0)}
          />
        )
      case "date":
        return <Input type="date" {...commonProps} value={value ? new Date(value).toISOString().split("T")[0] : ""} />
      case "datetime":
        return (
          <Input
            type="datetime-local"
            {...commonProps}
            value={value ? new Date(value).toISOString().slice(0, 16) : ""}
          />
        )
      case "select":
        return (
          <select
            {...commonProps}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Seleziona...</option>
            {getFieldOptions(table, fieldName).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case "textarea":
        return <Textarea {...commonProps} rows={4} />
      case "array":
        return (
          <Input
            {...commonProps}
            value={Array.isArray(value) ? value.join(", ") : value || ""}
            onChange={(e) =>
              handleFieldChange(
                fieldName,
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Elementi separati da virgola"
          />
        )
      case "json":
        return (
          <Textarea
            {...commonProps}
            value={typeof value === "object" ? JSON.stringify(value, null, 2) : value || ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleFieldChange(fieldName, parsed)
              } catch {
                handleFieldChange(fieldName, e.target.value)
              }
            }}
            rows={6}
            placeholder="JSON valido"
          />
        )
      default:
        return <Input {...commonProps} />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Caricamento...</div>
        </div>
      </div>
    )
  }

  if (!record || !tableConfig) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Record non trovato</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/data-explorer/${table}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <h1 className="text-2xl font-bold">
            {tableConfig.displayName} - {record[tableConfig.primaryKey]}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setEditedRecord(record)
                }}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Annulla
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvataggio..." : "Salva"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Modifica Record" : "Dettagli Record"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(visibleFields).map(([fieldName, fieldConfig]) => (
              <div key={fieldName} className="space-y-2">
                <label className="text-sm font-medium">
                  {fieldName}
                  {isFieldRequired(table, fieldName) && <span className="text-red-500 ml-1">*</span>}
                </label>
                {isEditing && !fieldConfig.readonly ? (
                  renderFieldInput(fieldName, editedRecord[fieldName], fieldConfig)
                ) : (
                  <div className="min-h-[40px] flex items-start">
                    {renderFieldValue(fieldName, record[fieldName], fieldConfig)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
