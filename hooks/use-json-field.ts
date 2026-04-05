"use client"

import { useState, useCallback, useMemo } from "react"

// Tipi per la validazione JSON
export interface JsonValidationResult {
  isValid: boolean
  error?: string
  line?: number
  column?: number
  type?: string
}

export interface JsonFieldState {
  value: string
  validation: JsonValidationResult
  isDirty: boolean
  isFormatted: boolean
}

export interface JsonFieldActions {
  setValue: (value: string) => void
  format: () => void
  minify: () => void
  reset: () => void
  validate: () => JsonValidationResult
}

export interface UseJsonFieldReturn {
  state: JsonFieldState
  actions: JsonFieldActions
}

// Funzione per estrarre informazioni dettagliate sull'errore JSON
function extractJsonError(error: SyntaxError): { line?: number; column?: number; message: string } {
  const message = error.message

  // Cerca pattern comuni per linea e colonna
  const lineMatch = message.match(/line (\d+)/i) || message.match(/at line (\d+)/i)
  const columnMatch = message.match(/column (\d+)/i) || message.match(/at column (\d+)/i)
  const positionMatch = message.match(/position (\d+)/i)

  let line: number | undefined
  let column: number | undefined

  if (lineMatch) {
    line = Number.parseInt(lineMatch[1], 10)
  }

  if (columnMatch) {
    column = Number.parseInt(columnMatch[1], 10)
  }

  // Se abbiamo solo la posizione, proviamo a calcolare linea e colonna
  if (positionMatch && !line && !column) {
    const position = Number.parseInt(positionMatch[1], 10)
    // Questo è approssimativo senza il testo originale
    line = Math.floor(position / 50) + 1 // Stima basata su 50 caratteri per linea
    column = position % 50
  }

  return {
    line,
    column,
    message: getUserFriendlyErrorMessage(message),
  }
}

// Funzione per ottenere linea e colonna da una posizione nel testo
function getLineAndColumn(text: string, position: number): { line: number; column: number } {
  const lines = text.substring(0, position).split("\n")
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

// Funzione per convertire errori tecnici in messaggi user-friendly
function getUserFriendlyErrorMessage(technicalMessage: string): string {
  const lowerMessage = technicalMessage.toLowerCase()

  if (lowerMessage.includes("unexpected token")) {
    if (lowerMessage.includes("'")) {
      return "Carattere inaspettato: controlla le virgolette e gli apici"
    }
    if (lowerMessage.includes(",")) {
      return "Virgola inaspettata: potrebbe esserci una virgola di troppo"
    }
    if (lowerMessage.includes("}")) {
      return "Parentesi graffa chiusa inaspettata: controlla la struttura dell'oggetto"
    }
    if (lowerMessage.includes("]")) {
      return "Parentesi quadra chiusa inaspettata: controlla la struttura dell'array"
    }
    return "Carattere non valido: controlla la sintassi JSON"
  }

  if (lowerMessage.includes("unexpected end")) {
    return "JSON incompleto: mancano caratteri alla fine"
  }

  if (lowerMessage.includes("expected")) {
    return "Elemento mancante: controlla che tutti gli elementi siano presenti"
  }

  if (lowerMessage.includes("duplicate")) {
    return "Chiave duplicata: ogni chiave deve essere unica nell'oggetto"
  }

  if (lowerMessage.includes("trailing comma")) {
    return "Virgola finale non permessa: rimuovi l'ultima virgola"
  }

  return technicalMessage
}

// Validatore JSON avanzato simile a Supabase
function validateJsonString(jsonString: string): JsonValidationResult {
  // Gestisci casi speciali
  if (!jsonString || jsonString.trim() === "") {
    return {
      isValid: true,
      type: "empty",
    }
  }

  const trimmed = jsonString.trim()

  // Controlla se è null esplicito
  if (trimmed === "null") {
    return {
      isValid: true,
      type: "null",
    }
  }

  try {
    const parsed = JSON.parse(trimmed)

    // Determina il tipo del JSON
    let type = "unknown"
    if (parsed === null) {
      type = "null"
    } else if (Array.isArray(parsed)) {
      type = "array"
    } else if (typeof parsed === "object") {
      type = "object"
    } else if (typeof parsed === "string") {
      type = "string"
    } else if (typeof parsed === "number") {
      type = "number"
    } else if (typeof parsed === "boolean") {
      type = "boolean"
    }

    return {
      isValid: true,
      type,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      const errorInfo = extractJsonError(error)

      return {
        isValid: false,
        error: errorInfo.message,
        line: errorInfo.line,
        column: errorInfo.column,
      }
    }

    return {
      isValid: false,
      error: "Errore sconosciuto nella validazione JSON",
    }
  }
}

export function useJsonField(initialValue: any = null): UseJsonFieldReturn {
  // Converti il valore iniziale in stringa JSON
  const initialJsonString = useMemo(() => {
    if (initialValue === null || initialValue === undefined) {
      return ""
    }

    if (typeof initialValue === "string") {
      // Se è già una stringa, verifica se è JSON valido
      try {
        JSON.parse(initialValue)
        return initialValue
      } catch {
        // Se non è JSON valido, trattalo come stringa normale
        return JSON.stringify(initialValue, null, 2)
      }
    }

    return JSON.stringify(initialValue, null, 2)
  }, [initialValue])

  const [state, setState] = useState<JsonFieldState>(() => ({
    value: initialJsonString,
    validation: validateJsonString(initialJsonString),
    isDirty: false,
    isFormatted: true,
  }))

  // Validatore JSON avanzato simile a Supabase
  const validateJson = useCallback((jsonString: string): JsonValidationResult => {
    return validateJsonString(jsonString)
  }, [])

  const setValue = useCallback(
    (newValue: string) => {
      const validation = validateJson(newValue)
      setState((prev) => ({
        ...prev,
        value: newValue,
        validation,
        isDirty: newValue !== initialJsonString,
        isFormatted: false,
      }))
    },
    [validateJson, initialJsonString],
  )

  const format = useCallback(() => {
    if (!state.validation.isValid) return

    try {
      const parsed = JSON.parse(state.value || "null")
      const formatted = JSON.stringify(parsed, null, 2)
      setState((prev) => ({
        ...prev,
        value: formatted,
        isFormatted: true,
      }))
    } catch (error) {
      // Se c'è un errore, non fare nulla
      console.warn("Impossibile formattare JSON:", error)
    }
  }, [state.value, state.validation.isValid])

  const minify = useCallback(() => {
    if (!state.validation.isValid) return

    try {
      const parsed = JSON.parse(state.value || "null")
      const minified = JSON.stringify(parsed)
      setState((prev) => ({
        ...prev,
        value: minified,
        isFormatted: false,
      }))
    } catch (error) {
      // Se c'è un errore, non fare nulla
      console.warn("Impossibile minificare JSON:", error)
    }
  }, [state.value, state.validation.isValid])

  const reset = useCallback(() => {
    setState({
      value: initialJsonString,
      validation: validateJson(initialJsonString),
      isDirty: false,
      isFormatted: true,
    })
  }, [initialJsonString, validateJson])

  const validate = useCallback(() => {
    return validateJson(state.value)
  }, [validateJson, state.value])

  const actions: JsonFieldActions = {
    setValue,
    format,
    minify,
    reset,
    validate,
  }

  return {
    state,
    actions,
  }
}
