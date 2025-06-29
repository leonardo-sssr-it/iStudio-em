"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { useAppConfig } from "@/hooks/use-app-config"
import { useSafeCustomTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Menu,
  Moon,
  Sun,
  Palette,
  User,
  LogOut,
  Settings,
  Layout,
  LayoutGrid,
  LayoutDashboard,
  Type,
  RotateCcw,
  ChevronDown,
} from "lucide-react"

export function Header() {
  const { user, isAdmin, logout } = useAuth()
  const { config, isLoading: configLoading } = useAppConfig()
  const {
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
  } = useSafeCustomTheme()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Debug per capire lo stato dell'utente
  useEffect(() => {
    console.log("Header - User state:", {
      user: user ? { id: user.id, nome: user.nome, username: user.username, email: user.email } : null,
      isAdmin,
      mounted,
    })
  }, [user, isAdmin, mounted])

  // Formattazione data su due righe SENZA grassetto
  const formatDateTime = useCallback(() => {
    const now = new Date()

    // Prima riga: "21:35 - domenica"
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    }
    const weekdayOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
    }
    const time = now.toLocaleTimeString("it-IT", timeOptions)
    const weekday = now.toLocaleDateString("it-IT", weekdayOptions)
    const timeString = `${time} - ${weekday}`

    // Seconda riga: "29 giugno 2025"
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    const dateString = now.toLocaleDateString("it-IT", dateOptions)

    return { timeString, dateString }
  }, [])

  // Aggiorna data/ora ogni minuto
  useEffect(() => {
    const updateDateTime = () => {
      const { timeString, dateString } = formatDateTime()
      setCurrentTime(timeString)
      setCurrentDate(dateString)
    }
    updateDateTime()
    const interval = setInterval(updateDateTime, 60000)
    return () => clearInterval(interval)
  }, [formatDateTime])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleThemeChange = useCallback(
    (themeId: number) => {
      console.log("Changing theme to:", themeId)
      applyTheme(themeId)
      setShowThemeMenu(false)
    },
    [applyTheme],
  )

  const handleLayoutChange = useCallback(
    (newLayout: string) => {
      console.log("Changing layout to:", newLayout)
      setLayout(newLayout as any)
      setShowUserMenu(false)
      setIsMenuOpen(false)
    },
    [setLayout],
  )

  const handleFontSizeChange = useCallback(
    (size: string) => {
      console.log("Changing font size to:", size)
      setFontSize(size as any)
      setShowUserMenu(false)
      setIsMenuOpen(false)
    },
    [setFontSize],
  )

  const handleLogout = useCallback(() => {
    console.log("Logging out")
    logout()
    setShowUserMenu(false)
    setIsMenuOpen(false)
  }, [logout])

  // Memoizza i valori per evitare re-render inutili
  const appTitle = useMemo(() => config?.titolo || "iStudio", [config?.titolo])
  const appMotto = useMemo(() => config?.motto || "", [config?.motto])

  // Debug per temi
  useEffect(() => {
    console.log("Themes state:", {
      themes: themes.length,
      currentTheme: currentTheme?.nome_tema,
      mounted,
    })
  }, [themes, currentTheme, mounted])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-8 w-48 bg-muted animate-pulse rounded hidden md:block" />
            <div className="flex items-center space-x-2">
              <div className="h-9 w-9 bg-muted animate-pulse rounded" />
              <div className="h-9 w-9 bg-muted animate-pulse rounded" />
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo e Titolo/Motto */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">iS</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-xl leading-tight">{appTitle}</div>
                {appMotto && <div className="text-xs text-muted-foreground leading-tight">{appMotto}</div>}
              </div>
            </Link>
          </div>

          {/* Centro - Data e Ora (solo desktop) - SENZA grassetto */}
          <div className="hidden md:flex flex-col items-center text-center">
            <div className="text-xs text-foreground font-normal">{currentTime}</div>
            <div className="text-xs text-muted-foreground font-normal">{currentDate}</div>
          </div>

          {/* Controlli a destra */}
          <div className="flex items-center space-x-2">
            {/* Toggle Dark Mode */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9 hover:bg-accent/50 transition-colors"
              title={isDarkMode ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-600" />}
            </Button>

            {/* Selettore Temi - Solo se loggato */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-accent/50 transition-colors"
                  title="Seleziona tema"
                  onClick={() => {
                    console.log("Theme button clicked")
                    setShowThemeMenu(!showThemeMenu)
                    setShowUserMenu(false)
                  }}
                >
                  <Palette className="h-4 w-4" />
                </Button>

                {/* Menu Temi */}
                {showThemeMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b">
                      <div className="font-semibold text-sm">Temi Disponibili</div>
                      {currentTheme && (
                        <div className="text-xs text-muted-foreground mt-1">Attuale: {currentTheme.nome_tema}</div>
                      )}
                    </div>
                    <div className="p-1">
                      {themes.length > 0 ? (
                        themes.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-accent rounded-sm transition-colors"
                          >
                            {theme.isDefault ? (
                              <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 shadow-sm bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <RotateCcw className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div
                                className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 shadow-sm"
                                style={{
                                  backgroundColor: theme.colore_titolo?.startsWith("#")
                                    ? theme.colore_titolo
                                    : theme.colore_titolo?.includes("%")
                                      ? `hsl(${theme.colore_titolo})`
                                      : "#6366f1",
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-sm">
                                {theme.nome_tema}
                                {theme.isDefault && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Sistema)</span>
                                )}
                              </div>
                            </div>
                            {currentTheme?.id === theme.id && <span className="text-primary font-bold text-lg">✓</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-muted-foreground text-sm">Nessun tema disponibile</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Menu Utente - Solo se loggato */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  className="h-9 px-3 hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    console.log("User button clicked")
                    setShowUserMenu(!showUserMenu)
                    setShowThemeMenu(false)
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline text-sm">{user.nome || user.username}</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>

                {/* Menu Utente */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-50">
                    <div className="p-3 border-b">
                      <div className="font-medium text-sm">{user.nome || user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>

                    <div className="p-1">
                      {/* Layout Options */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">LAYOUT</div>
                      <button
                        onClick={() => handleLayoutChange("default")}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        <div className="flex items-center">
                          <Layout className="h-4 w-4 mr-2" />
                          Layout Standard
                        </div>
                        {layout === "default" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        onClick={() => handleLayoutChange("fullWidth")}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        <div className="flex items-center">
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Layout Esteso
                        </div>
                        {layout === "fullWidth" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        onClick={() => handleLayoutChange("sidebar")}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        <div className="flex items-center">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Layout Sidebar
                        </div>
                        {layout === "sidebar" && <span className="text-primary">✓</span>}
                      </button>

                      <Separator className="my-2" />

                      {/* Font Size Options */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">DIMENSIONE CARATTERE</div>
                      <button
                        onClick={() => handleFontSizeChange("small")}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        <div className="flex items-center">
                          <Type className="h-3 w-3 mr-2" />
                          Piccolo
                        </div>
                        {fontSize === "small" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        onClick={() => handleFontSizeChange("normal")}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        <div className="flex items-center">
                          <Type className="h-4 w-4 mr-2" />
                          Normale
                        </div>
                        {fontSize === "normal" && <span className="text-primary">✓</span>}
                      </button>
                      <button
                        onClick={() => handleFontSizeChange("large")}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                      >
                        <div className="flex items-center">
                          <Type className="h-5 w-5 mr-2" />
                          Grande
                        </div>
                        {fontSize === "large" && <span className="text-primary">✓</span>}
                      </button>

                      <Separator className="my-2" />

                      {/* Admin Link */}
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin"
                            className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Dashboard Admin
                          </Link>
                          <Separator className="my-2" />
                        </>
                      )}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm transition-colors text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Menu Mobile - Solo se loggato */}
            {user && (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {/* Data/Ora Mobile - SENZA grassetto */}
                      <div className="flex flex-col items-center space-y-1 mb-4 pb-4 border-b">
                        <div className="text-sm font-normal">{currentTime}</div>
                        <div className="text-xs text-muted-foreground font-normal">{currentDate}</div>
                      </div>

                      {/* Titolo/Motto Mobile */}
                      <div className="flex flex-col items-center space-y-1 mb-4 pb-4 border-b sm:hidden">
                        <div className="font-bold text-lg">{appTitle}</div>
                        {appMotto && <div className="text-sm text-muted-foreground text-center">{appMotto}</div>}
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="px-2 py-2 text-sm font-medium border-b">{user.nome || user.username}</div>

                        {/* Layout Mobile */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">LAYOUT</div>
                        <button
                          onClick={() => handleLayoutChange("default")}
                          className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <Layout className="h-4 w-4 mr-2" />
                            Layout Standard
                          </div>
                          {layout === "default" && <span className="text-primary">✓</span>}
                        </button>
                        <button
                          onClick={() => handleLayoutChange("fullWidth")}
                          className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Layout Esteso
                          </div>
                          {layout === "fullWidth" && <span className="text-primary">✓</span>}
                        </button>
                        <button
                          onClick={() => handleLayoutChange("sidebar")}
                          className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Layout Sidebar
                          </div>
                          {layout === "sidebar" && <span className="text-primary">✓</span>}
                        </button>

                        {/* Font Size Mobile */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                          DIMENSIONE CARATTERE
                        </div>
                        <button
                          onClick={() => handleFontSizeChange("small")}
                          className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <Type className="h-3 w-3 mr-2" />
                            Piccolo
                          </div>
                          {fontSize === "small" && <span className="text-primary">✓</span>}
                        </button>
                        <button
                          onClick={() => handleFontSizeChange("normal")}
                          className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <Type className="h-4 w-4 mr-2" />
                            Normale
                          </div>
                          {fontSize === "normal" && <span className="text-primary">✓</span>}
                        </button>
                        <button
                          onClick={() => handleFontSizeChange("large")}
                          className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <Type className="h-5 w-5 mr-2" />
                            Grande
                          </div>
                          {fontSize === "large" && <span className="text-primary">✓</span>}
                        </button>

                        {/* Admin Link Mobile */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-accent mt-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Dashboard Admin
                          </Link>
                        )}

                        {/* Logout Mobile */}
                        <button
                          onClick={handleLogout}
                          className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-accent text-destructive mt-2"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showThemeMenu || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowThemeMenu(false)
            setShowUserMenu(false)
          }}
        />
      )}
    </header>
  )
}
