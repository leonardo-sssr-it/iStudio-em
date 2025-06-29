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
import { TablesRepository, type ColumnInfo } from "@/lib/repositories/tables-repository"
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

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<any>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
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
      const tablesRepo = new TablesRepository(supabase)
      const columnsData = await tablesRepo.getColumns(tableName)

      if (columnsData.length === 0) {
        // Fallback: try to infer columns from the record data
        if (record) {
          const inferredColumns: ColumnInfo[] = Object.keys(record).map((key) => ({
            name: key,
            type: inferColumnType(record[key]),
            is_nullable: true,
            is_identity: key === "id",
            is_primary: key === "id",
          }))
          setColumns(inferredColumns)
        }
      } else {
        setColumns(columnsData)
      }
    } catch (error) {
      console.error("Error fetching columns:", error)

      // Fallback: if we have record data, infer columns from it
      if (record) {
        const inferredColumns: ColumnInfo[] = Object.keys(record).map((key) => ({
          name: key,
          type: inferColumnType(record[key]),
          is_nullable: true,
          is_identity: key === "id",
          is_primary: key === "id",
        }))
        setColumns(inferredColumns)
      } else {
        setError("Errore nel caricamento delle colonne")
      }
    }
  }

  const inferColumnType = (value: any): string => {
    if (value === null || value === undefined) return "text"
    if (typeof value === "number") return Number.isInteger(value) ? "integer" : "numeric"
    if (typeof value === "boolean") return "boolean"
    if (value instanceof Date) return "timestamp"
    if (typeof value === "string") {
      // Check for date patterns
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return "timestamp"
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return "uuid"
      if (value.length > 100) return "text"
    }
    if (typeof value === "object") return "json"
    return "varchar"
  }

  const fetchRecord = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from(tableName).select("*").eq("id", recordId).single()

      if (error) throw error

      setRecord(data)
      setEditedRecord(data)

      // If columns haven't been fetched yet, trigger column fetch after we have record data
      if (columns.length === 0) {
        setTimeout(() => fetchColumns(), 100)
      }
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
    console.log(`Changing field ${columnName} to:`, value)
    setEditedRecord((prev) => ({
      ...prev,
      [columnName]: value,
    }))
  }

  const isDateTimeField = (columnName: string, dataType: string, value: any): boolean => {
    // Check by column name first (more reliable)
    const dateFieldNames = [
      "scadenza",
      "data_inizio",
      "data_fine",
      "data_creazione",
      "modifica",
      "notifica",
      "pubblicato",
    ]
    if (dateFieldNames.includes(columnName.toLowerCase())) {
      return true
    }

    // Check by data type
    if (
      dataType.includes("timestamp") ||
      dataType.includes("date") ||
      dataType === "datetime" ||
      dataType.includes("time")
    ) {
      return true
    }

    // Check by value pattern
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return true
    }

    return false
  }

  const isJsonField = (dataType: string): boolean => {
    return dataType.includes("json") || dataType.includes("jsonb")
  }

  const isNumericField = (dataType: string): boolean => {
    return (
      dataType.includes("int") ||
      dataType.includes("numeric") ||
      dataType.includes("decimal") ||
      dataType.includes("float") ||
      dataType.includes("double")
    )
  }

  const isTextAreaField = (dataType: string, value: any): boolean => {
    return dataType === "text" || (typeof value === "string" && value.length > 100)
  }

  const renderField = (column: ColumnInfo, value: any, isEditing: boolean) => {
    const { name: columnName, type: dataType } = column

    console.log(`Rendering field ${columnName} with type ${dataType}, value:`, value, `isEditing: ${isEditing}`)

    if (!isEditing) {
      // View mode
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground italic">null</span>
      }

      if (isJsonField(dataType)) {
        return (
          <pre className="bg-muted p-2 rounded text-sm overflow-auto max-h-32 whitespace-pre-wrap">
            {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
          </pre>
        )
      }

      if (isDateTimeField(columnName, dataType, value)) {
        try {
          const date = new Date(value)
          return <span>{date.toLocaleString("it-IT")}</span>
        } catch {
          return <span>{String(value)}</span>
        }
      }

      if (dataType === "boolean") {
        return <Badge variant={value ? "default" : "secondary"}>{value ? "Vero" : "Falso"}</Badge>
      }

      if (isTextAreaField(dataType, value)) {
        return (
          <div className="max-h-32 overflow-auto">
            <Textarea value={String(value)} readOnly className="min-h-20 resize-none" />
          </div>
        )
      }

      return <span className="break-words">{String(value)}</span>
    }

    // Edit mode
    if (column.is_primary || column.is_identity) {
      return <Input value={value || ""} disabled className="bg-muted" />
    }

    if (dataType === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <Switch checked={Boolean(value)} onCheckedChange={(checked) => handleFieldChange(columnName, checked)} />
          <Label>{Boolean(value) ? "Vero" : "Falso"}</Label>
        </div>
      )
    }

    if (isJsonField(dataType)) {
      return (
        <JsonEditor
          value={value}
          onChange={(newValue) => handleFieldChange(columnName, newValue)}
          className="min-h-32"
        />
      )
    }

    // IMPORTANTE: Controllo specifico per i campi data
    if (isDateTimeField(columnName, dataType, value)) {
      console.log(`Rendering EnhancedDatePicker for ${columnName}`)
      return (
        <div className="w-full">
          <EnhancedDatePicker
            value={value || ""}
            onChange={(newValue) => {
              console.log(`EnhancedDatePicker onChange for ${columnName}:`, newValue)
              handleFieldChange(columnName, newValue)
            }}
            placeholder="Seleziona data e ora"
            showCurrentTime={true}
            className="w-full"
          />
        </div>
      )
    }

    if (isTextAreaField(dataType, value)) {
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => handleFieldChange(columnName, e.target.value)}
          className="min-h-20"
          placeholder={`Inserisci ${columnName}`}
        />
      )
    }

    if (isNumericField(dataType)) {
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => {
            const numValue = e.target.value ? Number(e.target.value) : null
            handleFieldChange(columnName, numValue)
          }}
          placeholder={`Inserisci ${columnName}`}
        />
      )
    }

    // Default text input
    return (
      <Input
        value={value || ""}
        onChange={(e) => handleFieldChange(columnName, e.target.value)}
        placeholder={`Inserisci ${columnName}`}
      />
    )
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
            <h1 className="text-2xl font-bold capitalize">{tableName}</h1>
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

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info</h3>
            <p className="text-sm text-yellow-700">
              Editing: {isEditing ? "Yes" : "No"} | Columns: {columns.length} | Record keys:{" "}
              {Object.keys(record || {}).join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Record Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span>{isEditing ? "Modifica Record" : "Dettagli Record"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {columns.length > 0
            ? columns.map((column, index) => {
                const value = isEditing ? editedRecord[column.name] : record[column.name]

                return (
                  <div key={column.name}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Label className="font-medium">{column.name}</Label>
                        <Badge variant="outline" className="text-xs">
                          {column.type}
                        </Badge>
                        {column.is_primary && (
                          <Badge variant="secondary" className="text-xs">
                            PK
                          </Badge>
                        )}
                        {column.is_identity && (
                          <Badge variant="secondary" className="text-xs">
                            AUTO
                          </Badge>
                        )}
                        {!column.is_nullable && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {isDateTimeField(column.name, column.type, value) && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            DATE
                          </Badge>
                        )}
                      </div>
                      <div className="min-h-10">{renderField(column, value, isEditing)}</div>
                    </div>
                    {index < columns.length - 1 && <Separator />}
                  </div>
                )
              })
            : // Fallback: render all record fields if no column info available
              Object.keys(record).map((key, index) => {
                const value = isEditing ? editedRecord[key] : record[key]
                const inferredColumn: ColumnInfo = {
                  name: key,
                  type: inferColumnType(value),
                  is_nullable: true,
                  is_identity: key === "id",
                  is_primary: key === "id",
                }

                return (
                  <div key={key}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label className="font-medium">{key}</Label>
                        <Badge variant="outline" className="text-xs">
                          {inferredColumn.type}
                        </Badge>
                        {inferredColumn.is_primary && (
                          <Badge variant="secondary" className="text-xs">
                            PK
                          </Badge>
                        )}
                        {isDateTimeField(key, inferredColumn.type, value) && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            DATE
                          </Badge>
                        )}
                      </div>
                      <div className="min-h-10">{renderField(inferredColumn, value, isEditing)}</div>
                    </div>
                    {index < Object.keys(record).length - 1 && <Separator />}
                  </div>
                )
              })}
        </CardContent>
      </Card>
    </div>
  )
}
