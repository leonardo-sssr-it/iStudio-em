"use client"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Code2, RotateCcw, Minimize2, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { useJsonField, type UseJsonFieldReturn } from "@/hooks/use-json-field"

interface JsonEditorProps {
  label?: string
  value: any
  onChange: (value: any) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  rows?: number
}

export function JsonEditor({
  label,
  value,
  onChange,
  placeholder = "Inserisci JSON valido...",
  disabled = false,
  required = false,
  className = "",
  rows = 6,
}: JsonEditorProps) {
  const jsonField: UseJsonFieldReturn = useJsonField(value)
  const { state, actions } = jsonField

  // Gestisci il cambiamento del valore
  const handleValueChange = (newValue: string) => {
    actions.setValue(newValue)

    // Se il JSON è valido, notifica il parent
    if (actions.validate().isValid) {
      try {
        const parsed = newValue.trim() === "" ? null : JSON.parse(newValue)
        onChange(parsed)
      } catch {
        // Se c'è un errore nel parsing, non aggiornare il parent
      }
    }
  }

  // Gestisci la formattazione
  const handleFormat = () => {
    actions.format()
    if (state.validation.isValid) {
      try {
        const parsed = JSON.parse(state.value || "null")
        onChange(parsed)
      } catch {
        // Ignora errori
      }
    }
  }

  // Gestisci la minificazione
  const handleMinify = () => {
    actions.minify()
    if (state.validation.isValid) {
      try {
        const parsed = JSON.parse(state.value || "null")
        onChange(parsed)
      } catch {
        // Ignora errori
      }
    }
  }

  // Gestisci il reset
  const handleReset = () => {
    actions.reset()
    onChange(value) // Ripristina al valore originale
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label e controlli */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {label && (
            <Label className="text-sm font-medium">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}

          {/* Badge del tipo */}
          {state.validation.isValid && state.validation.type && (
            <Badge variant="secondary" className="text-xs">
              {state.validation.type}
            </Badge>
          )}

          {/* Indicatore dirty */}
          {state.isDirty && (
            <Badge variant="outline" className="text-xs">
              modificato
            </Badge>
          )}
        </div>

        {/* Controlli */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={disabled || !state.validation.isValid}
            title="Formatta JSON"
          >
            <Code2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMinify}
            disabled={disabled || !state.validation.isValid}
            title="Minifica JSON"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled || !state.isDirty}
            title="Ripristina valore originale"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <Textarea
          value={state.value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`font-mono text-sm ${
            state.validation.isValid
              ? "border-green-300 focus:border-green-500"
              : state.value.trim() !== ""
                ? "border-red-300 focus:border-red-500"
                : ""
          }`}
          aria-describedby={!state.validation.isValid ? "json-error" : undefined}
        />

        {/* Indicatore di stato nell'angolo */}
        <div className="absolute top-2 right-2">
          {state.validation.isValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : state.value.trim() !== "" ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>

      {/* Messaggio di errore */}
      {!state.validation.isValid && state.value.trim() !== "" && (
        <Alert variant="destructive" id="json-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Errore JSON:</div>
              <div>{state.validation.error}</div>
              {(state.validation.line || state.validation.column) && (
                <div className="text-sm opacity-75">
                  {state.validation.line && `Linea ${state.validation.line}`}
                  {state.validation.line && state.validation.column && ", "}
                  {state.validation.column && `Colonna ${state.validation.column}`}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Informazioni di debug (solo in development) */}
      {process.env.NODE_ENV === "development" && state.validation.isValid && state.validation.type && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Debug:</strong> Tipo: {state.validation.type}
            {state.isDirty && ", Modificato"}
            {state.isFormatted && ", Formattato"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
