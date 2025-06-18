"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Menu, X, LayoutDashboard, User, LogOut, Calendar, Settings, Smartphone } from "lucide-react"
import { ThemeSelector } from "@/components/theme-selector"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export function Header() {
  const { user, isAdmin, logout } = useAuth()
  const { toggleMobileView, isMobileView } = useSidebarState()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    setMounted(true)
    const updateDate = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
      setCurrentDate(now.toLocaleDateString("it-IT", options))
    }
    updateDate()
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  // Gestione logout ottimizzata
  const handleLogout = async () => {
    try {
      await logout()
      // Redirect esplicito alla home page
      router.push("/")
      toast({
        title: "Logout effettuato",
        description: "Arrivederci!",
      })
    } catch (error) {
      console.error("Errore durante il logout:", error)
      toast({
        title: "Errore",
        description: "Errore durante il logout",
        variant: "destructive",
      })
    }
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const menuItems = [
    ...(user
      ? [
          {
            href: "/dashboard-utente",
            label: "Dashboard Utente",
            icon: LayoutDashboard,
          },
        ]
      : []),
  ]

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">i</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">iStudio</span>
          </Link>

          {/* Center - Date */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{currentDate}</span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeSelector />

            {/* Mobile View Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileView}
              className="hidden md:flex"
              title={isMobileView ? "Passa a vista desktop" : "Passa a vista mobile"}
            >
              <Smartphone className={`h-4 w-4 ${isMobileView ? "text-primary" : ""}`} />
            </Button>

            {/* Link Admin per utenti autorizzati */}
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
              </Link>
            )}

            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {user.nome || user.username}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4 pb-3 border-b">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{currentDate}</span>
            </div>
            <div className="flex flex-col space-y-3">
              {/* Mobile View Toggle */}
              <Button
                variant="ghost"
                onClick={() => {
                  toggleMobileView()
                  setIsMenuOpen(false)
                }}
                className="justify-start"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                {isMobileView ? "Vista Desktop" : "Vista Mobile"}
              </Button>

              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Link Admin nel menu mobile */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}

              {user && (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-2 py-2 text-sm font-medium rounded-md hover:bg-accent"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>{user.nome || user.username}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
