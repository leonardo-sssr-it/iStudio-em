"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
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
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Funzione per convertire colori hex in HSL
function hexToHsl(hex: string): string {
  if (!hex || hex === "") return "0 0% 50%"

  // Rimuovi il # se presente
  hex = hex.replace("#", "")

  // Se il colore è già in formato HSL, restituiscilo così com'è
  if (hex.includes("%")) return hex

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
  console.log("Nome tema:", theme.nome_tema || theme.nome)
  console.log("Dark mode:", isDark)

  try {
    // Prima applica i colori base del tema se specificati
    if (theme.primary_color) {
      const primaryHsl = hexToHsl(theme.primary_color)
      root.style.setProperty("--primary", primaryHsl)
      root.style.setProperty("--admin-tab-active-bg", primaryHsl)
      root.style.setProperty("--admin-checkbox-checked", primaryHsl)
      console.log(`✓ Primary color applicato: ${primaryHsl}`)
    }

    if (theme.secondary_color) {
      const secondaryHsl = hexToHsl(theme.secondary_color)
      root.style.setProperty("--secondary", secondaryHsl)
      console.log(`✓ Secondary color applicato: ${secondaryHsl}`)
    }

    if (theme.accent_color) {
      const accentHsl = hexToHsl(theme.accent_color)
      root.style.setProperty("--accent", accentHsl)
      console.log(`✓ Accent color applicato: ${accentHsl}`)
    }

    // Applica background e foreground con logica corretta per il contrasto
    if (theme.background_color) {
      const bgHsl = hexToHsl(theme.background_color)
      root.style.setProperty("--background", bgHsl)
      root.style.setProperty("--card", bgHsl)
      root.style.setProperty("--popover", bgHsl)
      console.log(`✓ Background color applicato: ${bgHsl}`)
    }

    if (theme.text_color) {
      const textHsl = hexToHsl(theme.text_color)
      root.style.setProperty("--foreground", textHsl)
      root.style.setProperty("--card-foreground", textHsl)
      root.style.setProperty("--popover-foreground", textHsl)
      console.log(`✓ Text color applicato: ${textHsl}`)
    }

    // Applica le variabili CSS personalizzate se presenti (queste hanno priorità)
    if (theme.css_variables && typeof theme.css_variables === "object") {
      Object.entries(theme.css_variables).forEach(([key, value]) => {
        if (value && typeof value === "string") {
          root.style.setProperty(`--${key}`, value)
          console.log(`✓ Variabile CSS personalizzata applicata: --${key} = ${value}`)
        }
      })
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

    // Forza il re-render aggiungendo una classe temporanea
    document.body.classList.add("theme-transition")
    setTimeout(() => {
      document.body.classList.remove("theme-transition")
    }, 300)

    console.log("=== TEMA APPLICATO CON SUCCESSO ===")
  } catch (error) {
    console.error("Errore nell'applicazione del tema:", error)
  }
}

// Valore di default per il contesto
const defaultThemeContext: ThemeContextType = {
  currentTheme: null,
  themes: [],
  applyTheme: () => false,
  isLoading: true,
  layout: "default",
  setLayout: () => {},
  toggleDarkMode: () => {},
  isDarkMode: false,
  mounted: false,
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themes, currentTheme, applyTheme, isLoading } = useThemes()
  const { theme, setTheme, systemTheme } = useNextTheme()
  const [layout, setLayout] = useState<LayoutType>(() => {
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem("preferredLayout")
      return (savedLayout as LayoutType) || "default"
    }
    return "default"
  })
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Aspetta che il componente sia montato
  useEffect(() => {
    setMounted(true)
  }, [])

  // Salva il layout nel localStorage quando cambia
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLayout", layout)
    }
  }, [layout])

  // Sincronizziamo il tema di sistema con il nostro stato
  useEffect(() => {
    if (mounted) {
      const resolvedTheme = theme === "system" ? systemTheme : theme
      setIsDarkMode(resolvedTheme === "dark")
      console.log("Tema risolto:", resolvedTheme, "isDark:", resolvedTheme === "dark")
    }
  }, [theme, systemTheme, mounted])

  // Applichiamo il tema personalizzato quando cambia
  useEffect(() => {
    if (mounted && currentTheme && typeof window !== "undefined") {
      const resolvedTheme = theme === "system" ? systemTheme : theme
      console.log(
        "Applicando tema personalizzato:",
        currentTheme.nome_tema || currentTheme.nome,
        "isDark:",
        resolvedTheme === "dark",
      )
      applyCustomTheme(currentTheme, resolvedTheme === "dark")
    }
  }, [currentTheme, theme, systemTheme, mounted])

  // Funzione per cambiare il tema chiaro/scuro
  const toggleDarkMode = useCallback(() => {
    if (!mounted) return

    console.log("=== TOGGLE DARK MODE ===")
    console.log("Tema attuale:", theme)
    console.log("isDarkMode attuale:", isDarkMode)

    const newTheme = isDarkMode ? "light" : "dark"
    console.log("Nuovo tema:", newTheme)

    setTheme(newTheme)
    console.log("=== FINE TOGGLE DARK MODE ===")
  }, [theme, setTheme, isDarkMode, mounted])

  // Creiamo il valore del contesto con useMemo per evitare render inutili
  const contextValue = useMemo(
    () => ({
      currentTheme,
      themes,
      applyTheme,
      isLoading,
      layout,
      setLayout,
      toggleDarkMode,
      isDarkMode,
      mounted,
    }),
    [currentTheme, themes, applyTheme, isLoading, layout, toggleDarkMode, isDarkMode, mounted],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useCustomTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useCustomTheme must be used within a ThemeProvider")
  }
  return context
}

// Hook sicuro che non genera errori se il provider non è disponibile
export function useSafeCustomTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    return defaultThemeContext
  }

  return context
}
