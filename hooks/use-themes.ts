"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"

export interface Theme {
  id: number
  nome: string
  primary_color: string
  secondary_color: string
  accent_color: string
  text_color: string
  background_color: string
  is_dark: boolean
  font_family: string
  border_radius: string
  css_variables: Record<string, string>
  created_at?: string
  updated_at?: string
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
            primary_color: theme.primary_color || "#000000",
            secondary_color: theme.secondary_color || "#ffffff",
            accent_color: theme.accent_color || "#0066cc",
            text_color: theme.text_color || "#000000",
            background_color: theme.background_color || "#ffffff",
            font_family: theme.font_family || "system-ui, -apple-system, sans-serif",
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
