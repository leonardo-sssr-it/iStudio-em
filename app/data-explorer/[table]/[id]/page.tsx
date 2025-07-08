"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { parseISO, formatISO } from "date-fns"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { SimpleDateTest } from "@/components/ui/simple-date-test"
import { NativePopoverTest } from "@/components/ui/native-popover-test"

// Definizione delle tabelle disponibili
const AVAILABLE_TABLES = [
  { id: "appuntamenti", label: "Appuntamenti", icon: ArrowLeft },
  { id: "attivita", label: "Attività", icon: Edit },
  { id: "scadenze", label: "Scadenze", icon: Trash2 },
  // altre tabelle...
]

// Funzione per pulire i dati prima del salvataggio
function cleanDataForSave(data: any, readOnlyFields: string[] = []): any {
  const cleaned = { ...data }

  readOnlyFields.forEach((field) => {
    if (field !== "id_utente") {
      delete cleaned[field]
    }
  })

  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key]

    if (value === undefined) {
      delete cleaned[key]
      return
    }

    if (value === "undefined") {
      delete cleaned[key]
      return
    }

    if (typeof value === "string") {
      if (value.trim() === "") {
        cleaned[key] = null
      }
    }

    if (typeof value === "number" && isNaN(value)) {
      delete cleaned[key]
    }
  })

  return cleaned
}

// Configurazione dei campi per ogni tabella
const TABLE_FIELDS = {
  appuntamenti: {
    requiredFields: ["titolo", "data_inizio"],
    autoFields: ["id", "id_utente", "data_creazione", "modifica", "attivo"],
    defaultValues: {
      stato: "pianificato",
      attivo: true,
    },
    fieldGroups: {
      principale: {
        title: "Informazioni Principali",
        icon: ArrowLeft,
        fields: ["titolo", "descrizione", "stato"],
      },
      date: {
        title: "Date e Orari",
        icon: Edit,
        fields: ["data_inizio", "data_fine"],
      },
      dettagli: {
        title: "Dettagli Aggiuntivi",
        icon: Trash2,
        fields: ["luogo", "note", "tags"],
      },
    },
    types: {
      id: "number",
      titolo: "string",
      descrizione: "text",
      data_inizio: "datetime",
      data_fine: "datetime",
      stato: "select",
      priorita: "priority_select",
      note: "text",
      luogo: "string",
      tags: "tags",
      attivo: "boolean",
      id_utente: "number",
      data_creazione: "datetime",
      modifica: "datetime",
    },
    selectOptions: {
      stato: [
        { value: "pianificato", label: "Pianificato" },
        { value: "in_corso", label: "In corso" },
        { value: "completato", label: "Completato" },
        { value: "annullato", label: "Annullato" },
      ],
    },
    validation: {
      titolo: { minLength: 3, maxLength: 100 },
    },
  },
  // configurazioni per altre tabelle...
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

async function getRecord(table: string, id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching record:", error)
    return null
  }

  return data
}

async function getTableColumns(table: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type, is_nullable")
    .eq("table_name", table)
    .eq("table_schema", "public")

  if (error) {
    console.error("Error fetching columns:", error)
    return []
  }

  return data || []
}

function formatValue(value: any, dataType: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>
  }

  if (typeof value === "boolean") {
    return <Badge variant={value ? "default" : "secondary"}>{value.toString()}</Badge>
  }

  if (dataType.includes("timestamp") || dataType.includes("date")) {
    try {
      const date = new Date(value)
      return date.toLocaleString("it-IT")
    } catch {
      return value.toString()
    }
  }

  if (typeof value === "object") {
    return <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
  }

  return value.toString()
}

