"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"

export type Theme = "light" | "dark" | "system"
export type Layout = "standard" | "full-width" | "sidebar"
export type FontSize = "small" | "normal" | "large"

interface CustomTheme {
  id: string
  nome: string
  colore_primario: string
  colore_secondario: string
  colore_sfondo: string
  colore_testo: string
  colore_accento: string
}

interface ThemeContextType {
  // Theme management
  theme: Theme
  setTheme: (theme: Theme) => void

  // Layout management
  layout: Layout
  setLayout: (layout: Layout) => void

  // Font size management
  fontSize: FontSize
  setFontSize: (fontSize: FontSize) => void

  // Custom themes
  customThemes: CustomTheme[]
  currentCustomTheme: CustomTheme | null
  setCustomTheme: (theme: CustomTheme | null) => void

  // Loading state
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_THEME: CustomTheme = {
  id: "default",
  nome: "Default",
  colore_primario: "221.2 83.2% 53.3%",
  colore_secondario: "210 40% 96%",
  colore_sfondo: "0 0% 100%",
  colore_testo: "222.2 84% 4.9%",
  colore_accento: "210 40% 96%",
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [layout, setLayoutState] = useState<Layout>("sidebar")
  const [fontSize, setFontSizeState] = useState<FontSize>("normal")
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([DEFAULT_THEME])
  const [currentCustomTheme, setCurrentCustomTheme] = useState<CustomTheme | null>(DEFAULT_THEME)
  const [isLoading, setIsLoading] = useState(true)

  const { supabase } = useSupabase()

  // Load themes from database
  const loadCustomThemes = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase.from("temi").select("*").order("nome")

      if (error) {
        console.warn("Error loading themes:", error)
        return
      }

      if (data && data.length > 0) {
        const themes = data.map((theme) => ({
          id: theme.id.toString(),
          nome: theme.nome,
          colore_primario: theme.colore_primario || DEFAULT_THEME.colore_primario,
          colore_secondario: theme.colore_secondario || DEFAULT_THEME.colore_secondario,
          colore_sfondo: theme.colore_sfondo || DEFAULT_THEME.colore_sfondo,
          colore_testo: theme.colore_testo || DEFAULT_THEME.colore_testo,
          colore_accento: theme.colore_accento || DEFAULT_THEME.colore_accento,
        }))

        setCustomThemes([DEFAULT_THEME, ...themes])
      }
    } catch (error) {
      console.warn("Error loading themes:", error)
    }
  }, [supabase])

  // Load preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme
    const savedLayout = localStorage.getItem("layout") as Layout
    const savedFontSize = localStorage.getItem("fontSize") as FontSize
    const savedCustomTheme = localStorage.getItem("customTheme")

    if (savedTheme) setThemeState(savedTheme)
    if (savedLayout) setLayoutState(savedLayout)
    if (savedFontSize) setFontSizeState(savedFontSize)

    if (savedCustomTheme) {
      try {
        const parsed = JSON.parse(savedCustomTheme)
        setCurrentCustomTheme(parsed)
      } catch (error) {
        console.warn("Error parsing saved custom theme:", error)
      }
    }

    loadCustomThemes().finally(() => setIsLoading(false))
  }, [loadCustomThemes])

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove("light", "dark", "font-small", "font-normal", "font-large")

    // Apply theme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Apply font size
    root.classList.add(`font-${fontSize}`)

    // Apply custom theme colors
    if (currentCustomTheme) {
      root.style.setProperty("--primary", currentCustomTheme.colore_primario)
      root.style.setProperty("--secondary", currentCustomTheme.colore_secondario)
      root.style.setProperty("--background", currentCustomTheme.colore_sfondo)
      root.style.setProperty("--foreground", currentCustomTheme.colore_testo)
      root.style.setProperty("--accent", currentCustomTheme.colore_accento)
    }
  }, [theme, fontSize, currentCustomTheme])

  // Theme setters with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
  }, [])

  const setLayout = useCallback((newLayout: Layout) => {
    setLayoutState(newLayout)
    localStorage.setItem("layout", newLayout)
  }, [])

  const setFontSize = useCallback((newFontSize: FontSize) => {
    setFontSizeState(newFontSize)
    localStorage.setItem("fontSize", newFontSize)
  }, [])

  const setCustomTheme = useCallback((newCustomTheme: CustomTheme | null) => {
    setCurrentCustomTheme(newCustomTheme)
    if (newCustomTheme) {
      localStorage.setItem("customTheme", JSON.stringify(newCustomTheme))
    } else {
      localStorage.removeItem("customTheme")
    }
  }, [])

  const value: ThemeContextType = {
    theme,
    setTheme,
    layout,
    setLayout,
    fontSize,
    setFontSize,
    customThemes,
    currentCustomTheme,
    setCustomTheme,
    isLoading,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Safe version that doesn't throw
export function useSafeCustomTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      layout: "sidebar" as Layout,
      setLayout: () => {},
      fontSize: "normal" as FontSize,
      setFontSize: () => {},
      customThemes: [DEFAULT_THEME],
      currentCustomTheme: DEFAULT_THEME,
      setCustomTheme: () => {},
      isLoading: false,
    }
  }
  return context
}
