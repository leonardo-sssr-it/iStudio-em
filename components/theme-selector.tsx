"use client"

import { useState, useEffect } from "react"
import { useCustomTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Palette, Moon, Sun, Layout, LayoutGrid, LayoutDashboard } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ThemeSelector() {
  const { themes, currentTheme, applyTheme, toggleDarkMode, isDarkMode, layout, setLayout } = useCustomTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (themeId: number) => {
    console.log("=== CAMBIO TEMA ===")
    console.log("Cambiando tema a ID:", themeId)
    const success = applyTheme(themeId)
    console.log("Tema applicato con successo:", success)
    setIsOpen(false)

    // Forza il re-render della pagina per applicare il tema
    setTimeout(() => {
      window.dispatchEvent(new Event("theme-changed"))
    }, 100)
  }

  const handleDarkModeToggle = () => {
    console.log("=== CLICK TOGGLE DARK MODE ===")
    console.log("Toggle dark mode, stato attuale:", isDarkMode)
    toggleDarkMode()

    // Forza il re-render
    setTimeout(() => {
      window.dispatchEvent(new Event("theme-changed"))
    }, 100)
  }

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Layout Selector */}
      <Tabs value={layout} className="hidden md:flex" onValueChange={(value) => setLayout(value as any)}>
        <TabsList>
          <TabsTrigger value="default" className="flex items-center gap-1">
            <Layout className="h-4 w-4" />
            <span className="hidden lg:inline">Standard</span>
          </TabsTrigger>
          <TabsTrigger value="fullWidth" className="flex items-center gap-1">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden lg:inline">Full Width</span>
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden lg:inline">Sidebar</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Dark Mode Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDarkModeToggle}
        className="h-9 w-9 transition-all duration-200 hover:bg-accent"
        title={isDarkMode ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
      >
        {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-600" />}
      </Button>

      {/* Theme Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 transition-all duration-200 hover:bg-accent"
            title="Seleziona tema"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="font-semibold">
            Temi Disponibili
            {currentTheme && (
              <div className="text-xs text-muted-foreground font-normal mt-1">Attuale: {currentTheme.nome}</div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.length > 0 ? (
            themes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className="flex items-center gap-3 cursor-pointer py-3 px-3"
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 shadow-sm"
                  style={{
                    backgroundColor: theme.primary_color?.startsWith("#")
                      ? theme.primary_color
                      : theme.primary_color?.includes("%")
                        ? `hsl(${theme.primary_color})`
                        : "#6366f1",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{theme.nome}</div>
                  {theme.primary_color && (
                    <div className="text-xs text-muted-foreground truncate">{theme.primary_color}</div>
                  )}
                </div>
                {currentTheme?.id === theme.id && <span className="text-primary font-bold text-lg">✓</span>}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-muted-foreground py-3">
              Nessun tema disponibile
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
