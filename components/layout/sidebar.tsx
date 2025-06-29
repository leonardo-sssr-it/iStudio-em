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
        </h2>
        <div className="space-y-1">
          <Button
            asChild
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/dashboard">
              <LayoutDashboard />
              <span>Dashboard</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-u" ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/dashboard-u">
              <LayoutDashboard />
              <span>Dashboard U</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-utente" ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/dashboard-utente">
              <LayoutDashboard />
              <span>Dashboard Utente</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-mobile" ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/dashboard-mobile">
              <LayoutDashboard />
              <span>Dashboard Mobile</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Gestione</h2>
        <div className="space-y-1">
          <Button
            asChild
            variant={pathname?.includes("/pagine") ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/pagine">
              <FileText />
              <span>Pagine</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname?.includes("/note") ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/note">
              <StickyNote />
              <span>Note</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "appuntamenti"
                ? "secondary"
                : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=appuntamenti">
              <Calendar />
              <span>Appuntamenti</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "attivita" ? "secondary" : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=attivita">
              <ClipboardList />
              <span>Attività</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "scadenze" ? "secondary" : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=scadenze">
              <Clock />
              <span>Scadenze</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "todolist" ? "secondary" : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=todolist">
              <CheckSquare />
              <span>To-Do List</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "progetti" ? "secondary" : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=progetti">
              <BarChart3 />
              <span>Progetti</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "clienti" ? "secondary" : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=clienti">
              <Users />
              <span>Clienti</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "pagine" ? "secondary" : "ghost"
            }
            className="sidebar-button"
            size="sm"
          >
            <Link href="/data-explorer?table=pagine">
              <FileText />
              <span>Pagine</span>
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
              asChild
              variant={pathname === "/admin" ? "secondary" : "ghost"}
              className="sidebar-button"
              size="sm"
            >
              <Link href="/admin">
                <Settings />
                <span>Admin Panel</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/admin/users") ? "secondary" : "ghost"}
              className="sidebar-button"
              size="sm"
            >
              <Link href="/admin/users">
                <Users />
                <span>Gestione Utenti</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/data-explorer") ? "secondary" : "ghost"}
              className="sidebar-button"
              size="sm"
            >
              <Link href="/data-explorer">
                <Database />
                <span>Data Explorer</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/table-explorer") ? "secondary" : "ghost"}
              className="sidebar-button"
              size="sm"
            >
              <Link href="/table-explorer">
                <Layers />
                <span>Table Explorer</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Sezione Profilo */}
      <div className="sidebar-section mt-auto">
        <div className="space-y-1">
          <Button
            asChild
            variant={pathname === "/profile" ? "secondary" : "ghost"}
            className="sidebar-button"
            size="sm"
          >
            <Link href="/profile">
              <Users />
              <span>Profilo</span>
            </Link>
          </Button>
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
