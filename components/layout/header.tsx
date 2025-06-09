"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeSelector } from "@/components/theme-selector"
import { useCustomTheme } from "@/contexts/theme-context"
import { useAuth } from "@/lib/auth-provider"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import { Menu, X, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/use-online-status"

export function Header() {
  const { user } = useAuth()
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebarState()
  const { toggleDarkMode, isDarkMode } = useCustomTheme()
  const pathname = usePathname()
  const isOnline = useOnlineStatus()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          {user && (
            <Button
              variant="ghost"
              className="mr-2 px-2 text-base"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
            >
              {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              <span className="sr-only">{isCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}</span>
            </Button>
          )}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold inline-block">iStudio</span>
            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">v0.5.2</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Link
              href="/"
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground/80",
                isActive("/") ? "text-foreground" : "text-foreground/60",
              )}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground/80",
                isActive("/dashboard") ? "text-foreground" : "text-foreground/60",
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground/80",
                isActive("/admin") ? "text-foreground" : "text-foreground/60",
              )}
            >
              Admin
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {/* Indicatore Online/Offline */}
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500",
                "transition-colors duration-300",
              )}
              title={isOnline ? "Online" : "Offline"}
            />

            {/* Toggle Dark Mode */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={toggleDarkMode}
              title={isDarkMode ? "Passa a modalità chiara" : "Passa a modalità scura"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">{isDarkMode ? "Modalità chiara" : "Modalità scura"}</span>
            </Button>

            {/* Theme Selector */}
            <ThemeSelector />
          </div>
        </div>
      </div>
    </header>
  )
}
