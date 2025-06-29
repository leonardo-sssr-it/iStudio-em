"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Trash2, Edit, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { JsonEditor } from "@/components/ui/json-editor"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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

interface Column {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary_key?: boolean
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<any>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedRecord, setEditedRecord] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  const tableName = params.table as string
  const recordId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    if (tableName && recordId) {
      fetchRecord()
      fetchColumns()
    }
  }, [tableName, recordId])

  const fetchColumns = async () => {
    try {
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable, column_default")
        .eq("table_name", tableName)
        .eq("table_schema", "public")
        .order("ordinal_position")

      if (error) throw error

      // Fetch primary key info
      const { data: pkData } = await supabase
        .from("information_schema.key_column_usage")
        .select("column_name")
        .eq("table_name", tableName)
        .eq("table_schema", "public")

      const primaryKeys = pkData?.map((pk) => pk.column_name) || []

      const columnsWithPK =
        data?.map((col) => ({
          ...col,
          is_primary_key: primaryKeys.includes(col.column_name),
        })) || []

      setColumns(columnsWithPK)
    } catch (error) {
      console.error("Error fetching columns:", error)
      setError("Errore nel caricamento delle colonne")
    }
  }

  const fetchRecord = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from(tableName).select("*").eq("id", recordId).single()

      if (error) throw error

      setRecord(data)
      setEditedRecord(data)
    } catch (error) {
      console.error("Error fetching record:", error)
      setError("Errore nel caricamento del record")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Prepare data for update
      const updateData = { ...editedRecord }
      delete updateData.id // Remove id from update data

      const { error } = await supabase.from(tableName).update(updateData).eq("id", recordId)

      if (error) throw error

      setRecord(editedRecord)
      setIsEditing(false)
      toast.success("Record aggiornato con successo")
    } catch (error) {
      console.error("Error updating record:", error)
      toast.error("Errore nell'aggiornamento del record")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      const { error } = await supabase.from(tableName).delete().eq("id", recordId)

      if (error) throw error

      toast.success("Record eliminato con successo")
      router.push(`/data-explorer/${tableName}`)
    } catch (error) {
      console.error("Error deleting record:", error)
      toast.error("Errore nell'eliminazione del record")
    } finally {
      setDeleting(false)
    }
  }

  const handleFieldChange = (columnName: string, value: any) => {
    setEditedRecord((prev) => ({
      ...prev,
      [columnName]: value,
    }))
  }

  const renderField = (column: Column, value: any, isEditing: boolean) => {
    const { column_name, data_type } = column

    if (!isEditing) {
      // View mode
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground italic">null</span>
      }

      if (data_type.includes("json") || data_type.includes("jsonb")) {
        return (
          <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-32">{JSON.stringify(value, null, 2)}</pre>
        )
      }

      if (data_type.includes("timestamp") || data_type.includes("date")) {
        return <span>{new Date(value).toLocaleString("it-IT")}</span>
      }

      if (data_type === "boolean") {
        return <Badge variant={value ? "default" : "secondary"}>{value ? "Vero" : "Falso"}</Badge>
      }

      if (typeof value === "string" && value.length > 100) {
        return (
          <div className="max-h-32 overflow-auto">
            <Textarea value={value} readOnly className="min-h-20" />
          </div>
        )
      }

      return <span>{String(value)}</span>
    }

    // Edit mode
    if (column.is_primary_key) {
      return <Input value={value || ""} disabled className="bg-muted" />
    }

    if (data_type === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <Switch checked={value || false} onCheckedChange={(checked) => handleFieldChange(column_name, checked)} />
          <Label>{value ? "Vero" : "Falso"}</Label>
        </div>
      )
    }

    if (data_type.includes("json") || data_type.includes("jsonb")) {
      return (
        <JsonEditor
          value={value}
          onChange={(newValue) => handleFieldChange(column_name, newValue)}
          className="min-h-32"
        />
      )
    }

    if (data_type.includes("timestamp") || data_type.includes("date")) {
      return (
        <EnhancedDatePicker
          value={value || ""}
          onChange={(newValue) => handleFieldChange(column_name, newValue)}
          placeholder="Seleziona data e ora"
          showCurrentTime={true}
        />
      )
    }

    if (data_type === "text" || (typeof value === "string" && value.length > 100)) {
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => handleFieldChange(column_name, e.target.value)}
          className="min-h-20"
        />
      )
    }

    if (data_type.includes("int") || data_type.includes("numeric") || data_type.includes("decimal")) {
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => handleFieldChange(column_name, e.target.value ? Number(e.target.value) : null)}
        />
      )
    }

    return <Input value={value || ""} onChange={(e) => handleFieldChange(column_name, e.target.value)} />
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

  if (error || !record) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">Errore</h2>
              <p className="text-muted-foreground">{error || "Record non trovato"}</p>
              <Button variant="outline" onClick={() => router.push(`/data-explorer/${tableName}`)} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna alla tabella
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push(`/data-explorer/${tableName}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tableName}</h1>
            <p className="text-muted-foreground">Record ID: {recordId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditedRecord(record)
                }}
              >
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifica
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
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
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Eliminazione..." : "Elimina"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Record Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span>{isEditing ? "Modifica Record" : "Dettagli Record"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {columns.map((column, index) => {
            const value = isEditing ? editedRecord[column.column_name] : record[column.column_name]

            return (
              <div key={column.column_name}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="font-medium">{column.column_name}</Label>
                    <Badge variant="outline" className="text-xs">
                      {column.data_type}
                    </Badge>
                    {column.is_primary_key && (
                      <Badge variant="secondary" className="text-xs">
                        PK
                      </Badge>
                    )}
                    {column.is_nullable === "NO" && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="min-h-10">{renderField(column, value, isEditing)}</div>
                </div>
                {index < columns.length - 1 && <Separator />}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
