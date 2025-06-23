"use client"

import { useJsonField } from "@/hooks/use-json-field"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Check, Code, Minimize2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface JsonEditorProps {
  label: string
  value: any
  onChange: (value: any) => void
  placeholder?: string
  className?: string
  rows?: number
  disabled?: boolean
}

export function JsonEditor({
  label,
  value,
  onChange,
  placeholder = "Inserisci JSON valido...",
  className,
  rows = 6,
  disabled = false,
}: JsonEditorProps) {
  const {
    value: jsonValue,
    validation,
    isDirty,
    isFormatted,
    setValue,
    formatJson,
    minifyJson,
    reset,
    isValid,
    error,
    errorLine,
    errorColumn,
    parsedValue,
    canFormat,
    canMinify,
  } = useJsonField(value)

  // Notifica il parent component quando il valore cambia
  const handleChange = (newValue: string) => {
    setValue(newValue)

    // Se il JSON è valido, notifica il parent con il valore parsato
    const validationResult = validation
    if (validationResult.isValid) {
      onChange(validationResult.parsed)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header con label e controlli */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          {label}
          {isValid ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </Label>

        {/* Controlli di formattazione */}
        <div className="flex items-center gap-1">
          {canFormat && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={formatJson}
              disabled={disabled}
              className="h-7 px-2"
            >
              <Code className="h-3 w-3" />
            </Button>
          )}

          {canMinify && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={minifyJson}
              disabled={disabled}
              className="h-7 px-2"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          )}

          {isDirty && (
            <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={disabled} className="h-7 px-2">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor textarea */}
      <div className="relative">
        <Textarea
          value={jsonValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "font-mono text-sm resize-none",
            !isValid && "border-destructive focus:border-destructive",
            isValid && isDirty && "border-green-500",
            className,
          )}
          rows={rows}
          disabled={disabled}
        />

        {/* Indicatore di stato nell'angolo */}
        <div className="absolute top-2 right-2">
          {isValid ? (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <Check className="h-3 w-3" />
              Valido
            </div>
          ) : error ? (
            <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
              <AlertCircle className="h-3 w-3" />
              Errore
            </div>
          ) : null}
        </div>
      </div>

      {/* Messaggio di errore dettagliato */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm text-destructive font-medium">Errore JSON</p>
            <p className="text-sm text-destructive/80">{error}</p>
            {errorLine && errorColumn && (
              <p className="text-xs text-destructive/60">
                Linea {errorLine}, Colonna {errorColumn}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info sul valore parsato (solo in development) */}
      {process.env.NODE_ENV === "development" && isValid && parsedValue !== null && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Tipo:</strong> {Array.isArray(parsedValue) ? "Array" : typeof parsedValue}
          {Array.isArray(parsedValue) && ` (${parsedValue.length} elementi)`}
          {typeof parsedValue === "object" &&
            !Array.isArray(parsedValue) &&
            ` (${Object.keys(parsedValue).length} proprietà)`}
        </div>
      )}
    </div>
  )
}
