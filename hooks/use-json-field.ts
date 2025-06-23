"use client"

import { useState, useCallback, useMemo } from "react"

export interface JsonValidationResult {
  isValid: boolean
  error?: string
  errorLine?: number
  errorColumn?: number
  formatted?: string
  parsed?: any
}

export interface JsonFieldState {
  value: string
  validation: JsonValidationResult
  isDirty: boolean
  isFormatted: boolean
}

// Funzione di validazione standalone (non hook)
function validateJsonString(jsonString: string): JsonValidationResult {
  // Valore vuoto è considerato valido (null)
  if (!jsonString || jsonString.trim() === "") {
    return {
      isValid: true,
      parsed: null,
      formatted: "",
    }
  }

  try {
    // Prova a parsare il JSON
    const parsed = JSON.parse(jsonString)

    // Genera la versione formattata
    const formatted = JSON.stringify(parsed, null, 2)

    return {
      isValid: true,
      parsed,
      formatted,
    }
  } catch (error) {
    // Estrae informazioni dettagliate sull'errore
    const errorInfo = extractJsonError(error as SyntaxError, jsonString)

    return {
      isValid: false,
      error: errorInfo.message,
      errorLine: errorInfo.line,
      errorColumn: errorInfo.column,
    }
  }
}

// Estrae informazioni dettagliate dall'errore JSON
function extractJsonError(error: SyntaxError, jsonString: string) {
  const message = error.message
  let line: number | undefined
  let column: number | undefined
  let friendlyMessage = message

  // Cerca pattern comuni negli errori JSON
  if (message.includes("position")) {
    const positionMatch = message.match(/position (\d+)/)
    if (positionMatch) {
      const position = Number.parseInt(positionMatch[1])
      const lineInfo = getLineAndColumn(jsonString, position)
      line = lineInfo.line
      column = lineInfo.column
    }
  }

  // Messaggi di errore più user-friendly
  if (message.includes("Unexpected token")) {
    const tokenMatch = message.match(/Unexpected token (.+?) in JSON/)
    if (tokenMatch) {
      const token = tokenMatch[1]
      friendlyMessage = `Carattere inaspettato: ${token}. Controlla virgole, parentesi e apici.`
    }
  } else if (message.includes("Unexpected end")) {
    friendlyMessage = "JSON incompleto. Controlla che tutte le parentesi e apici siano chiusi."
  } else if (message.includes("Expected property name")) {
    friendlyMessage = "Nome proprietà mancante. Le chiavi degli oggetti devono essere tra apici doppi."
  } else if (message.includes("Unexpected string")) {
    friendlyMessage = "Stringa inaspettata. Controlla virgole e struttura dell'oggetto."
  }

  return { message: friendlyMessage, line, column }
}

// Calcola linea e colonna da una posizione
function getLineAndColumn(text: string, position: number) {
  const lines = text.substring(0, position).split("\n")
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

export function useJsonField(initialValue: any = null) {
  // Converte il valore iniziale in stringa JSON formattata
  const initialJsonString = useMemo(() => {
    if (initialValue === null || initialValue === undefined) {
      return ""
    }
    try {
      return typeof initialValue === "string" ? initialValue : JSON.stringify(initialValue, null, 2)
    } catch {
      return ""
    }
  }, [initialValue])

  // Inizializza lo stato usando la funzione standalone
  const [state, setState] = useState<JsonFieldState>(() => ({
    value: initialJsonString,
    validation: validateJsonString(initialJsonString),
    isDirty: false,
    isFormatted: true,
  }))

  // Validatore JSON come callback (per consistency con l'API)
  const validateJson = useCallback((jsonString: string): JsonValidationResult => {
    return validateJsonString(jsonString)
  }, [])

  // Aggiorna il valore e valida
  const setValue = useCallback((newValue: string) => {
    const validation = validateJsonString(newValue)
    setState((prev) => ({
      ...prev,
      value: newValue,
      validation,
      isDirty: true,
      isFormatted: false,
    }))
  }, [])

  // Formatta il JSON automaticamente
  const formatJson = useCallback(() => {
    if (state.validation.isValid && state.validation.formatted) {
      setState((prev) => ({
        ...prev,
        value: state.validation.formatted!,
        isFormatted: true,
      }))
    }
  }, [state.validation])

  // Minifica il JSON
  const minifyJson = useCallback(() => {
    if (state.validation.isValid && state.validation.parsed !== undefined) {
      const minified = JSON.stringify(state.validation.parsed)
      setState((prev) => ({
        ...prev,
        value: minified,
        isFormatted: false,
      }))
    }
  }, [state.validation])

  // Reset al valore iniziale
  const reset = useCallback(() => {
    setState({
      value: initialJsonString,
      validation: validateJsonString(initialJsonString),
      isDirty: false,
      isFormatted: true,
    })
  }, [initialJsonString])

  // Valida un JSON specifico senza cambiare lo stato
  const validateOnly = useCallback((jsonString: string) => {
    return validateJsonString(jsonString)
  }, [])

  return {
    // Stato
    value: state.value,
    validation: state.validation,
    isDirty: state.isDirty,
    isFormatted: state.isFormatted,

    // Azioni
    setValue,
    formatJson,
    minifyJson,
    reset,
    validateOnly,

    // Computed values
    isValid: state.validation.isValid,
    error: state.validation.error,
    errorLine: state.validation.errorLine,
    errorColumn: state.validation.errorColumn,
    parsedValue: state.validation.parsed,
    canFormat: state.validation.isValid && !state.isFormatted,
    canMinify: state.validation.isValid && state.isFormatted,
  }
}
