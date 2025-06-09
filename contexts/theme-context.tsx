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

// Funzione per convertire colori hex in HSL
function hexToHsl(hex: string): string {
  // Rimuovi il # se presente
  hex = hex.replace("#", "")

  // Converti hex in RGB
  const r = Number.parseInt(hex.substr(0, 2), 16) / 255
  const g = Number.parseInt(hex.substr(2, 2), 16) / 255
  const b = Number.parseInt(hex.substr(4, 2), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

// Funzione per applicare un tema personalizzato
function applyCustomTheme(theme: Theme, isDark: boolean) {
  if (typeof window === "undefined") return

  const root = document.documentElement

  console.log("=== APPLICANDO TEMA ===")
  console.log("Nome tema:", theme.nome)
  console.log("Dark mode:", isDark)
  console.log("Dati tema:", theme)

  try {
    // Applica le variabili CSS personalizzate se presenti
    if (theme.css_variables && typeof theme.css_variables === "object") {
      Object.entries(theme.css_variables).forEach(([key, value]) => {
        if (value && typeof value === "string") {
          root.style.setProperty(`--${key}`, value)
          console.log(`✓ Variabile CSS applicata: --${key} = ${value}`)
        }
      })
    }

    // Applica i colori principali del tema
    if (theme.primary_color) {
      const primaryHsl = theme.primary_color.startsWith("#") ? hexToHsl(theme.primary_color) : theme.primary_color
      root.style.setProperty("--primary", primaryHsl)
      root.style.setProperty("--admin-tab-active-bg", primaryHsl)
      root.style.setProperty("--admin-checkbox-checked", primaryHsl)
      console.log(`✓ Primary color applicato: ${primaryHsl}`)
    }

    if (theme.secondary_color) {
      const secondaryHsl = theme.secondary_color.startsWith("#")
        ? hexToHsl(theme.secondary_color)
        : theme.secondary_color
      root.style.setProperty("--secondary", secondaryHsl)
      console.log(`✓ Secondary color applicato: ${secondaryHsl}`)
    }

    if (theme.accent_color) {
      const accentHsl = theme.accent_color.startsWith("#") ? hexToHsl(theme.accent_color) : theme.accent_color
      root.style.setProperty("--accent", accentHsl)
      console.log(`✓ Accent color applicato: ${accentHsl}`)
    }

    // Applica il background e foreground se specificati
    if (theme.background_color) {
      const bgHsl = theme.background_color.startsWith("#") ? hexToHsl(theme.background_color) : theme.background_color
      root.style.setProperty("--background", bgHsl)
      console.log(`✓ Background color applicato: ${bgHsl}`)
    }

    if (theme.text_color) {
      const textHsl = theme.text_color.startsWith("#") ? hexToHsl(theme.text_color) : theme.text_color
      root.style.setProperty("--foreground", textHsl)
      console.log(`✓ Text color applicato: ${textHsl}`)
    }

    // Applica il font family
    if (theme.font_family) {
      document.body.style.fontFamily = theme.font_family
      console.log(`✓ Font family applicato: ${theme.font_family}`)
    }

    // Applica il border radius
    if (theme.border_radius) {
      root.style.setProperty("--radius", theme.border_radius)
      console.log(`✓ Border radius applicato: ${theme.border_radius}`)
    }

    console.log("=== TEMA APPLICATO CON SUCCESSO ===")
  } catch (error) {
    console.error("Errore nell'applicazione del tema:", error)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themes, currentTheme, applyTheme, isLoading } = useThemes()
  const { theme, setTheme } = useNextTheme()
  const [layout, setLayout] = useState<LayoutType>(() => {
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

  // Applichiamo il tema personalizzato quando cambia
  useEffect(() => {
    if (currentTheme && typeof window !== "undefined") {
      console.log("Applicando tema:", currentTheme.nome, "isDark:", theme === "dark")
      applyCustomTheme(currentTheme, theme === "dark")
    }
  }, [currentTheme, theme])

  const toggleDarkMode = useCallback(() => {
    console.log("=== TOGGLE DARK MODE ===")
    console.log("Tema attuale:", theme)
    console.log("isDarkMode attuale:", isDarkMode)

    const newTheme = theme === "dark" ? "light" : "dark"
    console.log("Nuovo tema:", newTheme)

    setTheme(newTheme)
    setIsDarkMode(newTheme === "dark")

    console.log("=== FINE TOGGLE DARK MODE ===")
  }, [theme, setTheme, isDarkMode])

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
