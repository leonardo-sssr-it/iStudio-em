"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Menu, X, LayoutDashboard, User, LogOut, Calendar } from "lucide-react"
import { ThemeSelector } from "@/components/theme-selector"
// Rimosso useCustomTheme perché il padding è gestito dal wrapper
// import { useCustomTheme } from "@/contexts/theme-context"

export function Header() {
  const { user, isAdmin, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // const { layout } = useCustomTheme() // Rimosso
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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const menuItems = [
    ...(user
      ? [
          {
            href: isAdmin ? "/admin" : "/dashboard",
            label: isAdmin ? "Admin Dashboard" : "Dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),
  ]

  // Rimosso containerClass, il padding è gestito dal LayoutWrapper
  // const containerClass = ...

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Il div con containerClass è stato rimosso. Il padding è gestito dal LayoutWrapper */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Aggiunto container standard */}
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
          <div className="flex items-center space-x-4">
            <ThemeSelector />
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {user.nome || user.username}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
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
                      logout()
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
