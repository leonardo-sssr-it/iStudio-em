"use client"

import { useState } from "react"
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

  return (
    <div className="flex items-center space-x-2">
      {/* Layout Selector */}
      <Tabs defaultValue={layout} className="hidden md:flex" onValueChange={(value) => setLayout(value as any)}>
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
      <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Theme Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Temi Disponibili</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => {
                applyTheme(theme.id)
                setIsOpen(false)
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: theme.primary_color
                    ? theme.primary_color.startsWith("#")
                      ? theme.primary_color
                      : `hsl(${theme.primary_color})`
                    : "#000000",
                }}
              />
              <span>{theme.nome}</span>
              {currentTheme?.id === theme.id && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
