"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"

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
  attivo?: boolean
  created_at?: string
  updated_at?: string
}

interface ThemeContextType {
  themes: Theme[]
  currentTheme: string
  setCurrentTheme: (themeName: string) => void
  applyTheme: (theme: Theme) => void
  mounted: boolean
  themesLoaded: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Stato globale per prevenire reset durante unmount/remount
let globalThemeState = {
  themes: [] as Theme[],
  currentTheme: "Sistema",
  mounted: false,
  themesLoaded: false,
  lastThemeLoad: 0,
  themeCache: new Map<string, Theme[]>(),
}

const THEME_CACHE_DURATION = 10 * 60 * 1000 // 10 minuti
const THEME_STORAGE_KEY = "istudio_current_theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConnected } = useSupabase()
  const { user, isLoading: authLoading } = useAuth()
  const [themes, setThemes] = useState<Theme[]>(globalThemeState.themes)
  const [currentTheme, setCurrentThemeState] = useState<string>(globalThemeState.currentTheme)
  const [mounted, setMounted] = useState<boolean>(globalThemeState.mounted)
  const [themesLoaded, setThemesLoaded] = useState<boolean>(globalThemeState.themesLoaded)
  const renderCountRef = useRef(0)
  const loadingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Incrementa render count
  renderCountRef.current++

  // Log ridotti - solo ogni 5 render
  if (renderCountRef.current % 5 === 1) {
    console.log(`ThemeProvider: Render`, {
      themesCount: themes.length,
      currentTheme,
      mounted,
      themesLoaded,
      authLoading,
      supabaseConnected: isConnected,
      renderCount: renderCountRef.current,
    })
  }

