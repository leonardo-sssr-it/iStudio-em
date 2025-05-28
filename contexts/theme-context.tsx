"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useTheme as useNextTheme } from "next-themes"
import { useThemes, type Theme } from "@/hooks/use-themes"

type LayoutType = "default" | "fullWidth" | "sidebar"

interface ThemeContextType {
  currentTheme: Theme | null
  themes: Theme[]
  applyTheme: (themeId: number) => boolean
  isLoading: boolean
  layout: LayoutType
  setLayout: (layout: LayoutType) => void
  toggleDarkMode: () => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Funzione di utilità per garantire un contrasto sufficiente
function ensureContrast(backgroundColor: string, textColor: string, fallbackTextColor: string): string {
  // Implementazione semplificata - in produzione usare una libreria come chroma.js
  // per calcolare il contrasto effettivo
  if (backgroundColor === textColor || !textColor) {
    return fallbackTextColor
  }
  return textColor
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themes, currentTheme, applyTheme, isLoading } = useThemes()
  const { theme, setTheme } = useNextTheme()
  const [layout, setLayout] = useState<LayoutType>(() => {
    // Recupera il layout salvato dal localStorage se disponibile
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem("preferredLayout")
      return (savedLayout as LayoutType) || "default"
    }
    return "default"
  })
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Salva il layout nel localStorage quando cambia
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLayout", layout)
    }
  }, [layout])

  // Sincronizziamo il tema di sistema con il nostro stato
  useEffect(() => {
    setIsDarkMode(theme === "dark")
  }, [theme])

  // Applichiamo le variabili CSS del tema corrente
  useEffect(() => {
    if (!currentTheme || typeof window === "undefined") return

    const root = document.documentElement
    const isDark = theme === "dark"

    // Applichiamo le variabili CSS personalizzate
    if (currentTheme.css_variables) {
      Object.entries(currentTheme.css_variables).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(`--${key}`, value)
        }
      })
    }

    // Colori di base
    const bgColor = isDark ? "#121212" : "#ffffff"
    const textColor = isDark ? "#ffffff" : "#121212"

    // Applichiamo i colori principali con controllo del contrasto
    root.style.setProperty("--background", isDark ? "0 0% 7%" : "0 0% 100%")
    root.style.setProperty("--foreground", isDark ? "0 0% 98%" : "0 0% 3.9%")

    // Applichiamo i colori del tema con controllo del contrasto
    root.style.setProperty("--primary", currentTheme.primary_color || (isDark ? "0 0% 98%" : "0 0% 9%"))
    root.style.setProperty("--secondary", currentTheme.secondary_color || (isDark ? "0 0% 14.9%" : "0 0% 96.1%"))
    root.style.setProperty("--accent", currentTheme.accent_color || (isDark ? "0 0% 14.9%" : "0 0% 96.1%"))

    // Applichiamo il font
    if (currentTheme.font_family) {
      document.body.style.fontFamily = currentTheme.font_family
    }

    // Applichiamo il border radius
    if (currentTheme.border_radius) {
      root.style.setProperty("--radius", currentTheme.border_radius)
    }

    // Assicuriamo che i colori di testo abbiano un buon contrasto
    root.style.setProperty("--card-foreground", isDark ? "0 0% 98%" : "0 0% 3.9%")
    root.style.setProperty("--popover-foreground", isDark ? "0 0% 98%" : "0 0% 3.9%")
    root.style.setProperty("--primary-foreground", isDark ? "0 0% 9%" : "0 0% 98%")
    root.style.setProperty("--secondary-foreground", isDark ? "0 0% 98%" : "0 0% 9%")
    root.style.setProperty("--muted-foreground", isDark ? "0 0% 63.9%" : "0 0% 45.1%")
    root.style.setProperty("--accent-foreground", isDark ? "0 0% 98%" : "0 0% 9%")
  }, [currentTheme, theme])

  const toggleDarkMode = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setIsDarkMode(newTheme === "dark")
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themes,
        applyTheme,
        isLoading,
        layout,
        setLayout,
        toggleDarkMode,
        isDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useCustomTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useCustomTheme must be used within a ThemeProvider")
  }
  return context
}
