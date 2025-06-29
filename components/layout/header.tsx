"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-provider"
import { useSafeCustomTheme } from "@/contexts/theme-context"
import { useAppConfig } from "@/hooks/use-app-config"
import {
  Sun,
  Moon,
  Palette,
  Menu,
  Monitor,
  Type,
  Layout,
  LayoutGrid,
  Sidebar,
  Settings,
  LogOut,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const { user, signOut, isAdmin } = useAuth()
  const {
    theme,
    setTheme,
    layout,
    setLayout,
    fontSize,
    setFontSize,
    customThemes,
    currentCustomTheme,
    setCustomTheme,
  } = useSafeCustomTheme()

  const { config, isLoading: configLoading } = useAppConfig()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Format date and time
  const formatDateTime = useMemo(() => {
    const timeString = currentTime.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    })
    const dayName = currentTime.toLocaleDateString("it-IT", { weekday: "long" })
    const dateString = currentTime.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return {
      timeAndDay: `${timeString} - ${dayName}`,
      date: dateString,
    }
  }, [currentTime])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsThemeMenuOpen(false)
      setIsUserMenuOpen(false)
    }

    if (isThemeMenuOpen || isUserMenuOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isThemeMenuOpen, isUserMenuOpen])

  // Theme toggle handler
  const toggleTheme = useCallback(() => {
    console.log("Toggling theme, current:", theme)
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }, [theme, setTheme])

  // Theme menu handlers
  const handleThemeMenuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      console.log("Theme menu clicked, current state:", isThemeMenuOpen)
      setIsThemeMenuOpen(!isThemeMenuOpen)
      setIsUserMenuOpen(false)
    },
    [isThemeMenuOpen],
  )

  const handleUserMenuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      console.log("User menu clicked, current state:", isUserMenuOpen)
      setIsUserMenuOpen(!isUserMenuOpen)
      setIsThemeMenuOpen(false)
    },
    [isUserMenuOpen],
  )

  // Layout handlers
  const handleLayoutChange = useCallback(
    (newLayout: typeof layout) => {
      console.log("Changing layout to:", newLayout)
      setLayout(newLayout)
      setIsUserMenuOpen(false)
    },
    [setLayout],
  )

  // Font size handlers
  const handleFontSizeChange = useCallback(
    (newFontSize: typeof fontSize) => {
      console.log("Changing font size to:", newFontSize)
      setFontSize(newFontSize)
      setIsUserMenuOpen(false)
    },
    [setFontSize],
  )

  // Custom theme handlers
  const handleCustomThemeChange = useCallback(
    (theme: typeof currentCustomTheme) => {
      console.log("Changing custom theme to:", theme?.nome)
      setCustomTheme(theme)
      setIsThemeMenuOpen(false)
    },
    [setCustomTheme],
  )

  // Logout handler
  const handleLogout = useCallback(async () => {
    console.log("Logging out user")
    await signOut()
    setIsUserMenuOpen(false)
  }, [signOut])

  const themeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full">
        {/* Desktop Header */}
        <div className="hidden md:flex h-16 items-center justify-between px-4">
          {/* Left: Title and Motto */}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-tight">
              {configLoading ? "Caricamento..." : config?.titolo || "iStudio"}
            </h1>
            {config?.motto && <p className="text-sm text-muted-foreground leading-tight">{config.motto}</p>}
          </div>

          {/* Center: Date and Time */}
          <div className="flex flex-col items-center text-center">
            <div className="text-sm font-normal leading-tight">{formatDateTime.timeAndDay}</div>
            <div className="text-sm font-normal text-muted-foreground leading-tight">{formatDateTime.date}</div>
          </div>

          {/* Right: Controls */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Tema: ${theme}`} className="h-9 w-9">
                {React.createElement(themeIcon, { className: "h-4 w-4" })}
              </Button>

              {/* Theme Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeMenuClick}
                  title="Seleziona tema"
                  className="h-9 w-9"
                >
                  <Palette className="h-4 w-4" />
                </Button>

                {isThemeMenuOpen && (
                  <>
                    <div className="header-menu-overlay" onClick={() => setIsThemeMenuOpen(false)} />
                    <div className="header-menu-content absolute right-0 top-full mt-2 w-48 p-2">
                      <div className="space-y-1">
                        <div className="px-2 py-1.5 text-sm font-medium text-foreground">Temi Disponibili</div>
                        {customThemes.map((customTheme) => (
                          <button
                            key={customTheme.id}
                            onClick={() => handleCustomThemeChange(customTheme)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                              currentCustomTheme?.id === customTheme.id && "bg-accent text-accent-foreground",
                            )}
                          >
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: `hsl(${customTheme.colore_primario})` }}
                            />
                            {customTheme.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <Button variant="ghost" onClick={handleUserMenuClick} className="h-9 px-3 text-sm font-medium">
                  <User className="h-4 w-4 mr-2" />
                  {user.username || user.email?.split("@")[0] || "Utente"}
                </Button>

                {isUserMenuOpen && (
                  <>
                    <div className="header-menu-overlay" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="header-menu-content absolute right-0 top-full mt-2 w-56 p-2">
                      <div className="space-y-1">
                        {/* Layout Section */}
                        <div className="px-2 py-1.5 text-sm font-medium text-foreground">Layout</div>
                        <button
                          onClick={() => handleLayoutChange("standard")}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                            layout === "standard" && "bg-accent text-accent-foreground",
                          )}
                        >
                          <Layout className="h-4 w-4" />
                          Layout Standard
                        </button>
                        <button
                          onClick={() => handleLayoutChange("full-width")}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                            layout === "full-width" && "bg-accent text-accent-foreground",
                          )}
                        >
                          <LayoutGrid className="h-4 w-4" />
                          Layout Esteso
                        </button>
                        <button
                          onClick={() => handleLayoutChange("sidebar")}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                            layout === "sidebar" && "bg-accent text-accent-foreground",
                          )}
                        >
                          <Sidebar className="h-4 w-4" />
                          Layout Sidebar
                        </button>

                        <div className="h-px bg-border my-2" />

                        {/* Font Size Section */}
                        <div className="px-2 py-1.5 text-sm font-medium text-foreground">Dimensione Carattere</div>
                        <button
                          onClick={() => handleFontSizeChange("small")}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                            fontSize === "small" && "bg-accent text-accent-foreground",
                          )}
                        >
                          <Type className="h-3 w-3" />
                          Piccolo
                        </button>
                        <button
                          onClick={() => handleFontSizeChange("normal")}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                            fontSize === "normal" && "bg-accent text-accent-foreground",
                          )}
                        >
                          <Type className="h-4 w-4" />
                          Normale
                        </button>
                        <button
                          onClick={() => handleFontSizeChange("large")}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                            fontSize === "large" && "bg-accent text-accent-foreground",
                          )}
                        >
                          <Type className="h-5 w-5" />
                          Grande
                        </button>

                        <div className="h-px bg-border my-2" />

                        {/* Admin Link */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              window.location.href = "/admin"
                              setIsUserMenuOpen(false)
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Settings className="h-4 w-4" />
                            Dashboard Admin
                          </button>
                        )}

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-destructive hover:text-destructive-foreground text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden h-16 items-center justify-between px-4">
          <div className="flex flex-col flex-1">
            <h1 className="text-base font-semibold leading-tight">
              {configLoading ? "Caricamento..." : config?.titolo || "iStudio"}
            </h1>
            {config?.motto && <p className="text-xs text-muted-foreground leading-tight">{config.motto}</p>}
          </div>

          <div className="flex flex-col items-end text-right mr-2">
            <div className="text-sm font-normal leading-tight">{formatDateTime.timeAndDay}</div>
            <div className="text-xs font-normal text-muted-foreground leading-tight">{formatDateTime.date}</div>
          </div>

          {user && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Menu Utente</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.username || user.email?.split("@")[0] || "Utente"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Theme Controls */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Tema</h4>
                      <div className="flex gap-2">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("light")}
                        >
                          <Sun className="h-4 w-4 mr-2" />
                          Chiaro
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("dark")}
                        >
                          <Moon className="h-4 w-4 mr-2" />
                          Scuro
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTheme("system")}
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          Auto
                        </Button>
                      </div>
                    </div>

                    {/* Custom Themes */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Temi Personalizzati</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {customThemes.map((customTheme) => (
                          <Button
                            key={customTheme.id}
                            variant={currentCustomTheme?.id === customTheme.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCustomThemeChange(customTheme)}
                            className="justify-start"
                          >
                            <div
                              className="w-3 h-3 rounded-full border mr-2"
                              style={{ backgroundColor: `hsl(${customTheme.colore_primario})` }}
                            />
                            {customTheme.nome}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Layout */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Layout</h4>
                      <div className="space-y-1">
                        <Button
                          variant={layout === "standard" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleLayoutChange("standard")}
                          className="w-full justify-start"
                        >
                          <Layout className="h-4 w-4 mr-2" />
                          Standard
                        </Button>
                        <Button
                          variant={layout === "full-width" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleLayoutChange("full-width")}
                          className="w-full justify-start"
                        >
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Esteso
                        </Button>
                        <Button
                          variant={layout === "sidebar" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleLayoutChange("sidebar")}
                          className="w-full justify-start"
                        >
                          <Sidebar className="h-4 w-4 mr-2" />
                          Sidebar
                        </Button>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Dimensione Carattere</h4>
                      <div className="space-y-1">
                        <Button
                          variant={fontSize === "small" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFontSizeChange("small")}
                          className="w-full justify-start"
                        >
                          <Type className="h-3 w-3 mr-2" />
                          Piccolo
                        </Button>
                        <Button
                          variant={fontSize === "normal" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFontSizeChange("normal")}
                          className="w-full justify-start"
                        >
                          <Type className="h-4 w-4 mr-2" />
                          Normale
                        </Button>
                        <Button
                          variant={fontSize === "large" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFontSizeChange("large")}
                          className="w-full justify-start"
                        >
                          <Type className="h-5 w-5 mr-2" />
                          Grande
                        </Button>
                      </div>
                    </div>

                    {/* Admin Link */}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.location.href = "/admin"
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full justify-start"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Dashboard Admin
                      </Button>
                    )}

                    {/* Logout */}
                    <Button variant="destructive" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  )
}
