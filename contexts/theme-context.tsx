"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useSupabaseClient } from "@/lib/supabase-provider"

interface Theme {
  id: number
  nome_tema: string
  colore_primario?: string
  colore_secondario?: string
  colore_titolo?: string
  colore_testo?: string
  colore_sfondo?: string
  colore_bordi?: string
  isDefault?: boolean
}

interface ThemeContextType {
  themes: Theme[]
  currentTheme: Theme | null
  applyTheme: (themeId: number) => void
  resetToDefault: () => void
  layout: "default" | "fullWidth" | "sidebar"
  setLayout: (layout: "default" | "fullWidth" | "sidebar") => void
  toggleDarkMode: () => void
  isDarkMode: boolean
  fontSize: "small" | "normal" | "large"
  setFontSize: (size: "small" | "normal" | "large") => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_THEME: Theme = {
  id: 0,
  nome_tema: "Sistema",
  colore_primario: "221.2 83.2% 53.3%",
  colore_secondario: "210 40% 96%",
  colore_titolo: "222.2 84% 4.9%",
  colore_testo: "222.2 84% 4.9%",
  colore_sfondo: "0 0% 100%",
  colore_bordi: "214.3 31.8% 91.4%",
  isDefault: true,
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<Theme[]>([DEFAULT_THEME])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(DEFAULT_THEME)
  const [layout, setLayoutState] = useState<"default" | "fullWidth" | "sidebar">("default")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSizeState] = useState<"small" | "normal" | "large">("normal")
  const [mounted, setMounted] = useState(false)
  const supabase = useSupabaseClient()

  // Load preferences from localStorage
  useEffect(() => {
    setMounted(true)

    // Load layout preference
    const savedLayout = localStorage.getItem("app-layout")
    if (savedLayout && ["default", "fullWidth", "sidebar"].includes(savedLayout)) {
      setLayoutState(savedLayout as "default" | "fullWidth" | "sidebar")
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("app-dark-mode")
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === "true")
    } else {
      // Check system preference
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }

    // Load font size preference
    const savedFontSize = localStorage.getItem("app-font-size")
    if (savedFontSize && ["small", "normal", "large"].includes(savedFontSize)) {
      setFontSizeState(savedFontSize as "small" | "normal" | "large")
    }

    // Load theme preference
    const savedThemeId = localStorage.getItem("app-theme-id")
    if (savedThemeId) {
      const themeId = Number.parseInt(savedThemeId)
      if (themeId === 0) {
        setCurrentTheme(DEFAULT_THEME)
      }
    }
  }, [])

  // Load themes from database
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const { data, error } = await supabase.from("temi").select("*").order("nome_tema")

        if (error) {
          console.error("Error loading themes:", error)
          return
        }

        const dbThemes =
          data?.map((theme) => ({
            id: theme.id,
            nome_tema: theme.nome_tema,
            colore_primario: theme.colore_primario,
            colore_secondario: theme.colore_secondario,
            colore_titolo: theme.colore_titolo,
            colore_testo: theme.colore_testo,
            colore_sfondo: theme.colore_sfondo,
            colore_bordi: theme.colore_bordi,
            isDefault: false,
          })) || []

        setThemes([DEFAULT_THEME, ...dbThemes])
      } catch (error) {
        console.error("Error loading themes:", error)
      }
    }

    if (mounted) {
      loadThemes()
    }
  }, [supabase, mounted])

  // Apply theme to CSS variables
  const applyThemeToCSS = useCallback((theme: Theme) => {
    const root = document.documentElement

    if (theme.colore_primario) {
      root.style.setProperty("--primary", theme.colore_primario)
    }
    if (theme.colore_secondario) {
      root.style.setProperty("--secondary", theme.colore_secondario)
    }
    if (theme.colore_titolo) {
      root.style.setProperty("--foreground", theme.colore_titolo)
    }
    if (theme.colore_testo) {
      root.style.setProperty("--muted-foreground", theme.colore_testo)
    }
    if (theme.colore_sfondo) {
      root.style.setProperty("--background", theme.colore_sfondo)
    }
    if (theme.colore_bordi) {
      root.style.setProperty("--border", theme.colore_bordi)
    }
  }, [])

  // Apply dark mode
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", isDarkMode)
      localStorage.setItem("app-dark-mode", isDarkMode.toString())
    }
  }, [isDarkMode, mounted])

  // Apply layout
  useEffect(() => {
    if (mounted) {
      document.body.className = document.body.className.replace(/layout-\w+/g, "")
      document.body.classList.add(`layout-${layout}`)
      localStorage.setItem("app-layout", layout)
    }
  }, [layout, mounted])

  // Apply font size
  useEffect(() => {
    if (mounted) {
      document.body.className = document.body.className.replace(/font-size-\w+/g, "")
      document.body.classList.add(`font-size-${fontSize}`)
      localStorage.setItem("app-font-size", fontSize)
    }
  }, [fontSize, mounted])

  // Apply current theme
  useEffect(() => {
    if (mounted && currentTheme) {
      applyThemeToCSS(currentTheme)
      localStorage.setItem("app-theme-id", currentTheme.id.toString())
    }
  }, [currentTheme, mounted, applyThemeToCSS])

  const applyTheme = useCallback(
    (themeId: number) => {
      const theme = themes.find((t) => t.id === themeId)
      if (theme) {
        setCurrentTheme(theme)
      }
    },
    [themes],
  )

  const resetToDefault = useCallback(() => {
    setCurrentTheme(DEFAULT_THEME)
  }, [])

  const setLayout = useCallback((newLayout: "default" | "fullWidth" | "sidebar") => {
    setLayoutState(newLayout)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev)
  }, [])

  const setFontSize = useCallback((size: "small" | "normal" | "large") => {
    setFontSizeState(size)
  }, [])

  const value: ThemeContextType = {
    themes,
    currentTheme,
    applyTheme,
    resetToDefault,
    layout,
    setLayout,
    toggleDarkMode,
    isDarkMode,
    fontSize,
    setFontSize,
    mounted,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useSafeCustomTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return safe defaults if context is not available
    return {
      themes: [DEFAULT_THEME],
      currentTheme: DEFAULT_THEME,
      applyTheme: () => {},
      resetToDefault: () => {},
      layout: "default",
      setLayout: () => {},
      toggleDarkMode: () => {},
      isDarkMode: false,
      fontSize: "normal",
      setFontSize: () => {},
      mounted: false,
    }
  }
  return context
}
