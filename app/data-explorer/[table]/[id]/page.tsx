"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useColumns } from "@/hooks/use-columns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react"
import Link from "next/link"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"

interface TableData {
  [key: string]: any
}

interface SelectOption {
  value: string
  label: string
}

export default function DataExplorerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const tableName = params.table as string
  const recordId = params.id as string

  const [data, setData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<TableData>({})
  const [selectOptions, setSelectOptions] = useState<Record<string, SelectOption[]>>({})
  const [priorityOptions, setPriorityOptions] = useState<SelectOption[]>([])

  const { data: columns, loading: columnsLoading } = useColumns(tableName)

  // Carica le opzioni per le select
  useEffect(() => {
    const loadSelectOptions = async () => {
      if (!supabase || !columns) return

      const options: Record<string, SelectOption[]> = {}

      // Carica opzioni per campi specifici
      for (const column of columns) {
        if (
          column.column_name === "stato" &&
          (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti")
        ) {
          if (tableName === "appuntamenti") {
            options["stato"] = [
              { value: "programmato", label: "Programmato" },
              { value: "confermato", label: "Confermato" },
              { value: "completato", label: "Completato" },
              { value: "annullato", label: "Annullato" },
            ]
          } else if (tableName === "attivita") {
            options["stato"] = [
              { value: "da_fare", label: "Da fare" },
              { value: "in_corso", label: "In corso" },
              { value: "completata", label: "Completata" },
              { value: "sospesa", label: "Sospesa" },
            ]
          } else if (tableName === "progetti") {
            options["stato"] = [
              { value: "pianificazione", label: "Pianificazione" },
              { value: "in_corso", label: "In corso" },
              { value: "completato", label: "Completato" },
              { value: "sospeso", label: "Sospeso" },
            ]
          }
        }

        if (column.column_name === "tipo" && tableName === "appuntamenti") {
          options["tipo"] = [
            { value: "riunione", label: "Riunione" },
            { value: "chiamata", label: "Chiamata" },
            { value: "evento", label: "Evento" },
            { value: "altro", label: "Altro" },
          ]
        }

        if (column.column_name === "categoria" && tableName === "attivita") {
          options["categoria"] = [
            { value: "lavoro", label: "Lavoro" },
            { value: "personale", label: "Personale" },
            { value: "studio", label: "Studio" },
            { value: "altro", label: "Altro" },
          ]
        }
      }

      setSelectOptions(options)
    }

    loadSelectOptions()
  }, [supabase, columns, tableName])

  // Carica opzioni priorità da Supabase
  useEffect(() => {
    const loadPriorityOptions = async () => {
      if (!supabase) return

      try {
        const { data: priorities, error } = await supabase.from("priorita").select("id, nome").order("nome")

        if (error) {
          console.error("Errore nel caricamento delle priorità:", error)
          // Fallback alle priorità di default
          setPriorityOptions([
            { value: "1", label: "Bassa" },
            { value: "2", label: "Media" },
            { value: "3", label: "Alta" },
            { value: "4", label: "Urgente" },
          ])
        } else {
          setPriorityOptions(
            priorities.map((p) => ({
              value: p.id.toString(),
              label: p.nome,
            })),
          )
        }
      } catch (error) {
        console.error("Errore nel caricamento delle priorità:", error)
        setPriorityOptions([
          { value: "1", label: "Bassa" },
          { value: "2", label: "Media" },
          { value: "3", label: "Alta" },
          { value: "4", label: "Urgente" },
        ])
      }
    }

    loadPriorityOptions()
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!supabase || !tableName || !recordId) return

    setLoading(true)
    try {
      const { data: result, error } = await supabase.from(tableName).select("*").eq("id", recordId).single()

      if (error) {
        console.error("Errore nel caricamento dei dati:", error)
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati",
          variant: "destructive",
        })
        return
      }

      setData(result)
      setEditData(result)
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, recordId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...editData, [field]: value }

    // Auto-aggiornamento data_fine quando cambia data_inizio
    if (
      field === "data_inizio" &&
      value &&
      (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti")
    ) {
      const startDate = new Date(value)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // +1 ora

      // Formatta come ISO locale senza conversione timezone
      const year = endDate.getFullYear()
      const month = String(endDate.getMonth() + 1).padStart(2, "0")
      const day = String(endDate.getDate()).padStart(2, "0")
      const hour = String(endDate.getHours()).padStart(2, "0")
      const minute = String(endDate.getMinutes()).padStart(2, "0")
      const second = String(endDate.getSeconds()).padStart(2, "0")

      const localISOString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
      newData.data_fine = localISOString

      toast({
        title: "Data fine aggiornata",
        description: "Data fine impostata automaticamente a +1 ora dalla data inizio",
      })
    }

    setEditData(newData)
  }

  const handleSave = async () => {
    if (!supabase || !tableName || !recordId) return

    setSaving(true)
    try {
      const { error } = await supabase.from(tableName).update(editData).eq("id", recordId)

      if (error) {
        console.error("Errore nel salvataggio:", error)
        toast({
          title: "Errore",
          description: "Impossibile salvare le modifiche",
          variant: "destructive",
        })
        return
      }

      setData(editData)
      setIsEditing(false)
      toast({
        title: "Successo",
        description: "Modifiche salvate con successo",
      })
    } catch (error) {
      console.error("Errore nel salvataggio:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!supabase || !tableName || !recordId) return

    if (!confirm("Sei sicuro di voler eliminare questo elemento?")) return

    try {
      const { error } = await supabase.from(tableName).delete().eq("id", recordId)

      if (error) {
        console.error("Errore nell'eliminazione:", error)
        toast({
          title: "Errore",
          description: "Impossibile eliminare l'elemento",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Successo",
        description: "Elemento eliminato con successo",
      })

      router.push(`/data-explorer/${tableName}`)
    } catch (error) {
      console.error("Errore nell'eliminazione:", error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'elemento",
        variant: "destructive",
      })
    }
  }

  const renderField = (column: any, value: any, isEditing: boolean) => {
    const fieldName = column.column_name
    const fieldValue = isEditing ? editData[fieldName] : value

    // Non mostrare campi di sistema
    if (["id", "created_at", "updated_at"].includes(fieldName)) {
      return null
    }

    const fieldLabel = fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

    if (!isEditing) {
      // Modalità visualizzazione
      let displayValue = fieldValue

      if (fieldValue === null || fieldValue === undefined) {
        displayValue = "-"
      } else if (typeof fieldValue === "boolean") {
        displayValue = fieldValue ? "Sì" : "No"
      } else if (fieldName.includes("data") && fieldValue) {
        displayValue = new Date(fieldValue).toLocaleString("it-IT")
      } else if (fieldName === "stato" && selectOptions[fieldName]) {
        const option = selectOptions[fieldName].find((opt) => opt.value === fieldValue)
        displayValue = option ? option.label : fieldValue
      } else if (fieldName === "tipo" && selectOptions[fieldName]) {
        const option = selectOptions[fieldName].find((opt) => opt.value === fieldValue)
        displayValue = option ? option.label : fieldValue
      } else if (fieldName === "categoria" && selectOptions[fieldName]) {
        const option = selectOptions[fieldName].find((opt) => opt.value === fieldValue)
        displayValue = option ? option.label : fieldValue
      } else if (fieldName === "priorita_id" && priorityOptions.length > 0) {
        const option = priorityOptions.find((opt) => opt.value === fieldValue?.toString())
        displayValue = option ? option.label : fieldValue
      }

      return (
        <div key={fieldName} className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">{fieldLabel}</Label>
          <div className="p-3 bg-gray-50 rounded-md min-h-[40px] flex items-center">
            {fieldName === "colore" && fieldValue ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: fieldValue }} />
                <span>{fieldValue}</span>
              </div>
            ) : (
              <span className="text-sm">{displayValue}</span>
            )}
          </div>
        </div>
      )
    }

    // Modalità modifica
    if (column.data_type === "boolean") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id={fieldName}
              checked={fieldValue || false}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <span className="text-sm text-gray-600">{fieldValue ? "Sì" : "No"}</span>
          </div>
        </div>
      )
    }

    if (column.data_type === "text" && fieldName.includes("descrizione")) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <Textarea
            id={fieldName}
            value={fieldValue || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Inserisci ${fieldLabel.toLowerCase()}`}
            rows={4}
          />
        </div>
      )
    }

    if (
      fieldName.includes("data") &&
      (column.data_type === "timestamp with time zone" || column.data_type === "timestamp without time zone")
    ) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <EnhancedDatePicker
            id={fieldName}
            value={fieldValue || ""}
            onChange={(newValue) => handleFieldChange(fieldName, newValue)}
            placeholder={`Seleziona ${fieldLabel.toLowerCase()}`}
            showCurrentTime={true}
          />
        </div>
      )
    }

    if (fieldName === "stato" && selectOptions[fieldName]) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <Select value={fieldValue || ""} onValueChange={(value) => handleFieldChange(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleziona ${fieldLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions[fieldName].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (fieldName === "tipo" && selectOptions[fieldName]) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <Select value={fieldValue || ""} onValueChange={(value) => handleFieldChange(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleziona ${fieldLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions[fieldName].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (fieldName === "categoria" && selectOptions[fieldName]) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <Select value={fieldValue || ""} onValueChange={(value) => handleFieldChange(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleziona ${fieldLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions[fieldName].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (fieldName === "priorita_id" && priorityOptions.length > 0) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            Priorità
          </Label>
          <Select
            value={fieldValue?.toString() || ""}
            onValueChange={(value) => handleFieldChange(fieldName, Number.parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona priorità" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (fieldName === "colore") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={fieldName}
              type="color"
              value={fieldValue || "#000000"}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              type="text"
              value={fieldValue || ""}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      )
    }

    if (column.data_type === "integer" || column.data_type === "bigint") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <Input
            id={fieldName}
            type="number"
            value={fieldValue || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value ? Number.parseInt(e.target.value) : null)}
            placeholder={`Inserisci ${fieldLabel.toLowerCase()}`}
          />
        </div>
      )
    }

    if (column.data_type === "numeric" || column.data_type === "decimal") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <Input
            id={fieldName}
            type="number"
            step="0.01"
            value={fieldValue || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value ? Number.parseFloat(e.target.value) : null)}
            placeholder={`Inserisci ${fieldLabel.toLowerCase()}`}
          />
        </div>
      )
    }

    // Campo di testo generico
    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName} className="text-sm font-medium">
          {fieldLabel}
        </Label>
        <Input
          id={fieldName}
          type="text"
          value={fieldValue || ""}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          placeholder={`Inserisci ${fieldLabel.toLowerCase()}`}
        />
      </div>
    )
  }

  if (loading || columnsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento in corso...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !columns) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Elemento non trovato</p>
          <Link href={`/data-explorer/${tableName}`}>
            <Button variant="outline" className="mt-4 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href={`/data-explorer/${tableName}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold capitalize">{tableName.replace(/_/g, " ")}</h1>
              <p className="text-gray-600">ID: {recordId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
                <Button onClick={handleDelete} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvataggio..." : "Salva"}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData(data)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <Badge variant="secondary" className="mb-4">
            Modalità modifica attiva
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns.map((column) => {
              const fieldValue = data[column.column_name]
              return renderField(column, fieldValue, isEditing)
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
