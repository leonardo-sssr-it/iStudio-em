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
  carattere_tipo?: string
  carattere_dimensione?: number
  carattere_colore?: string
  colore_header?: string
  colore_footer?: string
  colore_background?: string
  colore_card?: string
  colore_tabs?: string
  colore_div?: string
  border_radius?: string
  css_variables?: Record<string, string> | string | null
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

// Tema predefinito
const defaultTheme: Theme = {
  id: 0,
  nome_tema: "Sistema",
  isDefault: true,
}

// Hook sicuro per usare il context
export function useSafeCustomTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    // Fallback sicuro se il context non è disponibile
    return {
      themes: [defaultTheme],
      currentTheme: defaultTheme,
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
  const [themes, setThemes] = useState<Theme[]>([defaultTheme])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme)
  const [layout, setLayoutState] = useState<"default" | "fullWidth" | "sidebar">("default")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSizeState] = useState<"small" | "normal" | "large">("normal")
  const [mounted, setMounted] = useState(false)

  // Funzione per convertire colori hex in HSL
  const hexToHsl = useCallback((hex: string): string => {
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
  }, [])

  // Applica gli stili del tema
  const applyThemeStyles = useCallback(
    (theme: Theme) => {
      if (typeof window === "undefined") return

      const root = document.documentElement

      console.log("=== APPLICANDO TEMA ===")
      console.log("Nome tema:", theme.nome_tema)
      console.log("Tema data:", theme)

      if (theme.isDefault) {
        // Resetta al tema predefinito
        console.log("Resettando al tema predefinito")
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
        ]

        customProperties.forEach((prop) => {
          root.style.removeProperty(prop)
        })

        // Resetta il font family
        document.body.style.fontFamily = ""

        // Resetta il border radius
        root.style.removeProperty("--radius")
      } else {
        // Applica i colori del tema personalizzato
        console.log("Applicando tema personalizzato")

        if (theme.colore_titolo) {
          const titleHsl = hexToHsl(theme.colore_titolo)
          root.style.setProperty("--primary", titleHsl)
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
      }

      // Forza il re-render aggiungendo una classe temporanea
      document.body.classList.add("theme-transition")
      setTimeout(() => {
        document.body.classList.remove("theme-transition")
      }, 300)

      console.log("=== TEMA APPLICATO CON SUCCESSO ===")
    },
    [hexToHsl],
  )

  // Carica le preferenze dal localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem("app-layout") as "default" | "fullWidth" | "sidebar" | null
      const savedDarkMode = localStorage.getItem("app-dark-mode")
      const savedFontSize = localStorage.getItem("app-font-size") as "small" | "normal" | "large" | null

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

        // Processa i temi da Supabase
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

        const allThemes = [defaultTheme, ...supabaseThemes]
        setThemes(allThemes)
        console.log("Themes loaded:", allThemes.length)

        // Applica il tema salvato o quello di default
        const savedThemeId = localStorage.getItem("app-theme")
        if (savedThemeId) {
          const savedTheme = allThemes.find((t) => t.id.toString() === savedThemeId)
          if (savedTheme) {
            setCurrentTheme(savedTheme)
            applyThemeStyles(savedTheme)
          }
        } else {
          // Applica il tema di default
          setCurrentTheme(defaultTheme)
          applyThemeStyles(defaultTheme)
        }
      } catch (error) {
        console.error("Error in loadThemes:", error)
      }
    }

    if (mounted) {
      loadThemes()
    }
  }, [supabase, isConnected, mounted, applyThemeStyles])

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
    console.log(`Font size changed to: ${size} (${sizes[size]})`)
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
    console.log(`Dark mode: ${dark}`)
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
        console.log("Applying theme:", theme.nome_tema)
        setCurrentTheme(theme)
        applyThemeStyles(theme)
        localStorage.setItem("app-theme", themeId.toString())
      }
    },
    [themes, applyThemeStyles],
  )

  const resetToDefault = useCallback(() => {
    console.log("Resetting to default theme")
    setCurrentTheme(defaultTheme)
    applyThemeStyles(defaultTheme)
    localStorage.setItem("app-theme", "0")
  }, [applyThemeStyles])

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
