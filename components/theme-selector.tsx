"use client"

import { useState } from "react"
import { useSafeCustomTheme } from "@/contexts/theme-context"
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
  const { themes, currentTheme, applyTheme, toggleDarkMode, isDarkMode, layout, setLayout, mounted } =
    useSafeCustomTheme()
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = (themeId: number) => {
    console.log("=== CAMBIO TEMA ===")
    console.log("Cambiando tema a ID:", themeId)
    const success = applyTheme(themeId)
    console.log("Tema applicato con successo:", success)
    setIsOpen(false)
  }

  const handleDarkModeToggle = () => {
    console.log("=== CLICK TOGGLE DARK MODE ===")
    console.log("Toggle dark mode, stato attuale:", isDarkMode)
    toggleDarkMode()
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
        <TabsList className="bg-transparent border">
          <TabsTrigger
            value="default"
            className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Layout className="h-4 w-4" />
            <span className="hidden lg:inline">Standard</span>
          </TabsTrigger>
          <TabsTrigger
            value="fullWidth"
            className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden lg:inline">Full Width</span>
          </TabsTrigger>
          <TabsTrigger
            value="sidebar"
            className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
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
        className="h-9 w-9 hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-200"
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
            className="h-9 w-9 hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-200"
            title="Seleziona tema"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto border bg-popover">
          <DropdownMenuLabel className="font-semibold text-popover-foreground">
            Temi Disponibili
            {currentTheme && (
              <div className="text-xs text-muted-foreground font-normal mt-1">
                Attuale: {currentTheme.nome_tema || currentTheme.nome}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.length > 0 ? (
            themes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className="flex items-center gap-3 cursor-pointer py-3 px-3 hover:bg-accent/50 focus:bg-accent/50"
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
                  <div className="font-medium truncate text-sm text-popover-foreground">
                    {theme.nome_tema || theme.nome}
                  </div>
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
