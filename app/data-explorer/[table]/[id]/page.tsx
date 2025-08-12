"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Trash2, Edit, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  getTableConfig,
  getVisibleFields,
  getEditableFields,
  getFieldType,
  getSelectOptions,
  isRequiredField,
} from "../../config"

export default function DataExplorerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { user } = useAuth()

  const table = params?.table as string
  const id = params?.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(id === "new")
  const [formData, setFormData] = useState<any>({})

  // Ottieni configurazione tabella
  const tableConfig = getTableConfig(table)
  const visibleFields = getVisibleFields(table)
  const editableFields = getEditableFields(table)

  // Carica i dati se non è una nuova entry
  useEffect(() => {
    if (id !== "new" && table && supabase && user) {
      loadData()
    } else if (id === "new") {
      // Inizializza form per nuovo elemento
      const initialData: any = { id_utente: user?.id }
      setFormData(initialData)
      setData(initialData)
      setLoading(false)
    }
  }, [id, table, supabase, user])

  const loadData = async () => {
    if (!supabase || !table || !id || !user) return

    try {
      setLoading(true)

      const { data: result, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .eq("id_utente", user.id)
        .single()

      if (error) {
        throw error
      }

      setData(result)
      setFormData(result)
    } catch (error: any) {
      console.error("Errore caricamento dati:", error)
      toast({
        title: "Errore",
        description: `Impossibile caricare i dati: ${error.message}`,
        variant: "destructive",
      })
      router.push(`/data-explorer?table=${table}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!supabase || !table || !user) return

    try {
      setSaving(true)

      // Prepara i dati per il salvataggio
      const saveData = { ...formData }
      saveData.modifica = new Date().toISOString()

      if (id === "new") {
        saveData.id_utente = user.id

        const { data: result, error } = await supabase.from(table).insert([saveData]).select().single()

        if (error) throw error

        toast({
          title: "Successo",
          description: "Elemento creato con successo",
        })

        router.push(`/data-explorer/${table}/${result.id}`)
      } else {
        const { error } = await supabase.from(table).update(saveData).eq("id", id).eq("id_utente", user.id)

        if (error) throw error

        setData(saveData)
        setEditing(false)

        toast({
          title: "Successo",
          description: "Elemento aggiornato con successo",
        })
      }
    } catch (error: any) {
      console.error("Errore salvataggio:", error)
      toast({
        title: "Errore",
        description: `Impossibile salvare: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!supabase || !table || !id || !user || id === "new") return

    if (!confirm("Sei sicuro di voler eliminare questo elemento?")) return

    try {
      const { error } = await supabase.from(table).delete().eq("id", id).eq("id_utente", user.id)

      if (error) throw error

      toast({
        title: "Successo",
        description: "Elemento eliminato con successo",
      })

      router.push(`/data-explorer?table=${table}`)
    } catch (error: any) {
      console.error("Errore eliminazione:", error)
      toast({
        title: "Errore",
        description: `Impossibile eliminare: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const renderField = (fieldName: string, value: any, isEditing: boolean) => {
    const fieldType = getFieldType(table, fieldName)
    const selectOptions = getSelectOptions(table, fieldName)
    const required = isRequiredField(table, fieldName)

    if (!isEditing) {
      // Modalità visualizzazione
      return (
        <div key={fieldName} className="space-y-2">
          <Label className="text-sm font-medium">
            {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
          </Label>
          <div className="p-2 bg-muted rounded-md text-sm">{renderFieldValue(value, fieldType)}</div>
        </div>
      )
    }

    // Modalità modifica
    const commonProps = {
      id: fieldName,
      value: value || "",
      onChange: (e: any) => handleFieldChange(fieldName, e.target.value),
      required,
    }

    switch (fieldType) {
      case "text":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea {...commonProps} rows={4} />
          </div>
        )

      case "boolean":
        return (
          <div key={fieldName} className="flex items-center space-x-2">
            <Switch
              id={fieldName}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
            </Label>
          </div>
        )

      case "date":
      case "datetime":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={fieldType === "date" ? "date" : "datetime-local"}
              value={value ? new Date(value).toISOString().slice(0, fieldType === "date" ? 10 : 16) : ""}
            />
          </div>
        )

      case "number":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              onChange={(e) => handleFieldChange(fieldName, Number.parseInt(e.target.value) || 0)}
            />
          </div>
        )

      default:
        if (selectOptions.length > 0) {
          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName} className="text-sm font-medium">
                {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select value={value || ""} onValueChange={(val) => handleFieldChange(fieldName, val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName} className="text-sm font-medium">
              {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace("_", " ")}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input {...commonProps} />
          </div>
        )
    }
  }

  const renderFieldValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "-"

    switch (type) {
      case "boolean":
        return value ? "✓ Sì" : "✗ No"
      case "date":
        return value ? new Date(value).toLocaleDateString("it-IT") : "-"
      case "datetime":
        return value ? new Date(value).toLocaleString("it-IT") : "-"
      case "text":
        return value.length > 100 ? value.substring(0, 100) + "..." : value
      default:
        return String(value)
    }
  }

  if (!tableConfig) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">Tabella non configurata: {table}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna indietro
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna indietro
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{id === "new" ? `Nuovo ${table}` : `${table} #${id}`}</h1>
            <p className="text-muted-foreground">{editing ? "Modalità modifica" : "Modalità visualizzazione"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {id !== "new" && (
            <>
              <Button variant="outline" onClick={() => setEditing(!editing)} disabled={saving}>
                {editing ? (
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

              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </Button>
            </>
          )}

          {editing && (
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
          <CardTitle>{editing ? "Modifica dati" : "Dettagli"}</CardTitle>
          <CardDescription>
            {editing ? "Modifica i campi desiderati e clicca Salva" : "Visualizzazione dei dati dell'elemento"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleFields.map((fieldName) => {
              const shouldShow = editing ? editableFields.includes(fieldName) : true
              if (!shouldShow) return null

              return renderField(fieldName, formData[fieldName], editing)
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
