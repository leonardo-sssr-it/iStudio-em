"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { TagInput } from "@/components/ui/tag-input"
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
import Link from "next/link"
import type { Pagina } from "@/lib/services/pagine-service"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-gray-800">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-gray-700">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-600">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-600">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-3">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-3 text-sm">{children}</pre>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-blue-600 hover:text-blue-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-500 italic">Nessun contenuto da visualizzare</p>
            )}
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

// Definizione dei campi e gruppi
const FIELD_GROUPS = {
  "Informazioni principali": ["titolo", "categoria", "pubblicato", "privato", "attivo"],
  Contenuto: ["estratto", "contenuto", "immagine"],
  "Tags e metadati": ["tags"],
  "Informazioni di sistema": ["id", "id_utente", "modifica"],
}

const READ_ONLY_FIELDS = ["id", "id_utente", "modifica"]
const REQUIRED_FIELDS = ["titolo", "contenuto"]

interface PaginaFormProps {
  pagina?: Pagina | null
  onSave: (pagina: any) => Promise<Pagina | null>
  onDelete?: (id: number) => Promise<boolean>
  isNew?: boolean
}

export function PaginaForm({ pagina, onSave, onDelete, isNew = false }: PaginaFormProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [editedItem, setEditedItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("informazioni-principali")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Inizializza il form con i dati della pagina o valori predefiniti
  useEffect(() => {
    if (isNew) {
      setEditedItem({
        id_utente: user?.id,
        titolo: "",
        contenuto: "",
        estratto: "",
        categoria: "",
        tags: [],
        immagine: "",
        pubblicato: new Date().toISOString(),
        privato: false,
        attivo: true,
      })
    } else if (pagina) {
      setEditedItem(pagina)
    }
  }, [pagina, isNew, user?.id])

  // Imposta la tab attiva all'inizializzazione
  useEffect(() => {
    if (FIELD_GROUPS && Object.keys(FIELD_GROUPS).length > 0) {
      setActiveTab(Object.keys(FIELD_GROUPS)[0].toLowerCase().replace(/\s+/g, "-"))
    }
  }, [])

  // Gestisce il cambio di un campo
  const handleFieldChange = (field: string, value: any) => {
    setEditedItem((prev: any) => ({
      ...prev,
      [field]: value,
    }))
    setValidationErrors([])
  }

  // Valida il form
  const validateForm = (): string[] => {
    const errors: string[] = []

    REQUIRED_FIELDS.forEach((field) => {
      const value = editedItem[field]
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
        errors.push(`Il campo "${label}" è obbligatorio`)
      }
    })

    return errors
  }

  // Salva la pagina
  const handleSave = async () => {
    if (!editedItem || !user?.id) return

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
      // Prepara i dati per il salvataggio
      const saveData = { ...editedItem }

      // Imposta i campi obbligatori
      if (isNew) {
        saveData.id_utente = user.id
      }

      saveData.modifica = new Date().toISOString()

      // Salva la pagina
      const savedPagina = await onSave(saveData)

      if (savedPagina) {
        toast({
          title: "Salvato",
          description: "La pagina è stata salvata con successo",
        })

        // Reindirizza alla pagina di dettaglio
        if (isNew) {
          router.push(`/pagine/${savedPagina.id}`)
        } else {
          router.push(`/pagine/${pagina?.id}`)
        }
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

  // Elimina la pagina
  const handleDelete = async () => {
    if (!pagina?.id || !onDelete) return

    setDeleting(true)
    try {
      const success = await onDelete(pagina.id)

      if (success) {
        toast({
          title: "Eliminato",
          description: "La pagina è stata eliminata con successo",
        })
        router.push("/pagine")
      }
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

  // Annulla la modifica
  const handleCancel = () => {
    if (isNew) {
      router.push("/pagine")
    } else if (pagina?.id) {
      router.push(`/pagine/${pagina.id}`)
    } else {
      router.push("/pagine")
    }
  }

  // Renderizza un campo in base al tipo
  const renderField = (field: string, value: any, readOnly = false) => {
    const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")
    const isRequired = REQUIRED_FIELDS.includes(field)
    const hasError = validationErrors.some((error) => error.includes(label))

    if (readOnly) {
      return (
        <div className="mb-4" key={field}>
          <Label className="text-sm font-medium">{label}</Label>
          <div className="mt-1 p-2 rounded-md bg-gray-100">{value || "-"}</div>
        </div>
      )
    }

    switch (field) {
      case "contenuto":
        return (
          <div className="mb-4" key={field}>
            <MarkdownEditor value={value || ""} onChange={(val) => handleFieldChange(field, val)} />
            {hasError && <p className="text-red-500 text-xs mt-1">Il contenuto è obbligatorio</p>}
          </div>
        )

      case "estratto":
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
              rows={3}
              placeholder={`Inserisci un breve estratto della pagina`}
            />
          </div>
        )

      case "privato":
      case "attivo":
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

      case "pubblicato":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field} className={hasError ? "text-red-600" : ""}>
              {label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <EnhancedDatePicker
              id={field}
              value={value || ""}
              onChange={(newValue) => handleFieldChange(field, newValue)}
              placeholder={`Seleziona data di pubblicazione`}
              className={`mt-1 ${hasError ? "border-red-500" : ""}`}
            />
          </div>
        )

      case "tags":
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

      case "categoria":
        return (
          <div className="mb-4" key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Select value={value || ""} onValueChange={(val) => handleFieldChange(field, val)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nessuna">Nessuna categoria</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="documentazione">Documentazione</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      default: // string (titolo, immagine, etc.)
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
            {field === "immagine" && (
              <p className="text-xs text-muted-foreground mt-1">Inserisci l'URL dell'immagine</p>
            )}
          </div>
        )
    }
  }

  // Renderizza i gruppi di campi
  const renderFieldGroups = () => {
    if (!editedItem) return null

    const tabs = Object.keys(FIELD_GROUPS)

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
            const groupFields = FIELD_GROUPS[group as keyof typeof FIELD_GROUPS] || []
            const tabId = group.toLowerCase().replace(/\s+/g, "-")

            return (
              <TabsContent key={group} value={tabId}>
                <div className="space-y-4">
                  {groupFields.map((field) => {
                    if (!editedItem.hasOwnProperty(field) && !isNew) return null
                    const isReadOnly = READ_ONLY_FIELDS.includes(field)
                    return renderField(field, editedItem[field], isReadOnly)
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    )
  }

  if (!editedItem) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Caricamento...</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Link href={isNew ? "/pagine" : `/pagine/${pagina?.id}`}>
              <Button variant="ghost" className="mb-2">
                <ArrowLeft size={16} className="mr-2" /> Torna indietro
              </Button>
            </Link>
            <CardTitle className="text-2xl">
              {isNew ? "Nuova Pagina" : `Modifica: ${pagina?.titolo || "Pagina"}`}
            </CardTitle>
            <CardDescription>{isNew ? "Crea una nuova pagina" : "Modifica i dettagli della pagina"}</CardDescription>
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
            <Button variant="outline" onClick={handleCancel}>
              <X size={16} className="mr-2" /> Annulla
            </Button>
            {!isNew && onDelete && (
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
      <CardContent>{renderFieldGroups()}</CardContent>
    </Card>
  )
}
