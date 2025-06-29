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
    <div className="space-y-4 py-4 h-full flex flex-col sidebar-content">
      <div className="sidebar-section">
        <h2 className="sidebar-title">
          iStudio
          <span className="text-xs text-muted-foreground ml-1">v0.4</span>
        </h2>
        <div className="space-y-1">
          <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant={pathname === "/dashboard-u" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard-u">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard U
            </Link>
          </Button>
          <Button
            variant={pathname === "/dashboard-utente" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard-utente">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard Utente
            </Link>
          </Button>
          <Button
            variant={pathname === "/dashboard-mobile" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard-mobile">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard Mobile
            </Link>
          </Button>
        </div>
      </div>

      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Gestione</h2>
        <div className="space-y-1">
          <Button
            variant={pathname?.includes("/pagine") ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/pagine">
              <FileText className="mr-2 h-4 w-4" />
              Pagine
            </Link>
          </Button>
          <Button
            variant={pathname?.includes("/note") ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/note">
              <StickyNote className="mr-2 h-4 w-4" />
              Note
            </Link>
          </Button>
          <Button
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "appuntamenti"
                ? "secondary"
                : "ghost"
            }
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/data-explorer?table=appuntamenti">
              <Calendar className="mr-2 h-4 w-4" />
              Appuntamenti
            </Link>
          </Button>
          <Button
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "attivita" ? "secondary" : "ghost"
            }
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/data-explorer?table=attivita">
              <ClipboardList className="mr-2 h-4 w-4" />
              Attività
            </Link>
          </Button>
          <Button
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "scadenze" ? "secondary" : "ghost"
            }
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/data-explorer?table=scadenze">
              <Clock className="mr-2 h-4 w-4" />
              Scadenze
            </Link>
          </Button>
          <Button
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "todolist" ? "secondary" : "ghost"
            }
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/data-explorer?table=todolist">
              <CheckSquare className="mr-2 h-4 w-4" />
              To-Do List
            </Link>
          </Button>
          <Button
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "progetti" ? "secondary" : "ghost"
            }
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/data-explorer?table=progetti">
              <BarChart3 className="mr-2 h-4 w-4" />
              Progetti
            </Link>
          </Button>
          <Button
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "clienti" ? "secondary" : "ghost"
            }
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/data-explorer?table=clienti">
              <Users className="mr-2 h-4 w-4" />
              Clienti
            </Link>
          </Button>
        </div>
      </div>

      {/* Sezione Admin */}
      {isAdmin && (
        <div className="sidebar-section">
          <h2 className="sidebar-section-title">Amministrazione</h2>
          <div className="space-y-1">
            <Button
              variant={pathname === "/admin" ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/admin/users") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Gestione Utenti
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/data-explorer") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/data-explorer">
                <Database className="mr-2 h-4 w-4" />
                Data Explorer
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/table-explorer") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/table-explorer">
                <Layers className="mr-2 h-4 w-4" />
                Table Explorer
              </Link>
            </Button>
            <Button
              variant={pathname?.includes("/debug-scadenze") ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/debug-scadenze">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Debug Scadenze
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Sezione Profilo */}
      <div className="sidebar-section mt-auto">
        <div className="space-y-1">
          <Button
            variant={pathname === "/profile" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <Link href="/profile">
              <Users className="mr-2 h-4 w-4" />
              Profilo
            </Link>
          </Button>
        </div>

        {/* Indicatore di stato connessione */}
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
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
        {user && <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.username || user.email}</div>}
      </div>
    </div>
  )
}
