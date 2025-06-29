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
    <div className="space-y-3 py-3 h-full flex flex-col sidebar-content">
      <div className="sidebar-section">
        <h2 className="sidebar-title">
          iStudio
          <span className="text-xs text-muted-foreground ml-1">v0.4</span>
        </h2>
        <div className="space-y-0.5">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname === "/dashboard" && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard-u"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname === "/dashboard-u" && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard U
          </Link>
          <Link
            href="/dashboard-utente"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname === "/dashboard-utente" && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard Utente
          </Link>
          <Link
            href="/dashboard-mobile"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname === "/dashboard-mobile" && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard Mobile
          </Link>
        </div>
      </div>

      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Gestione</h2>
        <div className="space-y-0.5">
          <Link
            href="/pagine"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/pagine") && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <FileText className="h-4 w-4" />
            Pagine
          </Link>
          <Link
            href="/note"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/note") && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <StickyNote className="h-4 w-4" />
            Note
          </Link>
          <Link
            href="/data-explorer?table=appuntamenti"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/data-explorer") &&
                searchParams?.get("table") === "appuntamenti" &&
                "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <Calendar className="h-4 w-4" />
            Appuntamenti
          </Link>
          <Link
            href="/data-explorer?table=attivita"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/data-explorer") &&
                searchParams?.get("table") === "attivita" &&
                "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <ClipboardList className="h-4 w-4" />
            Attività
          </Link>
          <Link
            href="/data-explorer?table=scadenze"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/data-explorer") &&
                searchParams?.get("table") === "scadenze" &&
                "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <Clock className="h-4 w-4" />
            Scadenze
          </Link>
          <Link
            href="/data-explorer?table=todolist"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/data-explorer") &&
                searchParams?.get("table") === "todolist" &&
                "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <CheckSquare className="h-4 w-4" />
            To-Do List
          </Link>
          <Link
            href="/data-explorer?table=progetti"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/data-explorer") &&
                searchParams?.get("table") === "progetti" &&
                "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Progetti
          </Link>
          <Link
            href="/data-explorer?table=clienti"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname?.includes("/data-explorer") &&
                searchParams?.get("table") === "clienti" &&
                "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <Users className="h-4 w-4" />
            Clienti
          </Link>
        </div>
      </div>

      {/* Sezione Admin */}
      {isAdmin && (
        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Amministrazione</h2>
          <div className="space-y-0.5">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
                pathname === "/admin" && "bg-primary text-primary-foreground font-medium shadow-sm",
              )}
            >
              <Settings className="h-4 w-4" />
              Admin Panel
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
                pathname?.includes("/admin/users") && "bg-primary text-primary-foreground font-medium shadow-sm",
              )}
            >
              <Users className="h-4 w-4" />
              Gestione Utenti
            </Link>
            <Link
              href="/data-explorer"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
                pathname?.includes("/data-explorer") && "bg-primary text-primary-foreground font-medium shadow-sm",
              )}
            >
              <Database className="h-4 w-4" />
              Data Explorer
            </Link>
            <Link
              href="/table-explorer"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
                pathname?.includes("/table-explorer") && "bg-primary text-primary-foreground font-medium shadow-sm",
              )}
            >
              <Layers className="h-4 w-4" />
              Table Explorer
            </Link>
            <Link
              href="/debug-scadenze"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
                pathname?.includes("/debug-scadenze") && "bg-primary text-primary-foreground font-medium shadow-sm",
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              Debug Scadenze
            </Link>
          </div>
        </div>
      )}

      {/* Sezione Profilo */}
      <div className="sidebar-section mt-auto">
        <div className="space-y-0.5">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors hover:bg-accent/80 hover:text-accent-foreground",
              pathname === "/profile" && "bg-primary text-primary-foreground font-medium shadow-sm",
            )}
          >
            <Users className="h-4 w-4" />
            Profilo
          </Link>
        </div>

        {/* Indicatore di stato connessione */}
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Info utente */}
        {user && <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user.username || user.email}</div>}
      </div>
    </div>
  )
}
