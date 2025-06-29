"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"

// Tipi per i temi
interface Theme {
  id: number
  nome_tema: string
  colore_titolo?: string
  colore_sfondo?: string
  colore_testo?: string
  colore_accento?: string
  isDefault?: boolean
}

// Tipi per il context
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

// Hook sicuro per usare il context
export function useSafeCustomTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    // Fallback sicuro se il context non è disponibile
    return {
      themes: [],
      currentTheme: null,
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected } = useSupabase()
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)
  const [layout, setLayoutState] = useState<"default" | "fullWidth" | "sidebar">("default")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSizeState] = useState<"small" | "normal" | "large">("normal")
  const [mounted, setMounted] = useState(false)

  // Carica le preferenze dal localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem("app-layout") as "default" | "fullWidth" | "sidebar" | null
      const savedDarkMode = localStorage.getItem("app-dark-mode")
      const savedFontSize = localStorage.getItem("app-font-size") as "small" | "normal" | "large" | null
      const savedTheme = localStorage.getItem("app-theme")

      if (savedLayout) setLayoutState(savedLayout)
      if (savedDarkMode) setIsDarkMode(savedDarkMode === "true")
      if (savedFontSize) setFontSizeState(savedFontSize)

      setMounted(true)
    }
  }, [])

  // Carica i temi dal database
  useEffect(() => {
    const loadThemes = async () => {
      if (!supabase || !isConnected) return

      try {
        console.log("Loading themes from database...")
        const { data, error } = await supabase.from("temi").select("*").order("nome_tema")

        if (error) {
          console.error("Error loading themes:", error)
          return
        }

        const themesWithDefault: Theme[] = [
          {
            id: 0,
            nome_tema: "Sistema",
            isDefault: true,
          },
          ...(data || []),
        ]

        setThemes(themesWithDefault)
        console.log("Themes loaded:", themesWithDefault.length)

        // Applica il tema salvato o quello di default
        const savedThemeId = localStorage.getItem("app-theme")
        if (savedThemeId) {
          const savedTheme = themesWithDefault.find((t) => t.id.toString() === savedThemeId)
          if (savedTheme) {
            setCurrentTheme(savedTheme)
            applyThemeStyles(savedTheme)
          }
        } else {
          // Applica il tema di default
          const defaultTheme = themesWithDefault[0]
          setCurrentTheme(defaultTheme)
          applyThemeStyles(defaultTheme)
        }
      } catch (error) {
        console.error("Error in loadThemes:", error)
      }
    }

    loadThemes()
  }, [supabase, isConnected])

  // Applica gli stili del tema
  const applyThemeStyles = useCallback((theme: Theme) => {
    if (typeof window === "undefined") return

    const root = document.documentElement

    if (theme.isDefault) {
      // Rimuovi le variabili custom per usare quelle di default
      root.style.removeProperty("--color-primary")
      root.style.removeProperty("--color-background")
      root.style.removeProperty("--color-foreground")
      root.style.removeProperty("--color-accent")
    } else {
      // Applica i colori del tema
      if (theme.colore_titolo) {
        const color = theme.colore_titolo.startsWith("#")
          ? theme.colore_titolo
          : theme.colore_titolo.includes("%")
            ? `hsl(${theme.colore_titolo})`
            : theme.colore_titolo
        root.style.setProperty("--color-primary", color)
      }

      if (theme.colore_sfondo) {
        const color = theme.colore_sfondo.startsWith("#")
          ? theme.colore_sfondo
          : theme.colore_sfondo.includes("%")
            ? `hsl(${theme.colore_sfondo})`
            : theme.colore_sfondo
        root.style.setProperty("--color-background", color)
      }

      if (theme.colore_testo) {
        const color = theme.colore_testo.startsWith("#")
          ? theme.colore_testo
          : theme.colore_testo.includes("%")
            ? `hsl(${theme.colore_testo})`
            : theme.colore_testo
        root.style.setProperty("--color-foreground", color)
      }

      if (theme.colore_accento) {
        const color = theme.colore_accento.startsWith("#")
          ? theme.colore_accento
          : theme.colore_accento.includes("%")
            ? `hsl(${theme.colore_accento})`
            : theme.colore_accento
        root.style.setProperty("--color-accent", color)
      }
    }
  }, [])

  // Applica le dimensioni del font
  const applyFontSize = useCallback((size: "small" | "normal" | "large") => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    const sizes = {
      small: "14px",
      normal: "16px",
      large: "18px",
    }

    root.style.setProperty("--font-size-base", sizes[size])
    root.classList.remove("font-small", "font-normal", "font-large")
    root.classList.add(`font-${size}`)
  }, [])

  // Applica il dark mode
  const applyDarkMode = useCallback((dark: boolean) => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    if (dark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [])

  // Effetti per applicare le impostazioni quando cambiano
  useEffect(() => {
    if (mounted) {
      applyFontSize(fontSize)
    }
  }, [fontSize, mounted, applyFontSize])

  useEffect(() => {
    if (mounted) {
      applyDarkMode(isDarkMode)
    }
  }, [isDarkMode, mounted, applyDarkMode])

  // Funzioni per cambiare le impostazioni
  const applyTheme = useCallback(
    (themeId: number) => {
      const theme = themes.find((t) => t.id === themeId)
      if (theme) {
        setCurrentTheme(theme)
        applyThemeStyles(theme)
        localStorage.setItem("app-theme", themeId.toString())
        console.log("Theme applied:", theme.nome_tema)
      }
    },
    [themes, applyThemeStyles],
  )

  const resetToDefault = useCallback(() => {
    const defaultTheme = themes.find((t) => t.isDefault)
    if (defaultTheme) {
      applyTheme(defaultTheme.id)
    }
  }, [themes, applyTheme])

  const setLayout = useCallback((newLayout: "default" | "fullWidth" | "sidebar") => {
    setLayoutState(newLayout)
    localStorage.setItem("app-layout", newLayout)
    console.log("Layout changed to:", newLayout)
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("app-dark-mode", newDarkMode.toString())
    console.log("Dark mode toggled:", newDarkMode)
  }, [isDarkMode])

  const setFontSize = useCallback((size: "small" | "normal" | "large") => {
    setFontSizeState(size)
    localStorage.setItem("app-font-size", size)
    console.log("Font size changed to:", size)
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
