"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useTheme as useNextTheme } from "next-themes"
import { useThemes, type Theme } from "@/hooks/use-themes"

type LayoutType = "default" | "fullWidth" | "sidebar"
type FontSizeType = "small" | "normal" | "large"

interface ThemeContextType {
  currentTheme: Theme | null
  themes: Theme[]
  applyTheme: (themeId: number) => boolean
  resetToDefault: () => boolean
  isLoading: boolean
  layout: LayoutType
  setLayout: (layout: LayoutType) => void
  toggleDarkMode: () => void
  isDarkMode: boolean
  fontSize: FontSizeType
  setFontSize: (size: FontSizeType) => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Funzione per convertire colori hex in HSL
function hexToHsl(hex: string): string {
  if (!hex || hex === "") return "0 0% 50%"

  // Se il colore è già in formato HSL, restituiscilo così com'è
  if (hex.includes("hsl") || hex.includes("%")) return hex.replace("hsl(", "").replace(")", "")

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

// Funzione per applicare la dimensione del carattere
function applyFontSize(size: FontSizeType) {
  if (typeof window === "undefined") return

  const root = document.documentElement

  switch (size) {
    case "small":
      root.style.setProperty("--font-size-base", "0.875rem") // 14px
      root.style.setProperty("--font-size-sm", "0.75rem") // 12px
      root.style.setProperty("--font-size-lg", "1rem") // 16px
      root.style.setProperty("--font-size-xl", "1.125rem") // 18px
      break
    case "large":
      root.style.setProperty("--font-size-base", "1.125rem") // 18px
      root.style.setProperty("--font-size-sm", "1rem") // 16px
      root.style.setProperty("--font-size-lg", "1.25rem") // 20px
      root.style.setProperty("--font-size-xl", "1.375rem") // 22px
      break
    default: // normal
      root.style.setProperty("--font-size-base", "1rem") // 16px
      root.style.setProperty("--font-size-sm", "0.875rem") // 14px
      root.style.setProperty("--font-size-lg", "1.125rem") // 18px
      root.style.setProperty("--font-size-xl", "1.25rem") // 20px
      break
  }

  // Applica la classe al body per l'effetto immediato
  document.body.className = document.body.className.replace(/font-size-\w+/g, "")
  document.body.classList.add(`font-size-${size}`)
}

// Funzione per resettare al tema predefinito
function resetToDefaultTheme() {
  if (typeof window === "undefined") return

  const root = document.documentElement

  try {
    // Rimuovi tutte le variabili CSS personalizzate
    const customProperties = [
      "--primary",
      "--secondary",
      "--accent",
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--header",
      "--footer",
      "--div",
      "--admin-tab-active-bg",
      "--admin-checkbox-checked",
    ]

    customProperties.forEach((prop) => {
      root.style.removeProperty(prop)
    })

    // Resetta il font family al valore predefinito
    document.body.style.fontFamily = ""

    // Resetta il border radius
    root.style.removeProperty("--radius")

    console.log("✓ Tema predefinito ripristinato")
  } catch (error) {
    console.error("Errore nel reset del tema:", error)
  }
}

// Funzione per applicare un tema personalizzato
function applyCustomTheme(theme: Theme, isDark: boolean) {
  if (typeof window === "undefined") return

  // Se è il tema predefinito, resetta tutto
  if (theme.isDefault) {
    resetToDefaultTheme()
    return
  }

  const root = document.documentElement

  try {
    // Applica i colori principali
    if (theme.colore_titolo) {
      const titleHsl = hexToHsl(theme.colore_titolo)
      root.style.setProperty("--primary", titleHsl)
      root.style.setProperty("--admin-tab-active-bg", titleHsl)
      root.style.setProperty("--admin-checkbox-checked", titleHsl)
      console.log(`✓ Primary color applicato: ${titleHsl}`)
    }

    if (theme.colore_card) {
      const cardHsl = hexToHsl(theme.colore_card)
      root.style.setProperty("--secondary", cardHsl)
      console.log(`✓ Secondary color applicato: ${cardHsl}`)
    }

    if (theme.colore_tabs) {
      const tabsHsl = hexToHsl(theme.colore_tabs)
      root.style.setProperty("--accent", tabsHsl)
      console.log(`✓ Accent color applicato: ${tabsHsl}`)
    }

    // Applica background e foreground
    if (theme.colore_background) {
      const bgHsl = hexToHsl(theme.colore_background)
      root.style.setProperty("--background", bgHsl)
      root.style.setProperty("--card", bgHsl)
      root.style.setProperty("--popover", bgHsl)
      console.log(`✓ Background color applicato: ${bgHsl}`)
    }

    if (theme.carattere_colore) {
      const textHsl = hexToHsl(theme.carattere_colore)
      root.style.setProperty("--foreground", textHsl)
      root.style.setProperty("--card-foreground", textHsl)
      root.style.setProperty("--popover-foreground", textHsl)
      console.log(`✓ Text color applicato: ${textHsl}`)
    }

    // Applica colori specifici
    if (theme.colore_header) {
      const headerHsl = hexToHsl(theme.colore_header)
      root.style.setProperty("--header", headerHsl)
      console.log(`✓ Header color applicato: ${headerHsl}`)
    }

    if (theme.colore_footer) {
      const footerHsl = hexToHsl(theme.colore_footer)
      root.style.setProperty("--footer", footerHsl)
      console.log(`✓ Footer color applicato: ${footerHsl}`)
    }

    if (theme.colore_div) {
      const divHsl = hexToHsl(theme.colore_div)
      root.style.setProperty("--div", divHsl)
      console.log(`✓ Div color applicato: ${divHsl}`)
    }

    // Applica le variabili CSS personalizzate se presenti
    if (theme.css_variables) {
      let cssVars: Record<string, string> = {}

      if (typeof theme.css_variables === "string") {
        try {
          cssVars = JSON.parse(theme.css_variables)
        } catch (e) {
          console.error("Errore nel parsing delle CSS variables:", e)
        }
      } else if (typeof theme.css_variables === "object") {
        cssVars = theme.css_variables
      }

      Object.entries(cssVars).forEach(([key, value]) => {
        if (value && typeof value === "string") {
          root.style.setProperty(`--${key}`, value)
          console.log(`✓ Variabile CSS personalizzata applicata: --${key} = ${value}`)
        }
      })
    }

    // Applica il font family
    if (theme.carattere_tipo) {
      document.body.style.fontFamily = theme.carattere_tipo
      console.log(`✓ Font family applicato: ${theme.carattere_tipo}`)
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
  resetToDefault: () => false,
  isLoading: true,
  layout: "default",
  setLayout: () => {},
  toggleDarkMode: () => {},
  isDarkMode: false,
  fontSize: "normal",
  setFontSize: () => {},
  mounted: false,
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themes, currentTheme, applyTheme, resetToDefault, isLoading } = useThemes()
  const { theme, setTheme, systemTheme } = useNextTheme()
  const [layout, setLayout] = useState<LayoutType>(() => {
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem("preferredLayout")
      return (savedLayout as LayoutType) || "default"
    }
    return "default"
  })
  const [fontSize, setFontSizeState] = useState<FontSizeType>(() => {
    if (typeof window !== "undefined") {
      const savedFontSize = localStorage.getItem("preferredFontSize")
      return (savedFontSize as FontSizeType) || "normal"
    }
    return "normal"
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

  // Salva la dimensione del carattere nel localStorage quando cambia
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredFontSize", fontSize)
      applyFontSize(fontSize)
    }
  }, [fontSize])

  // Sincronizziamo il tema di sistema con il nostro stato
  useEffect(() => {
    if (mounted) {
      const resolvedTheme = theme === "system" ? systemTheme : theme
      setIsDarkMode(resolvedTheme === "dark")
    }
  }, [theme, systemTheme, mounted])

  // Applichiamo il tema personalizzato quando cambia
  useEffect(() => {
    if (mounted && currentTheme && typeof window !== "undefined") {
      const resolvedTheme = theme === "system" ? systemTheme : theme

      // Aggiungi una verifica per evitare reset inutili del tema predefinito
      const lastAppliedTheme = window.localStorage.getItem("lastAppliedThemeId")
      const currentThemeId = currentTheme.id.toString()

      if (lastAppliedTheme !== currentThemeId) {
        applyCustomTheme(currentTheme, resolvedTheme === "dark")
        window.localStorage.setItem("lastAppliedThemeId", currentThemeId)
      }
    }
  }, [currentTheme, theme, systemTheme, mounted])

  // Applica la dimensione del carattere al mount
  useEffect(() => {
    if (mounted) {
      applyFontSize(fontSize)
    }
  }, [mounted, fontSize])

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

  // Funzione per cambiare la dimensione del carattere
  const setFontSize = useCallback((size: FontSizeType) => {
    setFontSizeState(size)
  }, [])

  // Creiamo il valore del contesto con useMemo per evitare render inutili
  const contextValue = useMemo(
    () => ({
      currentTheme,
      themes,
      applyTheme,
      resetToDefault,
      isLoading,
      layout,
      setLayout,
      toggleDarkMode,
      isDarkMode,
      fontSize,
      setFontSize,
      mounted,
    }),
    [
      currentTheme,
      themes,
      applyTheme,
      resetToDefault,
      isLoading,
      layout,
      toggleDarkMode,
      isDarkMode,
      fontSize,
      setFontSize,
      mounted,
    ],
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
