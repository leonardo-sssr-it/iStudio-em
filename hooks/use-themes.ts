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
  isDefault?: boolean // Flag per identificare il tema predefinito
}

// Tema predefinito basato sui valori di globals.css
const defaultTheme: Theme = {
  id: 0, // ID speciale per il tema predefinito
  nome_tema: "Tema Predefinito (Sistema)",
  carattere_tipo:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  carattere_dimensione: 14,
  carattere_colore: "hsl(222.2 84% 4.9%)", // --foreground
  palette: null,
  colore_nav: null,
  colore_main: null,
  tema: null,
  colore_header: "hsl(0 0% 100%)", // --background
  colore_footer: "hsl(210 40% 98%)", // --muted
  colore_titolo: "hsl(222.2 47.4% 11.2%)", // --primary
  colore_background: "hsl(0 0% 100%)", // --background
  colore_card: "hsl(0 0% 100%)", // --card
  colore_tabs: "hsl(210 40% 98%)", // --muted
  colore_div: "hsl(210 40% 98%)", // --muted
  attivo: true,
  border_radius: "0.5rem",
  css_variables: null,
  is_dark: false,
  isDefault: true,
}

export function useThemes() {
  const { supabase } = useSupabase()
  const [themes, setThemes] = useState<Theme[]>([defaultTheme]) // Inizializza con il tema predefinito
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme) // Imposta il tema predefinito come corrente
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchThemes = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        // Aggiungi una verifica per evitare chiamate inutili
        const cachedThemes = sessionStorage.getItem("cachedThemes")
        const lastFetch = sessionStorage.getItem("themesFetchTime")
        const now = Date.now()

        // Usa la cache se è stata aggiornata negli ultimi 5 minuti
        if (cachedThemes && lastFetch && now - Number.parseInt(lastFetch) < 300000) {
          const parsedThemes = JSON.parse(cachedThemes)
          setThemes([defaultTheme, ...parsedThemes])
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase.from("temi").select("*").order("id", { ascending: true })

        if (error) {
          throw new Error(`Errore nel recupero dei temi: ${error.message}`)
        }

        // Processiamo i temi da Supabase
        const supabaseThemes = data
          ? data.map((theme) => ({
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
              isDefault: false,
            }))
          : []

        // Salva nella cache
        sessionStorage.setItem("cachedThemes", JSON.stringify(supabaseThemes))
        sessionStorage.setItem("themesFetchTime", now.toString())

        // Combina il tema predefinito con i temi da Supabase
        const allThemes = [defaultTheme, ...supabaseThemes]
        setThemes(allThemes)

        // Se non c'è un tema corrente, mantieni il tema predefinito
        if (!currentTheme || currentTheme.id === 0) {
          setCurrentTheme(defaultTheme)
        }
      } catch (err) {
        console.error("Errore nel recupero dei temi:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
        // In caso di errore, mantieni solo il tema predefinito
        setThemes([defaultTheme])
        setCurrentTheme(defaultTheme)
      } finally {
        setIsLoading(false)
      }
    }

    fetchThemes()
  }, [supabase]) // Rimosso currentTheme dalle dipendenze per evitare loop

  const applyTheme = (themeId: number) => {
    const theme = themes.find((t) => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      return true
    }
    return false
  }

  const resetToDefault = () => {
    setCurrentTheme(defaultTheme)
    return true
  }

  return {
    themes,
    currentTheme,
    applyTheme,
    resetToDefault,
    isLoading,
    error,
  }
}
