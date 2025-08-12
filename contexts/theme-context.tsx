"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"

interface Theme {
  id: number
  nome: string
  descrizione?: string
  css_variables: Record<string, string>
  attivo: boolean
  created_at?: string
  updated_at?: string
}

interface ThemeContextType {
  themes: Theme[]
  currentTheme: string
  setCurrentTheme: (themeName: string) => void
  isLoading: boolean
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  themes: [],
  currentTheme: "Sistema",
  setCurrentTheme: () => {},
  isLoading: true,
  mounted: false,
})

// Stato globale persistente per i temi
const globalThemeState = {
  themes: [] as Theme[],
  currentTheme: "Sistema",
  isLoading: true,
  mounted: false,
  themesLoaded: false,
  lastThemeLoad: 0,
  themeCache: new Map<string, { themes: Theme[]; timestamp: number }>(),
}

// Cache localStorage per i temi
const THEME_CACHE_KEY = "istudio_themes_cache"
const CURRENT_THEME_KEY = "istudio_current_theme"
const CACHE_DURATION = 300000 // 5 minuti

const saveThemesToCache = (themes: Theme[]) => {
  try {
    const cacheData = {
      themes,
      timestamp: Date.now(),
    }
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.warn("Impossibile salvare cache temi:", error)
  }
}

const loadThemesFromCache = (): Theme[] | null => {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY)
    if (!cached) return null

    const cacheData = JSON.parse(cached)
    const age = Date.now() - cacheData.timestamp

    if (age > CACHE_DURATION) {
      localStorage.removeItem(THEME_CACHE_KEY)
      return null
    }

    return cacheData.themes
  } catch (error) {
    console.warn("Impossibile caricare cache temi:", error)
    return null
  }
}

const saveCurrentTheme = (themeName: string) => {
  try {
    localStorage.setItem(CURRENT_THEME_KEY, themeName)
  } catch (error) {
    console.warn("Impossibile salvare tema corrente:", error)
  }
}

const loadCurrentTheme = (): string => {
  try {
    return localStorage.getItem(CURRENT_THEME_KEY) || "Sistema"
  } catch (error) {
    console.warn("Impossibile caricare tema corrente:", error)
    return "Sistema"
  }
}

let renderCount = 0