  // Carica tema salvato da localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true)
      globalThemeState.mounted = true

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme && savedTheme !== currentTheme) {
        setCurrentThemeState(savedTheme)
        globalThemeState.currentTheme = savedTheme
      }
    }
  }, [])

  // Carica temi dal database
  useEffect(() => {
    const loadThemes = async () => {
      // Previeni caricamenti multipli simultanei
      if (loadingRef.current || !supabase || !isConnected || authLoading) {
        return
      }

      // Se abbiamo già i temi nella cache globale, usali
      if (globalThemeState.themes.length > 0 && globalThemeState.themesLoaded) {
        setThemes(globalThemeState.themes)
        setThemesLoaded(true)
        return
      }

      // Cache con timeout
      const now = Date.now()
      const cacheKey = "themes_cache"

      if (now - globalThemeState.lastThemeLoad < THEME_CACHE_DURATION && globalThemeState.themeCache.has(cacheKey)) {
        const cachedThemes = globalThemeState.themeCache.get(cacheKey) || []
        globalThemeState.themes = cachedThemes
        globalThemeState.themesLoaded = true
        setThemes(cachedThemes)
        setThemesLoaded(true)
        return
      }

      loadingRef.current = true

      // Timeout di sicurezza per prevenire caricamenti infiniti
      timeoutRef.current = setTimeout(() => {
        console.warn("ThemeProvider: Timeout caricamento temi")
        loadingRef.current = false
        globalThemeState.themesLoaded = true
        setThemesLoaded(true)
      }, 10000)

      try {
        console.log("ThemeProvider: Caricamento temi dal database...")

        // Prima prova a caricare dalla tabella temi se esiste
        let themesData: Theme[] = []
        let error: any = null

        try {
          const { data, error: themesError } = await supabase
            .from("temi")
            .select("*")
            .eq("attivo", true)
            .order("nome_tema")

          if (!themesError && data) {
            themesData = data
          } else {
            error = themesError
          }
        } catch (e) {
          // Se la tabella temi non esiste, crea temi di default
          console.log("ThemeProvider: Tabella temi non trovata, uso temi di default")
          themesData = [
            {
              id: 1,
              nome_tema: "Sistema",
              colore_background: "#ffffff",
              colore_titolo: "#1a202c",
              colore_testo: "#2d3748",
              carattere_tipo: "system-ui, sans-serif",
              attivo: true,
            },
            {
              id: 2,
              nome_tema: "Scuro",
              colore_background: "#1a202c",
              colore_titolo: "#ffffff",
              colore_testo: "#e2e8f0",
              carattere_tipo: "system-ui, sans-serif",
              attivo: true,
            },
          ]
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        if (error && themesData.length === 0) {
          console.error("ThemeProvider: Errore caricamento temi:", error)
          // Usa tema di default in caso di errore
          const defaultThemes = [
            {
              id: 1,
              nome_tema: "Sistema",
              colore_background: "#ffffff",
              colore_titolo: "#1a202c",
              colore_testo: "#2d3748",
              carattere_tipo: "system-ui, sans-serif",
              attivo: true,
            },
          ]
          globalThemeState.themes = defaultThemes
          globalThemeState.themesLoaded = true
          globalThemeState.themeCache.set(cacheKey, defaultThemes)
          globalThemeState.lastThemeLoad = now
          setThemes(defaultThemes)
          setThemesLoaded(true)
          return
        }

        console.log(`ThemeProvider: Temi caricati con successo: ${themesData.length}`)

        // Aggiorna stato globale
        globalThemeState.themes = themesData
        globalThemeState.themesLoaded = true
        globalThemeState.themeCache.set(cacheKey, themesData)
        globalThemeState.lastThemeLoad = now

        // Aggiorna stato locale
        setThemes(themesData)
        setThemesLoaded(true)

        // Applica il tema corrente se disponibile
        const currentThemeObj = themesData.find((t) => t.nome_tema === currentTheme)
        if (currentThemeObj) {
          applyTheme(currentThemeObj)
        }
      } catch (error) {
        console.error("ThemeProvider: Errore caricamento temi:", error)
        globalThemeState.themesLoaded = true
        setThemesLoaded(true)
      } finally {
        loadingRef.current = false
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }

    loadThemes()
  }, [supabase, isConnected, authLoading, currentTheme])

  // Funzione per applicare un tema
  const applyTheme = (theme: Theme) => {
    if (typeof window === "undefined") return

    try {
      console.log(`ThemeProvider: Applicando tema: ${theme.nome_tema}`)

      const root = document.documentElement

      // Applica i colori del tema
      if (theme.colore_background) {
        root.style.setProperty("--background", theme.colore_background)
      }
      if (theme.colore_titolo) {
        root.style.setProperty("--foreground", theme.colore_titolo)
      }
      if (theme.colore_testo) {
        root.style.setProperty("--muted-foreground", theme.colore_testo)
      }
      if (theme.colore_card) {
        root.style.setProperty("--card", theme.colore_card)
      }
      if (theme.colore_header) {
        root.style.setProperty("--primary", theme.colore_header)
      }

      // Applica le variabili CSS personalizzate se presenti
      if (theme.css_variables) {
        let cssVars: Record<string, string> = {}

        if (typeof theme.css_variables === "string") {
          try {
            cssVars = JSON.parse(theme.css_variables)
          } catch (e) {
            console.error("ThemeProvider: Errore nel parsing delle CSS variables:", e)
          }
        } else if (typeof theme.css_variables === "object") {
          cssVars = theme.css_variables
        }

        Object.entries(cssVars).forEach(([key, value]) => {
          if (value && typeof value === "string") {
            root.style.setProperty(key.startsWith("--") ? key : `--${key}`, value)
          }
        })
      }

      // Applica il font family
      if (theme.carattere_tipo) {
        document.body.style.fontFamily = theme.carattere_tipo
      }

      console.log("ThemeProvider: Tema applicato con successo")
    } catch (error) {
      console.error("ThemeProvider: Errore applicazione tema:", error)
    }
  }

  // Funzione per cambiare tema
  const setCurrentTheme = (themeName: string) => {
    setCurrentThemeState(themeName)
    globalThemeState.currentTheme = themeName

    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, themeName)
    }

    const theme = themes.find((t) => t.nome_tema === themeName)
    if (theme) {
      applyTheme(theme)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const value: ThemeContextType = {
    themes,
    currentTheme,
    setCurrentTheme,
    applyTheme,
    mounted,
    themesLoaded,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme deve essere usato all'interno di ThemeProvider")
  }
  return context
}

// Export per compatibilità con codice esistente
export const useSafeCustomTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      themes: [],
      currentTheme: "Sistema",
      setCurrentTheme: () => {},
      applyTheme: () => {},
      mounted: false,
      themesLoaded: false,
    }
  }
  return context
}

// Funzione per reset esplicito (da usare solo su logout)
export const resetThemeState = () => {
  console.log("ThemeProvider: Reset esplicito dello stato")
  globalThemeState = {
    themes: [],
    currentTheme: "Sistema",
    mounted: false,
    themesLoaded: false,
    lastThemeLoad: 0,
    themeCache: new Map(),
  }
}
