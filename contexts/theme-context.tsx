"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"

type Theme =
  | "light"
  | "dark"
  | "system"
  | {
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

type ThemeContextType = {
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
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultTheme: Theme = "system"

const ThemeProviderContext = createContext({
  theme: defaultTheme,
  setTheme: (theme: Theme) => null,
  themesLoaded: false,
})

export function useSafeCustomTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
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
      isLoading: false,
    }
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected, isInitializing: supabaseInitializing } = useSupabase()
  const { user, isLoading: authLoading } = useAuth()

  const [themes, setThemes] = useState<Theme[]>(["system"])
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(defaultTheme)
  const [layout, setLayoutState] = useState<"default" | "fullWidth" | "sidebar">("default")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSizeState] = useState<"small" | "normal" | "large">("normal")
  const [mounted, setMounted] = useState(false)
  const [themesLoaded, setThemesLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadingAttempted = useRef(false)
  const themeLoadTimeout = useRef<NodeJS.Timeout | null>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const hexToHsl = useCallback((hex: string): string => {
    if (!hex || hex === "") return "0 0% 50%"

    if (hex.includes("hsl") || hex.includes("%")) return hex.replace("hsl(", "").replace(")", "")

    hex = hex.replace("#", "")

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("")
    }

    if (hex.length !== 6) {
      console.warn(`Invalid hex color: ${hex}`)
      return "0 0% 50%"
    }

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

  const applyThemeStyles = useCallback((theme: Theme) => {
    if (typeof window === "undefined") return

    const root = document.documentElement

    console.log("ThemeProvider: === APPLICANDO TEMA ===")
    console.log("ThemeProvider: Nome tema:", theme)

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      console.log("ThemeProvider: Applied system theme:", systemTheme)
    } else {
      root.classList.add(theme)
      console.log("ThemeProvider: Applied theme:", theme)
    }

    document.body.classList.add("theme-transition")
    setTimeout(() => {
      document.body.classList.remove("theme-transition")
    }, 300)

    console.log("ThemeProvider: === TEMA APPLICATO CON SUCCESSO ===")
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("ThemeProvider: Loading preferences from localStorage")

      const savedLayout = localStorage.getItem("app-layout") as "default" | "fullWidth" | "sidebar" | null
      const savedDarkMode = localStorage.getItem("app-dark-mode")
      const savedFontSize = localStorage.getItem("app-font-size") as "small" | "normal" | "large" | null

      if (savedLayout) {
        setLayoutState(savedLayout)
        console.log(`ThemeProvider: Loaded layout preference: ${savedLayout}`)
      }
      if (savedDarkMode) {
        setIsDarkMode(savedDarkMode === "true")
        console.log(`ThemeProvider: Loaded dark mode preference: ${savedDarkMode}`)
      }
      if (savedFontSize) {
        setFontSizeState(savedFontSize)
        console.log(`ThemeProvider: Loaded font size preference: ${savedFontSize}`)
      }

      setMounted(true)
      console.log("ThemeProvider: Component mounted and preferences loaded")
    }
  }, [])

  useEffect(() => {
    const loadThemes = async () => {
      const shouldLoadThemes =
        mounted &&
        !supabaseInitializing &&
        supabase &&
        isConnected &&
        !authLoading &&
        !themesLoaded &&
        !loadingAttempted.current

      console.log("ThemeProvider: Evaluating theme loading conditions:", {
        mounted,
        supabaseInitializing,
        hasSupabase: !!supabase,
        isConnected,
        authLoading,
        themesLoaded,
        loadingAttempted: loadingAttempted.current,
        shouldLoadThemes,
      })

      if (!shouldLoadThemes) {
        return
      }

      loadingAttempted.current = true
      setIsLoading(true)

      themeLoadTimeout.current = setTimeout(() => {
        console.warn("ThemeProvider: Theme loading timeout, applying default theme")
        setIsLoading(false)
        setThemesLoaded(true)
        applyThemeStyles(defaultTheme)
      }, 10000)

      try {
        console.log("ThemeProvider: Starting theme loading from database...")

        const { data, error } = await supabase.from("temi").select("*").order("nome_tema")

        if (themeLoadTimeout.current) {
          clearTimeout(themeLoadTimeout.current)
          themeLoadTimeout.current = null
        }

        if (error) {
          console.error("ThemeProvider: Error loading themes:", error)
          setThemesLoaded(true)
          setIsLoading(false)
          return
        }

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
                typeof theme.css_variables === "string"
                  ? (() => {
                      try {
                        return JSON.parse(theme.css_variables)
                      } catch {
                        return {}
                      }
                    })()
                  : theme.css_variables || {},
              isDefault: false,
            }))
          : []

        const allThemes = ["system", ...supabaseThemes]
        setThemes(allThemes)
        setThemesLoaded(true)
        console.log(`ThemeProvider: Successfully loaded ${allThemes.length} themes`)

        const savedThemeId = localStorage.getItem("app-theme")
        if (savedThemeId) {
          const savedTheme = allThemes.find((t) => t === savedThemeId)
          if (savedTheme) {
            console.log(`ThemeProvider: Applying saved theme: ${savedTheme}`)
            setCurrentTheme(savedTheme)
            applyThemeStyles(savedTheme)
          } else {
            console.log("ThemeProvider: Saved theme not found, applying default")
            setCurrentTheme(defaultTheme)
            applyThemeStyles(defaultTheme)
          }
        } else {
          console.log("ThemeProvider: No saved theme, applying default")
          setCurrentTheme(defaultTheme)
          applyThemeStyles(defaultTheme)
        }
      } catch (error) {
        console.error("ThemeProvider: Error in loadThemes:", error)
        setThemesLoaded(true)

        if (themeLoadTimeout.current) {
          clearTimeout(themeLoadTimeout.current)
          themeLoadTimeout.current = null
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadThemes()

    return () => {
      if (themeLoadTimeout.current) {
        clearTimeout(themeLoadTimeout.current)
        themeLoadTimeout.current = null
      }
    }
  }, [mounted, supabaseInitializing, supabase, isConnected, authLoading, themesLoaded, applyThemeStyles])

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
    console.log(`ThemeProvider: Font size changed to: ${size} (${sizes[size]})`)
  }, [])

  const applyDarkMode = useCallback((dark: boolean) => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    if (dark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    console.log(`ThemeProvider: Dark mode: ${dark}`)
  }, [])

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

  const applyTheme = useCallback(
    (themeId: number) => {
      const theme = themes.find((t) => t === themeId)
      if (theme) {
        console.log("ThemeProvider: Applying theme:", theme)
        setCurrentTheme(theme)
        applyThemeStyles(theme)
        localStorage.setItem("app-theme", themeId.toString())
      } else {
        console.warn(`ThemeProvider: Theme with ID ${themeId} not found`)
      }
    },
    [themes, applyThemeStyles],
  )

  const resetToDefault = useCallback(() => {
    console.log("ThemeProvider: Resetting to default theme")
    setCurrentTheme(defaultTheme)
    applyThemeStyles(defaultTheme)
    localStorage.setItem("app-theme", "system")
  }, [applyThemeStyles])

  const setLayout = useCallback((newLayout: "default" | "fullWidth" | "sidebar") => {
    setLayoutState(newLayout)
    localStorage.setItem("app-layout", newLayout)
    console.log("ThemeProvider: Layout changed to:", newLayout)
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("app-dark-mode", newDarkMode.toString())
    console.log("ThemeProvider: Dark mode toggled:", newDarkMode)
  }, [isDarkMode])

  const setFontSize = useCallback((size: "small" | "normal" | "large") => {
    setFontSizeState(size)
    localStorage.setItem("app-font-size", size)
    console.log("ThemeProvider: Font size changed to:", size)
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
    isLoading,
  }

  const themeProviderValue = {
    theme: currentTheme as Theme,
    setTheme: (theme: Theme) => {
      console.log("🎨 ThemeProvider: Setting theme:", theme)
      localStorage.setItem("vite-ui-theme", theme)
      setCurrentTheme(theme)
    },
    themesLoaded,
  }

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProviderContext.Provider value={themeProviderValue}>{children}</ThemeProviderContext.Provider>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
