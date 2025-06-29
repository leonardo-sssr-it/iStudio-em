"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-provider"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Clock,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  Menu,
  Database,
  FileText,
  Layers,
  AlertTriangle,
  Wifi,
  WifiOff,
  StickyNote,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()
  const { user, isAdmin } = useAuth()
  const isOnline = useOnlineStatus()
  const { isSidebarOpen, toggleSidebar } = useSidebarState()
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Verifica se siamo in un ambiente mobile
  useEffect(() => {
    setIsMounted(true)
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Non renderizzare nulla durante SSR
  if (!isMounted) return null

  // Versione mobile della sidebar
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden fixed left-4 top-3 z-50 bg-background border shadow-md"
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
          <SheetContent side="left" className="w-[280px] p-0 bg-background border-r z-50">
            <ScrollArea className="h-full">
              <SidebarContent pathname={pathname} user={user} isAdmin={isAdmin} isOnline={isOnline} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Versione desktop della sidebar
  return (
    <div className={cn("pb-12 w-[240px] flex-shrink-0 sidebar-container", className)} {...props}>
      <ScrollArea className="h-full">
        <SidebarContent pathname={pathname} user={user} isAdmin={isAdmin} isOnline={isOnline} />
      </ScrollArea>
    </div>
  )
}

// Contenuto della sidebar (condiviso tra versione mobile e desktop)
function SidebarContent({
  pathname,
  user,
  isAdmin,
  isOnline,
}: {
  pathname: string
  user: any
  isAdmin: boolean
  isOnline: boolean
}) {
  const searchParams = useSearchParams()
  return (
    <div className="space-y-4 py-4 h-full flex flex-col sidebar-content">
      <div className="sidebar-section">
        <h2 className="sidebar-title">
          iStudio
          <span className="text-xs text-muted-foreground ml-1">v0.4</span>
        </h2>
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={cn(
              "sidebar-button",
              pathname === "/dashboard"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/dashboard-u"
            className={cn(
              "sidebar-button",
              pathname === "/dashboard-u"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <LayoutDashboard />
            <span>Dashboard U</span>
          </Link>
          <Link
            href="/dashboard-utente"
            className={cn(
              "sidebar-button",
              pathname === "/dashboard-utente"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <LayoutDashboard />
            <span>Dashboard Utente</span>
          </Link>
          <Link
            href="/dashboard-mobile"
            className={cn(
              "sidebar-button",
              pathname === "/dashboard-mobile"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <LayoutDashboard />
            <span>Dashboard Mobile</span>
          </Link>
        </div>
      </div>

      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Gestione</h2>
        <div className="space-y-1">
          <Link
            href="/pagine"
            className={cn(
              "sidebar-button",
              pathname?.includes("/pagine")
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <FileText />
            <span>Pagine</span>
          </Link>
          <Link
            href="/note"
            className={cn(
              "sidebar-button",
              pathname?.includes("/note")
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <StickyNote />
            <span>Note</span>
          </Link>
          <Link
            href="/data-explorer?table=appuntamenti"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "appuntamenti"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Calendar />
            <span>Appuntamenti</span>
          </Link>
          <Link
            href="/data-explorer?table=attivita"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "attivita"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <ClipboardList />
            <span>Attività</span>
          </Link>
          <Link
            href="/data-explorer?table=scadenze"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "scadenze"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Clock />
            <span>Scadenze</span>
          </Link>
          <Link
            href="/data-explorer?table=todolist"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "todolist"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <CheckSquare />
            <span>To-Do List</span>
          </Link>
          <Link
            href="/data-explorer?table=progetti"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "progetti"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <BarChart3 />
            <span>Progetti</span>
          </Link>
          <Link
            href="/data-explorer?table=clienti"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "clienti"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Users />
            <span>Clienti</span>
          </Link>
          <Link
            href="/data-explorer?table=pagine"
            className={cn(
              "sidebar-button",
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "pagine"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <FileText />
            <span>Pagine</span>
          </Link>
        </div>
      </div>

      {/* Sezione Admin */}
      {isAdmin && (
        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Amministrazione</h2>
          <div className="space-y-1">
            <Link
              href="/admin"
              className={cn(
                "sidebar-button",
                pathname === "/admin"
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Settings />
              <span>Admin Panel</span>
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                "sidebar-button",
                pathname?.includes("/admin/users")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Users />
              <span>Gestione Utenti</span>
            </Link>
            <Link
              href="/data-explorer"
              className={cn(
                "sidebar-button",
                pathname?.includes("/data-explorer")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Database />
              <span>Data Explorer</span>
            </Link>
            <Link
              href="/table-explorer"
              className={cn(
                "sidebar-button",
                pathname?.includes("/table-explorer")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Layers />
              <span>Table Explorer</span>
            </Link>
            <Link
              href="/debug-scadenze"
              className={cn(
                "sidebar-button",
                pathname?.includes("/debug-scadenze")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <AlertTriangle />
              <span>Debug Scadenze</span>
            </Link>
          </div>
        </div>
      )}

      {/* Sezione Profilo */}
      <div className="sidebar-section mt-auto">
        <div className="space-y-1">
          <Link
            href="/profile"
            className={cn(
              "sidebar-button",
              pathname === "/profile"
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Users />
            <span>Profilo</span>
          </Link>
        </div>

        {/* Indicatore di stato connessione */}
        <div className="sidebar-status">
          {isOnline ? (
            <>
              <Wifi className="text-green-500" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="text-red-500" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Info utente */}
        {user && <div className="sidebar-user-info">{user.username || user.email}</div>}
      </div>
    </div>
  )
}
