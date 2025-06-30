"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { useColumns } from "@/hooks/use-columns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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

export default function DataExplorerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { user } = useAuth()
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

  // ✅ CARICAMENTO PRIORITÀ CORRETTO - COPIATO DALLA PAGINA NEW
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
      setPriorityOptions(mappedPriorities.map((p) => ({ value: p.value.toString(), label: p.nome })))
    } catch (error: any) {
      console.error("Errore nel caricamento delle priorità:", error)
      setPriorityOptions([
        { value: "1", label: "Bassa" },
        { value: "2", label: "Media" },
        { value: "3", label: "Alta" },
        { value: "4", label: "Urgente" },
      ])
    }
  }, [supabase])

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
              { value: "pianificato", label: "Pianificato" },
              { value: "in_corso", label: "In corso" },
              { value: "completato", label: "Completato" },
              { value: "annullato", label: "Annullato" },
            ]
          } else if (tableName === "attivita") {
            options["stato"] = [
              { value: "da_fare", label: "Da fare" },
              { value: "in_corso", label: "In corso" },
              { value: "completato", label: "Completato" },
              { value: "sospeso", label: "Sospeso" },
            ]
          } else if (tableName === "progetti") {
            options["stato"] = [
              { value: "pianificato", label: "Pianificato" },
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
    loadPriorityOptions()
  }, [supabase, columns, tableName, loadPriorityOptions])

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
    console.log(`Campo ${field} cambiato a:`, value)
    const newData = { ...editData, [field]: value }

    // ✅ Auto-aggiornamento data_fine quando cambia data_inizio - COPIATO DALLA PAGINA NEW
    if (
      field === "data_inizio" &&
      value &&
      (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti")
    ) {
      try {
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
      } catch (e) {
        console.warn("Errore nell'aggiornamento automatico di data_fine:", e)
      }
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

  // ✅ RENDER FIELD - COPIATO DALLA PAGINA NEW PER I CAMPI DATETIME
  const renderField = (column: any, value: any, isEditing: boolean) => {
    const fieldName = column.column_name
    const fieldValue = isEditing ? editData[fieldName] : value

    // Non mostrare campi di sistema
    if (["id", "created_at", "updated_at", "data_creazione", "modifica"].includes(fieldName)) {
      return null
    }

    const fieldLabel = fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    const isRequired = ["titolo", "nome", "email", "username"].includes(fieldName)

    if (!isEditing) {
      // Modalità visualizzazione
      let displayValue = fieldValue

      if (fieldValue === null || fieldValue === undefined) {
        displayValue = "-"
      } else if (typeof fieldValue === "boolean") {
        displayValue = fieldValue ? "✓" : "✗"
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
      } else if (fieldName === "priorita" && priorityOptions.length > 0) {
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

    // ✅ MODALITÀ MODIFICA - COPIATO DALLA PAGINA NEW
    if (column.data_type === "boolean") {
      return (
        <div key={fieldName} className="flex items-center space-x-2">
          <Checkbox
            id={fieldName}
            checked={!!fieldValue}
            onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
          />
          <Label htmlFor={fieldName}>{fieldLabel}</Label>
        </div>
      )
    }

    if (column.data_type === "text" && fieldName.includes("descrizione")) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
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

    // ✅ CAMPI DATETIME - COPIATO ESATTAMENTE DALLA PAGINA NEW
    if (
      fieldName.includes("data") &&
      (column.data_type === "timestamp with time zone" || column.data_type === "timestamp without time zone")
    ) {
      return (
        <EnhancedDatePicker
          value={fieldValue || ""}
          onChange={(newValue) => handleFieldChange(fieldName, newValue)}
          showCurrentTime={true}
        />
      )
    }

    if (fieldName === "stato" && selectOptions[fieldName]) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
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

    // ✅ PRIORITÀ - COPIATO DALLA PAGINA NEW
    if (fieldName === "priorita" && priorityOptions.length > 0) {
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

    // ✅ COLORE - COPIATO DALLA PAGINA NEW
    if (fieldName === "colore") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
          </Label>
          <ColorPicker value={fieldValue || ""} onChange={(value) => handleFieldChange(fieldName, value)} />
        </div>
      )
    }

    if (column.data_type === "integer" || column.data_type === "bigint") {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className="text-sm font-medium">
            {fieldLabel}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
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
          {isRequired && <span className="text-red-500 ml-1">*</span>}
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
