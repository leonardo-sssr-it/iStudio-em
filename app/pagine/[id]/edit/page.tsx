"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
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
import { ArrowLeft, Save, Trash2, X, AlertCircle, Eye } from "lucide-react"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { TagInput } from "@/components/ui/tag-input"
import Link from "next/link"

// Configurazione campi per la tabella pagine
const PAGE_FIELDS = {
  listFields: ["id", "titolo", "slug", "stato", "pubblicato", "attivo"],
  readOnlyFields: ["id", "id_utente", "data_creazione", "data_modifica"],
  requiredFields: ["titolo"],
  defaultSort: "data_creazione",
  types: {
    id: "number",
    titolo: "string",
    slug: "string",
    contenuto: "markdown",
    estratto: "text",
    categoria: "string",
    tags: "json",
    immagine: "string",
    pubblicato: "datetime",
    privato: "boolean",
    attivo: "boolean",
    stato: "select",
    meta_title: "string",
    meta_description: "text",
    id_utente: "number",
    data_creazione: "datetime",
    data_modifica: "datetime",
  },
  selectOptions: {
    stato: [
      { value: "bozza", label: "Bozza" },
      { value: "pubblicato", label: "Pubblicato" },
      { value: "archiviato", label: "Archiviato" },
    ],
  },
  groups: {
    "Informazioni principali": ["titolo", "slug", "stato", "categoria", "pubblicato", "privato", "attivo"],
    Contenuto: ["estratto", "contenuto", "immagine"],
    "SEO e Tags": ["meta_title", "meta_description", "tags"],
    "Informazioni di sistema": ["id", "id_utente", "data_creazione", "data_modifica"],
  },
}

// Componente per l'editor Markdown
const MarkdownEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [isPreview, setIsPreview] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Contenuto (Markdown)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {isPreview ? "Modifica" : "Anteprima"}
        </Button>
      </div>
      {isPreview ? (
        <div className="min-h-[200px] p-4 border rounded-md bg-gray-50">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{value || "Nessun contenuto da visualizzare"}</div>
          </div>
        </div>
      ) : (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Scrivi il contenuto in Markdown..."
          className="min-h-[200px] font-mono text-sm"
          rows={10}
        />
      )}
      {!isPreview && (
        <div className="text-xs text-muted-foreground">
          Supporta Markdown: **grassetto**, *corsivo*, # Titoli, [link](url), etc.
        </div>
      )}
    </div>
  )
}

// Funzione per pulire i dati prima del salvataggio
function cleanDataForSave(data: any, readOnlyFields: string[] = []): any {
  const cleaned = { ...data }
  readOnlyFields.forEach((field) => {
    if (field !== "id_utente") delete cleaned[field]
  })
  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key]
    if (value === undefined) delete cleaned[key]
    else if (typeof value === "string" && value.trim() === "") cleaned[key] = null
    else if (typeof value === "number" && isNaN(value)) delete cleaned[key]
  })
  return cleaned
}

