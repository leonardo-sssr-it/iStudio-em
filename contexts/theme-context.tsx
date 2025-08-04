"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"

interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    muted: string
    accent: string
    destructive: string
    border: string
    input: string
    ring: string
  }
}

interface ThemeContextType {
  currentTheme: Theme
  themes: Theme[]
  setTheme: (themeId: string) => void
  isLoading: boolean
  error: string | null
  themesLoaded: boolean
}

const defaultTheme: Theme = {
  id: "default",
  name: "Default",
  colors: {
    primary: "hsl(222.2 84% 4.9%)",
    secondary: "hsl(210 40% 96%)",
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    muted: "hsl(210 40% 96%)",
    accent: "hsl(210 40% 96%)",
    destructive: "hsl(0 84.2% 60.2%)",
    border: "hsl(214.3 31.8% 91.4%)",
    input: "hsl(214.3 31.8% 91.4%)",
    ring: "hsl(222.2 84% 4.9%)",
  },
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Hook sicuro che fornisce valori di fallback
export function useSafeCustomTheme(): ThemeContextType {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    console.warn("🎨 ThemeProvider: Context not available, using fallback values")
    return {
      currentTheme: defaultTheme,
      themes: [defaultTheme],
      setTheme: () => {},
      isLoading: false,
      error: null,
      themesLoaded: false,
    }
  }

  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const { supabase, isConnected } = useSupabase()

  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme)
  const [themes, setThemes] = useState<Theme[]>([defaultTheme])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [themesLoaded, setThemesLoaded] = useState(false)

  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasAttemptedLoadRef = useRef(false)

  // Funzione per caricare i temi dal database
  const loadThemes = async () => {
    if (!supabase || !isConnected || hasAttemptedLoadRef.current) {
      console.log("🎨 ThemeProvider: Skipping theme load - conditions not met")
      return
    }

    hasAttemptedLoadRef.current = true
    setIsLoading(true)
    setError(null)

    console.log("🎨 ThemeProvider: Loading themes from database...")

    try {
      // Carica i temi dalla configurazione
      const { data: configData, error: configError } = await supabase
        .from("configurazione")
        .select("*")
        .limit(1)
        .single()

      if (configError && configError.code !== "PGRST116") {
        throw configError
      }

      const loadedThemes = [defaultTheme]

      if (configData) {
        console.log("🎨 ThemeProvider: Configuration found, processing themes...")

        // Se ci sono temi personalizzati nella configurazione, usali
        if (configData.tema_default) {
          // Qui potresti caricare temi personalizzati dal database
          // Per ora usiamo il tema di default
          console.log("🎨 ThemeProvider: Using default theme from config:", configData.tema_default)
        }
      }

      setThemes(loadedThemes)
      setCurrentTheme(loadedThemes[0])
      setThemesLoaded(true)

      console.log("✅ ThemeProvider: Themes loaded successfully")
    } catch (err) {
      console.error("❌ ThemeProvider: Error loading themes:", err)
      setError(err instanceof Error ? err.message : "Failed to load themes")

      // Usa il tema di default in caso di errore
      setThemes([defaultTheme])
      setCurrentTheme(defaultTheme)
      setThemesLoaded(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per cambiare tema
  const setTheme = (themeId: string) => {
    console.log("🎨 ThemeProvider: Changing theme to:", themeId)

    const theme = themes.find((t) => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)

      // Applica il tema al documento
      const root = document.documentElement
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })

      console.log("✅ ThemeProvider: Theme applied successfully")
    } else {
      console.warn("⚠️ ThemeProvider: Theme not found:", themeId)
    }
  }

  // Effetto per caricare i temi quando le condizioni sono soddisfatte
  useEffect(() => {
    console.log("🎨 ThemeProvider: Checking conditions for theme loading...")
    console.log("🎨 ThemeProvider: Auth loading:", authLoading)
    console.log("🎨 ThemeProvider: User:", !!user)
    console.log("🎨 ThemeProvider: Supabase connected:", isConnected)
    console.log("🎨 ThemeProvider: Themes loaded:", themesLoaded)

    // Carica i temi solo se:
    // 1. L'autenticazione è completata (non in loading)
    // 2. Supabase è connesso
    // 3. I temi non sono già stati caricati
    const shouldLoadThemes = !authLoading && isConnected && !themesLoaded

    if (shouldLoadThemes) {
      console.log("🎨 ThemeProvider: Conditions met, loading themes...")

      // Timeout di sicurezza per evitare caricamenti infiniti
      loadTimeoutRef.current = setTimeout(() => {
        if (!themesLoaded) {
          console.warn("⚠️ ThemeProvider: Theme loading timeout, using default theme")
          setThemes([defaultTheme])
          setCurrentTheme(defaultTheme)
          setThemesLoaded(true)
          setIsLoading(false)
        }
      }, 10000) // 10 secondi

      loadThemes()
    } else {
      console.log("🎨 ThemeProvider: Conditions not met for theme loading")
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [authLoading, isConnected, themesLoaded, supabase])

  // Applica il tema corrente al documento
  useEffect(() => {
    const root = document.documentElement
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
  }, [currentTheme])

  const value = {
    currentTheme,
    themes,
    setTheme,
    isLoading,
    error,
    themesLoaded,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
