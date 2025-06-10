"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"

export interface Theme {
  id: number
  nome_tema: string
  carattere_tipo: string
  carattere_dimensione: number
  carattere_colore: string
  palette: Record<string, any> | null
  colore_nav: string | null
  colore_main: string | null
  tema: Record<string, any> | null
  colore_header: string
  colore_footer: string
  colore_titolo: string
  colore_background: string
  colore_card: string
  colore_tabs: string
  colore_div: string
  modifica?: string
  attivo?: boolean
  border_radius: string | null
  css_variables: Record<string, string> | string | null
  is_dark: boolean | null
}

export function useThemes() {
  const { supabase } = useSupabase()
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchThemes = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("temi").select("*").order("id", { ascending: true })

        if (error) {
          throw new Error(`Errore nel recupero dei temi: ${error.message}`)
        }

        if (data && data.length > 0) {
          // Processiamo i temi per assicurarci che css_variables sia un oggetto
          const processedThemes = data.map((theme) => ({
            ...theme,
            carattere_colore: theme.carattere_colore || "#111827",
            colore_header: theme.colore_header || "#F7FAFC",
            colore_footer: theme.colore_footer || "#2D3748",
            colore_titolo: theme.colore_titolo || "#1A202C",
            colore_background: theme.colore_background || "#FFFFFF",
            colore_card: theme.colore_card || "#E2E8F0",
            carattere_tipo: theme.carattere_tipo || "Tahoma, sans-serif",
            border_radius: theme.border_radius || "0.5rem",
            css_variables:
              typeof theme.css_variables === "string" ? JSON.parse(theme.css_variables) : theme.css_variables || {},
          }))

          setThemes(processedThemes)

          // Impostiamo il primo tema come predefinito se non ce n'è uno corrente
          if (!currentTheme) {
            setCurrentTheme(processedThemes[0])
          }
        }
      } catch (err) {
        console.error("Errore nel recupero dei temi:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchThemes()
  }, [supabase, currentTheme])

  const applyTheme = (themeId: number) => {
    const theme = themes.find((t) => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      return true
    }
    return false
  }

  return {
    themes,
    currentTheme,
    applyTheme,
    isLoading,
    error,
  }
}
