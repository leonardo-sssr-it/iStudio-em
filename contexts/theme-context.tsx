"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-provider"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: "light" | "dark"
  themesLoaded: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "ui-theme" }: ThemeProviderProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light")
  const [themesLoaded, setThemesLoaded] = useState(false)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Funzione per applicare il tema al DOM
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    let resolvedTheme: "light" | "dark"

    if (newTheme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      resolvedTheme = newTheme
    }

    root.classList.add(resolvedTheme)
    setActualTheme(resolvedTheme)

    console.log(`🎨 ThemeProvider: Applied theme: ${newTheme} (resolved: ${resolvedTheme})`)
  }

  // Funzione per caricare il tema salvato
  const loadSavedTheme = () => {
    try {
      if (typeof window === "undefined") return defaultTheme

      const saved = localStorage.getItem(storageKey) as Theme
      const validThemes: Theme[] = ["light", "dark", "system"]

      if (saved && validThemes.includes(saved)) {
        console.log(`🎨 ThemeProvider: Loaded saved theme: ${saved}`)
        return saved
      }

      console.log(`🎨 ThemeProvider: No valid saved theme, using default: ${defaultTheme}`)
      return defaultTheme
    } catch (error) {
      console.error("🎨 ThemeProvider: Error loading saved theme:", error)
      return defaultTheme
    }
  }

  // Funzione per salvare il tema
  const saveTheme = (newTheme: Theme) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newTheme)
        console.log(`🎨 ThemeProvider: Saved theme: ${newTheme}`)
      }
    } catch (error) {
      console.error("🎨 ThemeProvider: Error saving theme:", error)
    }
  }

  // Funzione pubblica per cambiare tema
  const setTheme = (newTheme: Theme) => {
    console.log(`🎨 ThemeProvider: Setting theme to: ${newTheme}`)
    setThemeState(newTheme)
    applyTheme(newTheme)
    saveTheme(newTheme)
  }

  // Effetto per caricare i temi solo dopo che l'autenticazione è completata
  useEffect(() => {
    console.log(
      `🎨 ThemeProvider: Auth state - loading: ${authLoading}, user: ${!!user}, themesLoaded: ${themesLoaded}`,
    )

    // Se i temi sono già stati caricati, non fare nulla
    if (themesLoaded) {
      console.log("🎨 ThemeProvider: Themes already loaded, skipping")
      return
    }

    // Se l'autenticazione è ancora in corso, aspetta
    if (authLoading) {
      console.log("🎨 ThemeProvider: Auth still loading, waiting...")
      return
    }

    // Pulisci eventuali timeout precedenti
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }

    // Carica i temi dopo che l'autenticazione è completata
    console.log("🎨 ThemeProvider: Auth completed, loading themes...")

    loadTimeoutRef.current = setTimeout(() => {
      try {
        const savedTheme = loadSavedTheme()
        setThemeState(savedTheme)
        applyTheme(savedTheme)
        setThemesLoaded(true)
        console.log("✅ ThemeProvider: Themes loaded successfully")
      } catch (error) {
        console.error("❌ ThemeProvider: Error during theme loading:", error)
        // Fallback al tema di default
        setThemeState(defaultTheme)
        applyTheme(defaultTheme)
        setThemesLoaded(true)
      }
    }, 100)

    // Timeout di sicurezza per evitare caricamenti infiniti
    const safetyTimeout = setTimeout(() => {
      if (!themesLoaded) {
        console.warn("⚠️ ThemeProvider: Safety timeout reached, forcing theme load")
        const savedTheme = loadSavedTheme()
        setThemeState(savedTheme)
        applyTheme(savedTheme)
        setThemesLoaded(true)
      }
    }, 10000) // 10 secondi

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
      clearTimeout(safetyTimeout)
    }
  }, [authLoading, user, themesLoaded, defaultTheme, storageKey])

  // Effetto per gestire i cambiamenti del sistema
  useEffect(() => {
    if (!themesLoaded) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, themesLoaded])

  const value = {
    theme,
    setTheme,
    actualTheme,
    themesLoaded,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
