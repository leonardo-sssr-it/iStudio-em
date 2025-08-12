"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"

interface Theme {
  id: number
  nome: string
  descrizione: string | null
  css_vars: Record<string, string>
  is_default: boolean
  created_at: string
}

interface ThemeContextType {
  themes: Theme[]
  currentTheme: string
  setCurrentTheme: (themeName: string) => void
  mounted: boolean
  themesLoaded: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Stato globale persistente per i temi
const globalThemeState = {
  themes: [] as Theme[],
  currentTheme: "Sistema",
  themesLoaded: false,
  themesCache: new Map<string, Theme[]>(),
  lastThemeLoad: 0,
}

// Cache in localStorage per i temi
const THEME_CACHE_KEY = "istudio_themes_cache"
const CURRENT_THEME_KEY = "istudio_current_theme"

const saveThemeCache = (themes: Theme[]) => {
  try {
    const cache = {
      themes,
      timestamp: Date.now(),
    }
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn("Impossibile salvare cache temi:", error)
  }
}

const loadThemeCache = (): Theme[] | null => {
  try {
    const cache = localStorage.getItem(THEME_CACHE_KEY)
    if (!cache) return null

    const parsed = JSON.parse(cache)
    const age = Date.now() - parsed.timestamp

    // Cache valida per 1 ora
    if (age > 3600000) {
      localStorage.removeItem(THEME_CACHE_KEY)
      return null
    }

    return parsed.themes
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
    return "Sistema"
  }
}

let renderCount = 0

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  renderCount++

  const { supabase, isConnected: supabaseConnected } = useSupabase()
  const { isLoading: authLoading } = useAuth()

  // Inizializza lo stato dal globalState o dalla cache
  const [state, setState] = useState(() => {
    // Se abbiamo già temi caricati globalmente, usali
    if (globalThemeState.themesLoaded && globalThemeState.themes.length > 0) {
      return {
        themes: globalThemeState.themes,
        currentTheme: globalThemeState.currentTheme,
        mounted: false,
        themesLoaded: true,
      }
    }

    // Altrimenti prova a caricare dalla cache
    const cachedThemes = loadThemeCache()
    const savedTheme = loadCurrentTheme()

    if (cachedThemes && cachedThemes.length > 0) {
      globalThemeState.themes = cachedThemes
      globalThemeState.currentTheme = savedTheme
      globalThemeState.themesLoaded = true

      return {
        themes: cachedThemes,
        currentTheme: savedTheme,
        mounted: false,
        themesLoaded: true,
      }
    }

    return {
      themes: globalThemeState.themes,
      currentTheme: globalThemeState.currentTheme,
      mounted: false,
      themesLoaded: globalThemeState.themesLoaded,
    }
  })

  const loadingRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Funzione per aggiornare sia lo stato locale che globale
  const updateThemeState = useCallback((newState: Partial<typeof state>) => {
    Object.assign(globalThemeState, newState)
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...newState }))
    }
  }, [])

  // Log ridotto (ogni 5 render)
  if (renderCount % 5 === 0) {
    console.log(
      `${new Date().toISOString()} ThemeProvider: Render`,
      JSON.stringify({
        themesCount: state.themes.length,
        currentTheme: state.currentTheme,
        mounted: state.mounted,
        themesLoaded: state.themesLoaded,
        authLoading,
        supabaseConnected,
        renderCount,
      }),
    )
  }

  const loadThemes = useCallback(async () => {
    if (!supabase || !supabaseConnected || loadingRef.current) {
      return
    }

    // Se abbiamo già i temi caricati, non ricaricare
    if (globalThemeState.themesLoaded && globalThemeState.themes.length > 0) {
      return
    }

    const now = Date.now()
    const cacheKey = "themes_load"

    // Cache del caricamento temi per 5 minuti
    if (globalThemeState.themesCache.has(cacheKey) && now - globalThemeState.lastThemeLoad < 300000) {
      const cachedThemes = globalThemeState.themesCache.get(cacheKey)!
      updateThemeState({
        themes: cachedThemes,
        themesLoaded: true,
      })
      return
    }

    loadingRef.current = true
    console.log(`${new Date().toISOString()} ThemeProvider: Caricamento temi dal database...`)

    try {
      const { data: themes, error } = await supabase.from("temi").select("*").order("nome")

      if (error) {
        console.error(`${new Date().toISOString()} ThemeProvider: Errore caricamento temi:`, error)
        return
      }

      const themesData = themes || []

      // Salva in cache
      globalThemeState.themesCache.set(cacheKey, themesData)
      globalThemeState.lastThemeLoad = now
      saveThemeCache(themesData)

      updateThemeState({
        themes: themesData,
        themesLoaded: true,
      })

      console.log(`${new Date().toISOString()} ThemeProvider: Temi caricati con successo: ${themesData.length}`)
    } catch (error) {
      console.error(`${new Date().toISOString()} ThemeProvider: Errore caricamento temi:`, error)
    } finally {
      loadingRef.current = false
    }
  }, [supabase, supabaseConnected, updateThemeState])

  const applyTheme = useCallback(
    (themeName: string) => {
      const theme = state.themes.find((t) => t.nome === themeName)

      if (!theme) {
        console.warn(`${new Date().toISOString()} ThemeProvider: Tema non trovato: ${themeName}`)
        return
      }

      console.log(`${new Date().toISOString()} ThemeProvider: Applicando tema: ${themeName}`)

      try {
        const root = document.documentElement

        // Applica le variabili CSS
        Object.entries(theme.css_vars).forEach(([key, value]) => {
          root.style.setProperty(key, value)
        })

        updateThemeState({ currentTheme: themeName })
        saveCurrentTheme(themeName)

        console.log(`${new Date().toISOString()} ThemeProvider: Tema applicato con successo`)
      } catch (error) {
        console.error(`${new Date().toISOString()} ThemeProvider: Errore applicazione tema:`, error)
      }
    },
    [state.themes, updateThemeState],
  )

  const setCurrentTheme = useCallback(
    (themeName: string) => {
      applyTheme(themeName)
    },
    [applyTheme],
  )

  useEffect(() => {
    updateThemeState({ mounted: true })

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [updateThemeState])

  useEffect(() => {
    if (!authLoading && supabaseConnected && !state.themesLoaded) {
      // Timeout di sicurezza per prevenire caricamenti infiniti
      timeoutRef.current = setTimeout(() => {
        loadThemes()
      }, 100)
    }
  }, [authLoading, supabaseConnected, state.themesLoaded, loadThemes])

  useEffect(() => {
    if (state.themesLoaded && state.themes.length > 0 && state.mounted) {
      applyTheme(state.currentTheme)
    }
  }, [state.themesLoaded, state.themes.length, state.mounted, state.currentTheme, applyTheme])

  const contextValue: ThemeContextType = {
    themes: state.themes,
    currentTheme: state.currentTheme,
    setCurrentTheme,
    mounted: state.mounted,
    themesLoaded: state.themesLoaded,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
