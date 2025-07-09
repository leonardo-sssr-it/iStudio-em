"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
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

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  is_primary_key: boolean
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<any>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedRecord, setEditedRecord] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

      if (error) throw error

      // Fetch primary key info
      const { data: pkData, error: pkError } = await supabase
        .from("information_schema.key_column_usage")
        .select("column_name")
        .eq("table_name", tableName)
        .eq("table_schema", "public")

      if (pkError) throw pkError

      const primaryKeys = pkData?.map((pk) => pk.column_name) || []

      const columnsWithPK =
        data?.map((col) => ({
          ...col,
          is_primary_key: primaryKeys.includes(col.column_name),
        })) || []

      setColumns(columnsWithPK)
    } catch (error) {
      console.error("Error fetching columns:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare le informazioni delle colonne",
        variant: "destructive",
      })
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
      toast({
        title: "Errore",
        description: "Impossibile caricare il record",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setEditedRecord((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { error } = await supabase.from(tableName).update(editedRecord).eq("id", recordId)

      if (error) throw error

      setRecord(editedRecord)
      setIsEditMode(false)
      toast({
        title: "Successo",
        description: "Record aggiornato con successo",
      })
    } catch (error) {
      console.error("Error saving record:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare il record",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const { error } = await supabase.from(tableName).delete().eq("id", recordId)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Record eliminato con successo",
      })
      router.push(`/data-explorer/${tableName}`)
    } catch (error) {
      console.error("Error deleting record:", error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare il record",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    setEditedRecord(record)
    setIsEditMode(false)
  }

  const renderField = (column: ColumnInfo) => {
    const field = column.column_name
    const dataType = column.data_type
    const fieldValue = isEditMode ? editedRecord[field] : record[field]

    // Render based on data type
    if (dataType.includes("timestamp") || dataType.includes("datetime") || field.includes("data_")) {
      return (
        <EnhancedDatePicker
          id={field}
          value={fieldValue || ""}
          onChange={(value) => handleFieldChange(field, value)}
          readOnly={!isEditMode}
          showCurrentTime={field === "data_inizio" && !fieldValue}
          onDateTimeSet={(date) => {
            if (field === "data_inizio") {
              console.log("Data inizio impostata:", date)
            }
          }}
        />
      )
    }

    if (dataType === "boolean") {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={field}
            checked={fieldValue || false}
            onCheckedChange={(checked) => handleFieldChange(field, checked)}
            disabled={!isEditMode}
          />
          <Label htmlFor={field}>{fieldValue ? "Sì" : "No"}</Label>
        </div>
      )
    }

    if (dataType === "text" || (typeof fieldValue === "string" && fieldValue.length > 100)) {
      return (
        <Textarea
          id={field}
          value={fieldValue || ""}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={!isEditMode}
          rows={4}
        />
      )
    }

    if (dataType.includes("int") || dataType.includes("numeric") || dataType.includes("decimal")) {
      return (
        <Input
          id={field}
          type="number"
          value={fieldValue || ""}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={!isEditMode}
        />
      )
    }

    // Default to text input
    return (
      <Input
        id={field}
        value={fieldValue || ""}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        disabled={!isEditMode}
      />
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Record non trovato</p>
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
          <Button variant="ghost" size="sm" onClick={() => router.push(`/data-explorer/${tableName}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla tabella
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tableName}</h1>
            <p className="text-muted-foreground">ID: {recordId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isEditMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Annulla
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifica
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
          <CardTitle className="flex items-center justify-between">
            Dettagli Record
            {isEditMode && <Badge variant="secondary">Modalità Modifica</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns.map((column) => (
              <div key={column.column_name} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={column.column_name} className="font-medium">
                    {column.column_name}
                  </Label>
                  {column.is_primary_key && (
                    <Badge variant="outline" className="text-xs">
                      PK
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {column.data_type}
                  </Badge>
                  {column.is_nullable === "NO" && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                {renderField(column)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