export default async function RecordDetailPage({ params }: any) {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const { table, id } = params

  const [record, columns] = await Promise.all([getRecord(table, id), getTableColumns(table)])

  if (!record) {
    notFound()
  }

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const [originalData, setOriginalData] = useState<any>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [priorityOptions, setPriorityOptions] = useState<any[]>([])
  const [isEditMode, setIsEditMode] = useState<boolean>(false)

  const tableName = table
  const itemId = id

  const isValidTable = AVAILABLE_TABLES.some((t) => t.id === tableName)

  const tableConfig = TABLE_FIELDS[tableName as keyof typeof TABLE_FIELDS]
  const requiredFields = tableConfig?.requiredFields || []
  const autoFields = tableConfig?.autoFields || []
  const defaultValues = tableConfig?.defaultValues || {}
  const fieldOrder = tableConfig?.fieldOrder || []
  const fieldTypes = tableConfig?.types || {}
  const selectOptions = tableConfig?.selectOptions || {}
  const validation = tableConfig?.validation || {}

  const handleBackToList = useCallback(() => {
    console.log(`[RecordDetailPage] Navigazione verso: /data-explorer/${tableName}`)
    router.push(`/data-explorer/${tableName}`)
  }, [router, tableName])

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
  }, [supabase])

  useEffect(() => {
    if (supabase) {
      loadPriorityOptions()
    }
  }, [supabase, loadPriorityOptions])

  const loadItem = useCallback(async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return

    setLoading(true)
    try {
      let query = supabase.from(tableName).select("*").eq("id", itemId)

      if (tableName !== "utenti" && user?.id) {
        query = query.eq("id_utente", user.id)
      }

      const { data, error } = await query.single()

      if (error) throw error

      setFormData(data)
      setOriginalData(data)
    } catch (error: any) {
      console.error("Errore nel caricamento dell'elemento:", error)
      toast({
        title: "Errore",
        description: `Impossibile caricare l'elemento: ${error.message}`,
        variant: "destructive",
      })
      handleBackToList()
    } finally {
      setLoading(false)
    }
  }, [supabase, tableName, itemId, user?.id, isValidTable, handleBackToList])

  useEffect(() => {
    if (supabase && tableName && itemId && isValidTable) {
      loadItem()
    }
  }, [supabase, loadItem, tableName, itemId, isValidTable])

  const handleFieldChange = (field: string, value: any) => {
    console.log(`[RecordDetailPage] Campo ${field} modificato:`, value)

    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value }

      if (field === "data_inizio" && value) {
        try {
          const startDate = parseISO(value)
          if (!newData.data_fine) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
            newData.data_fine = formatISO(endDate)
          }
        } catch (e) {
          console.warn("Data inizio non valida per calcolare data fine:", value)
        }
      }
      return newData
    })

    if (errors[field]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }

    validateField(field, value)
  }

  const validateField = (field: string, value: any): boolean => {
    const rules = validation[field]
    if (!rules) return true

    let error = ""

    if (rules.minLength && (!value || value.length < rules.minLength)) {
      error = `Minimo ${rules.minLength} caratteri`
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      error = `Massimo ${rules.maxLength} caratteri`
    }

    if (rules.min !== undefined && value < rules.min) {
      error = `Valore minimo: ${rules.min}`
    }

    if (rules.max !== undefined && value > rules.max) {
      error = `Valore massimo: ${rules.max}`
    }

    if (rules.pattern && value) {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(value)) {
        error = getPatternErrorMessage(field, fieldTypes[field])
      }
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }))
      return false
    }

    return true
  }

  const getPatternErrorMessage = (field: string, type: string): string => {
    switch (type) {
      case "email":
        return "Email non valida"
      case "tel":
        return "Numero di telefono non valido"
      case "string":
        if (field === "slug") return "Solo lettere minuscole, numeri e trattini"
        if (field === "cap") return "CAP deve essere di 5 cifre"
        if (field === "piva") return "P.IVA deve essere di 11 cifre"
        if (field === "codfisc") return "Codice fiscale non valido"
        return "Formato non valido"
      default:
        return "Formato non valido"
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    requiredFields.forEach((field) => {
      if (!formData[field] || (typeof formData[field] === "string" && !formData[field].trim())) {
        newErrors[field] = "Campo obbligatorio"
      }
    })

    Object.keys(formData).forEach((field) => {
      if (!autoFields.includes(field) && !validateField(field, formData[field])) {
      }
    })

    if (tableName === "appuntamenti" || tableName === "attivita" || tableName === "progetti") {
      if (formData.data_fine && formData.data_inizio && new Date(formData.data_fine) < new Date(formData.data_inizio)) {
        newErrors.data_fine = "La data di fine deve essere successiva alla data di inizio"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!supabase || !tableName || !user?.id || !isValidTable) return

    if (!validateForm()) {
      toast({
        title: "Errore di validazione",
        description: "Controlla i campi evidenziati in rosso",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const dataToSave = cleanDataForSave(formData, autoFields)

      dataToSave.modifica = new Date().toISOString()

      console.log(`Aggiornamento elemento in tabella: ${tableName}`, dataToSave)

      const { data, error } = await supabase.from(tableName).update(dataToSave).eq("id", itemId).select()

      if (error) {
        console.error("Errore aggiornamento:", error)

        let errorMessage = error.message
        if (error.message.includes("check constraint")) {
          if (error.message.includes("descrizione_check")) {
            errorMessage =
              "La descrizione non rispetta i requisiti del database. Assicurati che sia compilata correttamente."
          }
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Elemento aggiornato con successo!",
        description: "Le modifiche sono state salvate nel database",
        action: (
          <div className="flex items-center">
            <ArrowLeft className="w-4 h-4 text-green-500" />
          </div>
        ),
      })

      if (data && data[0]) {
        setFormData(data[0])
        setOriginalData(data[0])
      }
      setIsEditMode(false)
      setErrors({})
    } catch (error: any) {
      console.error("Errore durante il salvataggio:", error)
      toast({
        title: "Errore durante il salvataggio",
        description: error.message || "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData(originalData)
    setIsEditMode(false)
    setErrors({})
  }

  const handleDelete = async () => {
    if (!supabase || !tableName || !itemId || !isValidTable) return

    setDeleting(true)
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", itemId)

      if (error) throw error

      toast({
        title: "Elemento eliminato con successo!",
        description: "L'elemento è stato rimosso dal database",
      })

      handleBackToList()
    } catch (error: any) {
      console.error("Errore durante l'eliminazione:", error)
      toast({
        title: "Errore durante l'eliminazione",
        description: error.message || "Si è verificato un errore imprevisto",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const renderField = (field: string) => {
    const fieldType = fieldTypes[field]
    const fieldValue = formData[field]
    const hasError = !!errors[field]
    const isRequired = requiredFields.includes(field)

    if (autoFields.includes(field)) return null

    const commonProps = {
      id: field,
      value: fieldValue || "",
      onChange: (e: any) => handleFieldChange(field, e.target.value),
      className: hasError ? "border-red-500" : "",
    }

    if (!isEditMode) {
      let displayValue = fieldValue
      if (fieldType === "datetime" && fieldValue) {
        displayValue = new Date(fieldValue).toLocaleString("it-IT")
      } else if (fieldType === "boolean") {
        displayValue = fieldValue ? "Sì" : "No"
      } else if (fieldType === "priority_select") {
        const priorityOption = priorityOptions.find((option) => option.value === fieldValue)
        displayValue = priorityOption ? priorityOption.nome : fieldValue
      } else if (fieldType === "select") {
        const options = selectOptions[field] || []
        const selectedOption = options.find((option: any) => option.value === fieldValue)
        displayValue = selectedOption ? selectedOption.label : fieldValue
      }

      return (
        <div key={field} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
          </Label>
          <div className="mt-1 p-2 rounded-md bg-gray-50">{displayValue || "-"}</div>
        </div>
      )
    }

    switch (fieldType) {
      case "string":
      case "email":
      case "tel":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} type={fieldType === "email" ? "email" : fieldType === "tel" ? "tel" : "text"} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "text":
      case "richtext":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea {...commonProps} rows={fieldType === "richtext" ? 8 : 4} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "number":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              onChange={(e) => handleFieldChange(field, Number.parseFloat(e.target.value) || 0)}
            />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "datetime":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <EnhancedDatePicker
              value={fieldValue || ""}
              onChange={(value) => handleFieldChange(field, value)}
              placeholder={`Seleziona ${field.replace(/_/g, " ")}`}
              disabled={false}
              className={hasError ? "border-red-500" : ""}
              id={field}
              showCurrentTime={field === "data_inizio" && !fieldValue}
            />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "boolean":
        return (
          <div key={field} className="flex items-center space-x-2">
            <Checkbox
              id={field}
              checked={!!fieldValue}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
            />
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
            </Label>
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "select":
        const options = selectOptions[field] || []
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={fieldValue || ""} onValueChange={(value) => handleFieldChange(field, value)}>
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "priority_select":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {priorityOptions.length > 0 ? (
              <Select
                value={fieldValue?.toString() || ""}
                onValueChange={(value) => handleFieldChange(field, Number.parseInt(value))}
              >
                <SelectTrigger className={hasError ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleziona priorità..." />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.nome}
                      {option.descrizione && <span className="text-sm text-gray-500 ml-2">({option.descrizione})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1 p-2 border border-red-300 bg-red-50 rounded-md text-red-600 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Impossibile caricare le opzioni di priorità. Verificare la configurazione.</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={loadPriorityOptions}>
                  Riprova caricamento
                </Button>
              </div>
            )}
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      case "color":
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <ColorPicker value={fieldValue || ""} onChange={(value) => handleFieldChange(field, value)} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )

      default:
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className={hasError ? "text-red-500" : ""}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} />
            {hasError && <p className="text-sm text-red-500">{errors[field]}</p>}
          </div>
        )
    }
  }

  if (!isValidTable) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Tabella non trovata</h1>
              <p className="text-gray-600 mb-4">La tabella "{tableName}" non è disponibile.</p>
              <Button onClick={() => router.push("/data-explorer")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Data Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tableConfig) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Configurazione mancante</h1>
              <p className="text-gray-600 mb-4">La configurazione per la tabella "{tableName}" non è disponibile.</p>
              <Button onClick={() => router.push("/data-explorer")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Data Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tableInfo = AVAILABLE_TABLES.find((t) => t.id === tableName)
  const Icon = tableInfo?.icon || ArrowLeft

  const getItemTitle = () => {
    if (formData.titolo) return formData.titolo
    if (formData.username) return formData.username
    if (formData.nome) return formData.cognome ? `${formData.nome} ${formData.cognome}` : formData.nome
    return `ID: ${itemId}`
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button onClick={handleBackToList} variant="outline" className="mb-4 bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla lista
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 mb-2">
            <Icon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">{getItemTitle()}</h1>
              <div className="flex items-center space-x-2">
                <p className="text-gray-600">{tableInfo?.label}</p>
                <Badge variant="outline">ID: {itemId}</Badge>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditMode ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Salva
                    </>
                  )}
                </Button>
                <Button onClick={handleCancelEdit} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Annulla
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditMode(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifica
                </Button>
                <Button onClick={handleDelete} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <span>Dettagli {tableInfo?.label}</span>
          </CardTitle>
          <CardDescription>Visualizzazione completa del record selezionato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <SimpleDateTest />
            <NativePopoverTest />

            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
              <h3 className="text-sm font-bold text-blue-700 mb-2">TEST 3: Enhanced Date Picker</h3>
              <EnhancedDatePicker
                value=""
                onChange={(value) => console.log("[TEST] Date picker changed:", value)}
                placeholder="Seleziona data e ora di test"
              />
            </div>

            <div className="p-4 border-2 border-purple-500 rounded-lg bg-purple-50">
              <h3 className="text-sm font-bold text-purple-700 mb-2">TEST 4: Button Normale</h3>
              <Button
                onClick={() => {
                  console.log("[TEST] Button normale cliccato")
                  alert("Button normale funziona!")
                }}
              >
                Test Button Normale
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fieldOrder.length > 0
              ? fieldOrder.map((field) => renderField(field))
              : Object.keys(fieldTypes)
                  .filter((field) => !autoFields.includes(field))
                  .map((field) => renderField(field))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