export default function EditPagePage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [item, setItem] = useState<any>(null)
  const [editedItem, setEditedItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("main")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const itemId = Array.isArray(params.id) ? params.id[0] : params.id
  const isNewItem = itemId === "new"

  const readOnlyFields = PAGE_FIELDS.readOnlyFields
  const requiredFields = PAGE_FIELDS.requiredFields
  const fieldTypes = PAGE_FIELDS.types
  const fieldGroups = PAGE_FIELDS.groups
  const selectOptions = PAGE_FIELDS.selectOptions

  const validateForm = (): string[] => {
    const errors: string[] = []
    if (!editedItem) return errors

    requiredFields.forEach((field) => {
      const value = editedItem[field]
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
        errors.push(`Il campo "${label}" è obbligatorio`)
      }
    })

    // Validazione slug
    if (editedItem.slug && !/^[a-z0-9-]+$/.test(editedItem.slug)) {
      errors.push("Lo slug può contenere solo lettere minuscole, numeri e trattini")
    }

    return errors
  }

  const loadItem = useCallback(async () => {
    if (!supabase || !user?.id) return
    setLoading(true)

    try {
      if (isNewItem) {
        const newItem: any = {
          id_utente: user.id,
          titolo: "",
          slug: "",
          contenuto: "",
          stato: "bozza",
          attivo: true,
          privato: false,
          pubblicato: new Date().toISOString(),
        }
        setItem(newItem)
        setEditedItem(newItem)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("pagine")
        .select("*")
        .eq("id", itemId)
        .eq("id_utente", user.id)
        .single()

      if (error) throw error

      setItem(data)
      setEditedItem(data)
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile caricare la pagina: ${error.message}`,
        variant: "destructive",
      })
      router.push("/pagine")
    } finally {
      setLoading(false)
    }
  }, [supabase, itemId, user?.id, isNewItem, router])

  useEffect(() => {
    if (supabase && user?.id) loadItem()
  }, [supabase, user?.id, loadItem])

  const handleFieldChange = (field: string, value: any) => {
    setEditedItem((prev: any) => {
      const updated = { ...prev, [field]: value }

      // Auto-genera slug dal titolo se il campo slug è vuoto
      if (field === "titolo" && (!prev.slug || prev.slug === "")) {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()
        updated.slug = slug
      }

      return updated
    })
    setValidationErrors([])
  }

  const handleSave = async () => {
    if (!supabase || !user?.id || !editedItem) return

    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      toast({
        title: "Errori di validazione",
        description: "Correggi gli errori evidenziati prima di salvare",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const updateData = cleanDataForSave(editedItem, isNewItem ? readOnlyFields : [])
      updateData.data_modifica = new Date().toISOString()

      if (isNewItem) {
        updateData.id_utente = user.id
        updateData.data_creazione = new Date().toISOString()
      }

      let result
      if (isNewItem) {
        result = await supabase.from("pagine").insert(updateData).select()
      } else {
        result = await supabase.from("pagine").update(updateData).eq("id", itemId).select()
      }

      if (result.error) throw new Error(result.error.message)

      toast({ title: "Salvato", description: "La pagina è stata salvata con successo" })
      setItem(result.data[0])
      setEditedItem(result.data[0])
      setValidationErrors([])

      if (isNewItem) {
        router.push(`/pagine/${result.data[0].id}`)
      } else {
        router.push(`/pagine/${itemId}`)
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile salvare la pagina: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (isNewItem) {
      router.push("/pagine")
    } else {
      router.push(`/pagine/${itemId}`)
    }
  }

  const handleDelete = async () => {
    if (!supabase || !itemId || isNewItem) return
    setDeleting(true)

    try {
      const { error } = await supabase.from("pagine").delete().eq("id", itemId)
      if (error) throw error

      toast({ title: "Eliminato", description: "La pagina è stata eliminata con successo" })
      router.push("/pagine")
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile eliminare la pagina: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const renderField = (field: string, value: any, type: string, readOnly = false) => {
    const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
    const isRequired = requiredFields.includes(field)
    const hasError = validationErrors.some((error) => error.includes(label))

    if (readOnly) {
      return (
        <div className="mb-4" key={field}>
          <Label className="text-sm font-medium">{label}</Label>
          <div className="mt-1 p-2 rounded-md bg-gray-100">{value || "-"}</div>
        </div>
      )
    }

    switch (type) {
      case "markdown":
        return (
          <div className="mb-4" key={field}>
            <MarkdownEditor value={value || ""} onChange={(val) => handleFieldChange(field, val)} />
          </div>
        )

      case "text":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field}
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
              rows={4}
              placeholder={isRequired ? `${label} è obbligatorio` : `Inserisci ${label.toLowerCase()}`}
            />
          </div>
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2 mb-4" key={field}>
            <Switch
              id={field}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
            />
            <Label htmlFor={field}>{label}</Label>
          </div>
        )

      case "datetime":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <EnhancedDatePicker
              id={field}
              value={value || ""}
              onChange={(newValue) => handleFieldChange(field, newValue)}
              placeholder={`Seleziona ${label.toLowerCase()}`}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
            />
          </div>
        )

      case "select":
        const options = selectOptions[field] || []
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value || ""} onValueChange={(val) => handleFieldChange(field, val)}>
              <SelectTrigger className={`mt-1 ${hasError ? "border-red-500" : ""}`}>
                <SelectValue placeholder={`Seleziona ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "json":
        if (field === "tags") {
          return (
            <div className="mb-4" key={field}>
              <Label htmlFor={field}>{label}</Label>
              <TagInput
                id={field}
                value={Array.isArray(value) ? value : []}
                onChange={(tags) => handleFieldChange(field, tags)}
                placeholder="Aggiungi tag..."
                className="mt-1"
              />
            </div>
          )
        }
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Textarea
              id={field}
              value={typeof value === "object" ? JSON.stringify(value, null, 2) : value || ""}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  handleFieldChange(field, parsed)
                } catch {
                  handleFieldChange(field, e.target.value)
                }
              }}
              className="mt-1 font-mono text-sm"
              rows={4}
              placeholder="JSON valido..."
            />
          </div>
        )

      default: // string
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field}
              type="text"
              value={value || ""}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
              placeholder={isRequired ? `${label} è obbligatorio` : `Inserisci ${label.toLowerCase()}`}
            />
            {field === "slug" && (
              <div className="text-xs text-muted-foreground mt-1">
                Solo lettere minuscole, numeri e trattini. Viene generato automaticamente dal titolo.
              </div>
            )}
          </div>
        )
    }
  }

  const renderFieldGroups = () => {
    if (!editedItem) return null

    const allFields = Object.keys(editedItem)
    const tabs = Object.keys(fieldGroups)

    return (
      <div>
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <h4 className="text-sm font-medium text-red-800">Errori di validazione:</h4>
            </div>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            {tabs.map((group) => (
              <TabsTrigger key={group} value={group.toLowerCase().replace(/\s+/g, "-")}>
                {group}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((group) => {
            const groupFields = fieldGroups[group as keyof typeof fieldGroups] || []
            return (
              <TabsContent key={group} value={group.toLowerCase().replace(/\s+/g, "-")}>
                <div className="space-y-4">
                  {groupFields.map((field) => {
                    if (!allFields.includes(field) && !isNewItem) return null
                    const isReadOnly = readOnlyFields.includes(field)
                    const fieldType = fieldTypes[field as keyof typeof fieldTypes] || "string"

                    return renderField(field, editedItem[field], fieldType, isReadOnly)
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    )
  }

  useEffect(() => {
    if (fieldGroups && Object.keys(fieldGroups).length > 0) {
      setActiveTab(Object.keys(fieldGroups)[0].toLowerCase().replace(/\s+/g, "-"))
    }
  }, [fieldGroups])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Link href={isNewItem ? "/pagine" : `/pagine/${itemId}`}>
                <Button variant="ghost" className="mb-2">
                  <ArrowLeft size={16} className="mr-2" /> Torna indietro
                </Button>
              </Link>
              <CardTitle className="text-2xl">
                {isNewItem ? "Nuova Pagina" : `Modifica: ${item?.titolo || "Pagina"}`}
              </CardTitle>
              <CardDescription>
                {isNewItem ? "Crea una nuova pagina" : "Modifica i dettagli della pagina"}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? "Salvataggio..." : "Salva pagina"}
                {!saving && <Save size={16} className="ml-2" />}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X size={16} className="mr-2" /> Annulla
              </Button>
              {!isNewItem && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 size={16} className="mr-2" /> Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione non può essere annullata. La pagina verrà eliminata permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? "Eliminazione..." : "Elimina"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>{editedItem && renderFieldGroups()}</CardContent>
      </Card>
    </div>
  )
}
