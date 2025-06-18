"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import type { Nota } from "@/lib/services/note-service"
import { useAppConfig } from "@/hooks/use-app-config"

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
          placeholder="Scrivi il contenuto della nota in Markdown..."
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

const REQUIRED_FIELDS = ["titolo", "contenuto"]

interface NotaFormProps {
  nota?: Nota | null
  onSave: (nota: any) => Promise<Nota | null>
  onDelete?: (id: number) => Promise<boolean>
  isNew?: boolean
}

export function NotaForm({ nota, onSave, onDelete, isNew = false }: NotaFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { config } = useAppConfig()

  const [editedItem, setEditedItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Ottieni le priorità dalla configurazione
  const priorityOptions = config?.priorita || []

  // Inizializza il form con i dati della nota o valori predefiniti
  useEffect(() => {
    if (isNew) {
      setEditedItem({
        id_utente: user?.id,
        titolo: "",
        contenuto: "",
        tags: [],
        priorita: "",
        notifica: "",
        synced: false,
      })
    } else if (nota) {
      setEditedItem(nota)
    }
  }, [nota, isNew, user?.id])

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

  // Salva la nota
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

      // Pulisci i campi vuoti
      if (!saveData.priorita) saveData.priorita = null
      if (!saveData.notifica) saveData.notifica = null
      if (!saveData.tags || saveData.tags.length === 0) saveData.tags = null

      // Salva la nota
      const savedNota = await onSave(saveData)

      if (savedNota) {
        toast({
          title: "Salvato",
          description: "La nota è stata salvata con successo",
        })

        // Reindirizza alla pagina di dettaglio
        if (isNew) {
          router.push(`/note/${savedNota.id}`)
        } else {
          router.push(`/note/${nota?.id}`)
        }
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile salvare la nota: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Elimina la nota
  const handleDelete = async () => {
    if (!nota?.id || !onDelete) return

    setDeleting(true)
    try {
      const success = await onDelete(nota.id)

      if (success) {
        toast({
          title: "Eliminato",
          description: "La nota è stata eliminata con successo",
        })
        router.push("/note")
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Impossibile eliminare la nota: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Annulla la modifica
  const handleCancel = () => {
    if (isNew) {
      router.push("/note")
    } else if (nota?.id) {
      router.push(`/note/${nota.id}`)
    } else {
      router.push("/note")
    }
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
            <Link href={isNew ? "/note" : `/note/${nota?.id}`}>
              <Button variant="ghost" className="mb-2">
                <ArrowLeft size={16} className="mr-2" /> Torna indietro
              </Button>
            </Link>
            <CardTitle className="text-2xl">{isNew ? "Nuova Nota" : `Modifica: ${nota?.titolo || "Nota"}`}</CardTitle>
            <CardDescription>{isNew ? "Crea una nuova nota" : "Modifica i dettagli della nota"}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Salvataggio..." : "Salva nota"}
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
                      Questa azione non può essere annullata. La nota verrà eliminata permanentemente.
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
      <CardContent>
        <div className="space-y-6">
          {/* Errori di validazione */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
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

          {/* Titolo */}
          <div>
            <Label
              htmlFor="titolo"
              className={validationErrors.some((e) => e.includes("Titolo")) ? "text-red-600" : ""}
            >
              Titolo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titolo"
              type="text"
              value={editedItem.titolo || ""}
              onChange={(e) => handleFieldChange("titolo", e.target.value)}
              className={`mt-1 ${validationErrors.some((e) => e.includes("Titolo")) ? "border-red-500" : ""}`}
              placeholder="Inserisci il titolo della nota"
            />
          </div>

          {/* Contenuto */}
          <div>
            <MarkdownEditor
              value={editedItem.contenuto || ""}
              onChange={(val) => handleFieldChange("contenuto", val)}
            />
            {validationErrors.some((e) => e.includes("Contenuto")) && (
              <p className="text-red-500 text-xs mt-1">Il contenuto è obbligatorio</p>
            )}
          </div>

          {/* Priorità */}
          <div>
            <Label htmlFor="priorita">Priorità</Label>
            <Select value={editedItem.priorita || ""} onValueChange={(val) => handleFieldChange("priorita", val)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona priorità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nessuna">Nessuna priorità</SelectItem>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notifica */}
          <div>
            <Label htmlFor="notifica">Notifica/Promemoria</Label>
            <EnhancedDatePicker
              id="notifica"
              value={editedItem.notifica || ""}
              onChange={(newValue) => handleFieldChange("notifica", newValue)}
              placeholder="Seleziona data e ora per il promemoria"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Imposta un promemoria per questa nota</p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              id="tags"
              value={Array.isArray(editedItem.tags) ? editedItem.tags : []}
              onChange={(tags) => handleFieldChange("tags", tags)}
              placeholder="Aggiungi tag..."
              className="mt-1"
            />
          </div>

          {/* Informazioni di sistema (solo in modifica) */}
          {!isNew && nota && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Informazioni di sistema:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">ID:</span> {nota.id}
                </div>
                <div>
                  <span className="font-medium">Creata il:</span>{" "}
                  {nota.creato_il ? new Date(nota.creato_il).toLocaleString("it-IT") : "-"}
                </div>
                <div>
                  <span className="font-medium">Ultima modifica:</span>{" "}
                  {nota.modifica ? new Date(nota.modifica).toLocaleString("it-IT") : "-"}
                </div>
                <div>
                  <span className="font-medium">Sincronizzata:</span> {nota.synced ? "Sì" : "No"}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export with English name for compatibility
export { NotaForm as NoteForm }
