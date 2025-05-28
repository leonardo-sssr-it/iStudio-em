"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { cn } from "@/lib/utils"
import {
  Home,
  LayoutDashboard,
  User,
  Settings,
  Calendar,
  FileText,
  Users,
  Database,
  BarChart,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Clock,
  ListTodo,
  Briefcase,
  FolderKanban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user, isAdmin } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Recupera lo stato della sidebar dal localStorage
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState) {
      setCollapsed(savedState === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))
  }

  // Funzione per verificare se un link è attivo
  const isLinkActive = (href: string) => {
    if (href.includes("?table=")) {
      const [path, query] = href.split("?")
      const tableParam = query.split("=")[1]
      return pathname === path && searchParams.get("table") === tableParam
    }
    return pathname === href
  }

  // Menu items basati sul ruolo dell'utente
  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    ...(user
      ? [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          { href: "/profile", label: "Profilo", icon: User },
          { href: "/calendar", label: "Calendario", icon: Calendar },
          { href: "/documents", label: "Documenti", icon: FileText },
        ]
      : []),
  ]

  // Sezione dati
  const dataItems = user
    ? [
        { href: "/data-explorer?table=appuntamenti", label: "Appuntamenti", icon: Calendar },
        { href: "/data-explorer?table=attivita", label: "Attività", icon: CheckSquare },
        { href: "/data-explorer?table=scadenze", label: "Scadenze", icon: Clock },
        { href: "/data-explorer?table=todolist", label: "To-Do List", icon: ListTodo },
        { href: "/data-explorer?table=progetti", label: "Progetti", icon: Briefcase },
        { href: "/data-explorer?table=clienti", label: "Clienti", icon: Users },
      ]
    : []

  // Menu admin
  const adminItems = isAdmin
    ? [
        { href: "/admin", label: "Admin", icon: Settings },
        { href: "/users", label: "Utenti", icon: Users },
        { href: "/database", label: "Database", icon: Database },
        { href: "/analytics", label: "Analytics", icon: BarChart },
      ]
    : []

  if (!isMounted) return null

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">i</span>
          </div>
          {!collapsed && <span className="font-bold text-xl">iStudio</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="h-8 w-8">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="px-3 py-4">
          <nav className="space-y-4">
            {/* Menu principale */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const active = isLinkActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground dark:text-white"
                        : "hover:bg-accent hover:text-accent-foreground",
                      collapsed ? "justify-center" : "space-x-3",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>

            {/* Sezione Dati */}
            {dataItems.length > 0 && (
              <div className="pt-2">
                {!collapsed && <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">Dati</h3>}
                <div className="space-y-1">
                  {/* Link all'esploratore dati generale */}
                  <Link
                    href="/data-explorer"
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/data-explorer" && !searchParams.get("table")
                        ? "bg-primary text-primary-foreground dark:text-white"
                        : "hover:bg-accent hover:text-accent-foreground",
                      collapsed ? "justify-center" : "space-x-3",
                    )}
                    aria-current={pathname === "/data-explorer" && !searchParams.get("table") ? "page" : undefined}
                  >
                    <FolderKanban className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
                    {!collapsed && <span>Tutti i Dati</span>}
                  </Link>

                  {/* Link alle tabelle specifiche */}
                  {dataItems.map((item) => {
                    const active = isLinkActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground dark:text-white"
                            : "hover:bg-accent hover:text-accent-foreground",
                          collapsed ? "justify-center" : "space-x-3",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sezione Admin */}
            {adminItems.length > 0 && (
              <div className="pt-2">
                {!collapsed && <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">Admin</h3>}
                <div className="space-y-1">
                  {adminItems.map((item) => {
                    const active = isLinkActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground dark:text-white"
                            : "hover:bg-accent hover:text-accent-foreground",
                          collapsed ? "justify-center" : "space-x-3",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>
      </ScrollArea>
    </div>
  )
}
