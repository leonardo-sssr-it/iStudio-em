"use client"

import { useMemo } from "react"

export interface PriorityConfig {
  livello: number
  nome: string
  descrizione?: string
  colore?: string
}

export interface KanbanColumnConfig {
  id: string // String representation of 'livello' (e.g., "1", "2")
  title: string // Nome della priorità
  description?: string // Descrizione della priorità
  headerColor?: string // Colore per l'header della colonna
  level: number // Livello numerico originale
  isEmpty: boolean // Indica se la colonna è vuota (sarà aggiornato dinamicamente)
}

export function useJsonDecoder() {
  const decodePriorities = useMemo(() => {
    return (jsonString: string | null | undefined): PriorityConfig[] => {
      if (!jsonString) {
        console.warn("useJsonDecoder: JSON string is null or undefined")
        return []
      }

      try {
        // Handle case where jsonString might already be an object
        let parsed: any
        if (typeof jsonString === "string") {
          parsed = JSON.parse(jsonString)
        } else {
          parsed = jsonString
        }

        if (!Array.isArray(parsed)) {
          console.warn("useJsonDecoder: Parsed JSON is not an array:", parsed)
          return []
        }

        const validPriorities: PriorityConfig[] = parsed
          .map((item: any): PriorityConfig | null => {
            // Validate required fields
            if (typeof item.livello !== "number") {
              console.warn("useJsonDecoder: Invalid livello (not a number):", item)
              return null
            }

            if (typeof item.nome !== "string" || item.nome.trim() === "") {
              console.warn("useJsonDecoder: Invalid nome (not a string or empty):", item)
              return null
            }

            return {
              livello: item.livello,
              nome: item.nome.trim(),
              descrizione: typeof item.descrizione === "string" ? item.descrizione.trim() : undefined,
              colore: typeof item.colore === "string" ? item.colore.trim() : undefined,
            }
          })
          .filter((item): item is PriorityConfig => item !== null)
          .sort((a, b) => a.livello - b.livello) // Sort by level

        console.log("useJsonDecoder: Successfully decoded priorities:", validPriorities)
        return validPriorities
      } catch (error) {
        console.error("useJsonDecoder: Error parsing JSON:", error, "Raw string:", jsonString)
        return []
      }
    }
  }, [])

  const createKanbanColumns = useMemo(() => {
    return (priorities: PriorityConfig[]): KanbanColumnConfig[] => {
      const columns: KanbanColumnConfig[] = priorities.map((priority) => ({
        id: String(priority.livello),
        title: priority.nome,
        description: priority.descrizione,
        headerColor: priority.colore || `bg-gray-200 dark:bg-gray-700`,
        level: priority.livello,
        isEmpty: true, // Will be updated when items are loaded
      }))

      console.log("useJsonDecoder: Created Kanban columns config:", columns)
      return columns
    }
  }, [])

  const decodeGenericJson = useMemo(() => {
    return <T = any>(jsonString: string | null | undefined, fallback: T): T => {
      if (!jsonString) {
        return fallback
      }

      try {
        let parsed: any
        if (typeof jsonString === "string") {
          parsed = JSON.parse(jsonString)
        } else {
          parsed = jsonString
        }
        return parsed as T
      } catch (error) {
        console.error("useJsonDecoder: Error parsing generic JSON:", error, "Raw string:", jsonString)
        return fallback
      }
    }
  }, [])

  return {
    decodePriorities,
    createKanbanColumns,
    decodeGenericJson,
  }
}