export function ThemeProvider({ children }: { children: ReactNode }) {
  renderCount++

  const { supabase, isConnected: supabaseConnected, isInitializing: supabaseInitializing } = useSupabase()
  const { isLoading: authLoading } = useAuth()

  const [state, setState] = useState(() => {
    if (globalThemeState.themesLoaded && globalThemeState.themes.length > 0) {
      return {
        themes: globalThemeState.themes,
        currentTheme: globalThemeState.currentTheme,
        isLoading: false,
        mounted: globalThemeState.mounted,
      }
    }

    const cachedThemes = loadThemesFromCache()
    const savedTheme = loadCurrentTheme()

    if (cachedThemes && cachedThemes.length > 0) {
      globalThemeState.themes = cachedThemes
      globalThemeState.currentTheme = savedTheme
      globalThemeState.themesLoaded = true
      globalThemeState.isLoading = false

      return {
        themes: cachedThemes,
        currentTheme: savedTheme,
        isLoading: false,
        mounted: false,
      }
    }

    return {
      themes: globalThemeState.themes,
      currentTheme: globalThemeState.currentTheme,
      isLoading: globalThemeState.isLoading,
      mounted: globalThemeState.mounted,
    }
  })

  const loadingRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const updateThemeState = (newState: Partial<typeof state>) => {
    Object.assign(globalThemeState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }

    if (newState.themes && newState.themes.length > 0) {
      saveThemesToCache(newState.themes)
    }

    if (newState.currentTheme) {
      saveCurrentTheme(newState.currentTheme)
    }
  }

  if (renderCount % 5 === 0) {
    console.log(
      `${new Date().toISOString()} ThemeProvider: Render`,
      JSON.stringify({
        themesCount: state.themes.length,
        currentTheme: state.currentTheme,
        mounted: state.mounted,
        themesLoaded: globalThemeState.themesLoaded,
        authLoading,
        supabaseConnected,
        renderCount,
      }),
    )
  }

  const loadThemes = async () => {
    if (loadingRef.current || !supabase || !supabaseConnected) {
      return
    }

    const now = Date.now()
    if (globalThemeState.themesLoaded && now - globalThemeState.lastThemeLoad < 60000) {
      return
    }

    loadingRef.current = true

    try {
      console.log(`${new Date().toISOString()} ThemeProvider: Caricamento temi dal database...`)

      const { data: themes, error } = await supabase.from("temi").select("*").eq("attivo", true).order("nome")

      if (error) {
        console.error(`${new Date().toISOString()} ThemeProvider: Errore caricamento temi:`, error)
        return
      }

      const themesData = themes || []

      updateThemeState({
        themes: themesData,
        isLoading: false,
      })

      globalThemeState.themesLoaded = true
      globalThemeState.lastThemeLoad = now

      console.log(`${new Date().toISOString()} ThemeProvider: Temi caricati con successo: ${themesData.length}`)

      applyTheme(globalThemeState.currentTheme, themesData)
    } catch (error) {
      console.error(`${new Date().toISOString()} ThemeProvider: Errore caricamento temi:`, error)
      updateThemeState({
        isLoading: false,
      })
    } finally {
      loadingRef.current = false
    }
  }

  const applyTheme = (themeName: string, themesData?: Theme[]) => {
    const themes = themesData || state.themes

    try {
      console.log(`${new Date().toISOString()} ThemeProvider: Applicando tema: ${themeName}`)

      if (themeName === "Sistema") {
        const root = document.documentElement
        const computedStyle = getComputedStyle(root)
        const customProps = Array.from(document.styleSheets)
          .flatMap((sheet) => {
            try {
              return Array.from(sheet.cssRules)
            } catch {
              return []
            }
          })
          .filter((rule) => rule instanceof CSSStyleRule)
          .flatMap((rule) => Array.from((rule as CSSStyleRule).style))
          .filter((prop) => prop.startsWith("--"))

        customProps.forEach((prop) => {
          root.style.removeProperty(prop)
        })

        console.log(`${new Date().toISOString()} ThemeProvider: Tema sistema applicato`)
        return
      }

      const theme = themes.find((t) => t.nome === themeName)
      if (!theme) {
        console.warn(`${new Date().toISOString()} ThemeProvider: Tema non trovato: ${themeName}`)
        return
      }

      const root = document.documentElement
      Object.entries(theme.css_variables).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })

      console.log(`${new Date().toISOString()} ThemeProvider: Tema applicato con successo`)
    } catch (error) {
      console.error(`${new Date().toISOString()} ThemeProvider: Errore applicazione tema:`, error)
    }
  }

  const setCurrentTheme = (themeName: string) => {
    updateThemeState({ currentTheme: themeName })
    applyTheme(themeName)
  }

  useEffect(() => {
    updateThemeState({ mounted: true })

    if (!supabaseInitializing && supabaseConnected && !authLoading && !globalThemeState.themesLoaded) {
      timeoutRef.current = setTimeout(() => {
        loadThemes()
      }, 300)
    }

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [supabaseInitializing, supabaseConnected, authLoading])

  const contextValue: ThemeContextType = {
    themes: state.themes,
    currentTheme: state.currentTheme,
    setCurrentTheme,
    isLoading: state.isLoading,
    mounted: state.mounted,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function useSafeCustomTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    console.warn("useSafeCustomTheme: ThemeProvider non disponibile, usando valori di default")
    return {
      themes: [],
      currentTheme: "Sistema",
      setCurrentTheme: () => {},
      isLoading: false,
      mounted: false,
    }
  }
  return context
}
