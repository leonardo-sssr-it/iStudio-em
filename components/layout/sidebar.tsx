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
    <div className={cn("pb-12 w-[240px] flex-shrink-0 bg-background border-r", className)} {...props}>
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
    <div className="space-y-4 py-4 h-full flex flex-col">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-2 text-base font-semibold tracking-tight">
          iStudio
          <span className="text-xs text-muted-foreground ml-1">v0.4</span>
        </h2>
        <div className="space-y-1">
          <Button
            asChild
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Dashboard</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-u" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/dashboard-u" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Dashboard U</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-utente" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/dashboard-utente" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Dashboard Utente</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-mobile" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/dashboard-mobile" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Dashboard Mobile</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-3 py-2">
        <h2 className="mb-2 px-2 text-base font-semibold tracking-tight">Gestione</h2>
        <div className="space-y-1">
          <Button
            asChild
            variant={pathname?.includes("/pagine") ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/pagine" className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Pagine</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname?.includes("/note") ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/note" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Note</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "appuntamenti"
                ? "secondary"
                : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=appuntamenti" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Appuntamenti</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "attivita" ? "secondary" : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=attivita" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Attività</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "scadenze" ? "secondary" : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=scadenze" className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Scadenze</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "todolist" ? "secondary" : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=todolist" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">To-Do List</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "progetti" ? "secondary" : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=progetti" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Progetti</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "clienti" ? "secondary" : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=clienti" className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Clienti</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={
              pathname?.includes("/data-explorer") && searchParams?.get("table") === "pagine" ? "secondary" : "ghost"
            }
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/data-explorer?table=pagine" className="flex items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Pagine</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Sezione Admin */}
      {isAdmin && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-base font-semibold tracking-tight">Amministrazione</h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/admin" ? "secondary" : "ghost"}
              className="w-full justify-start h-9 px-2 text-sm"
              size="sm"
            >
              <Link href="/admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Admin Panel</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/admin/users") ? "secondary" : "ghost"}
              className="w-full justify-start h-9 px-2 text-sm"
              size="sm"
            >
              <Link href="/admin/users" className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Gestione Utenti</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/data-explorer") ? "secondary" : "ghost"}
              className="w-full justify-start h-9 px-2 text-sm"
              size="sm"
            >
              <Link href="/data-explorer" className="flex items-center gap-2">
                <Database className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Data Explorer</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/table-explorer") ? "secondary" : "ghost"}
              className="w-full justify-start h-9 px-2 text-sm"
              size="sm"
            >
              <Link href="/table-explorer" className="flex items-center gap-2">
                <Layers className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Table Explorer</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/debug-scadenze") ? "secondary" : "ghost"}
              className="w-full justify-start h-9 px-2 text-sm"
              size="sm"
            >
              <Link href="/debug-scadenze" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Debug Scadenze</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Sezione Profilo */}
      <div className="px-3 py-2 mt-auto">
        <div className="space-y-1">
          <Button
            asChild
            variant={pathname === "/profile" ? "secondary" : "ghost"}
            className="w-full justify-start h-9 px-2 text-sm"
            size="sm"
          >
            <Link href="/profile" className="flex items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Profilo</span>
            </Link>
          </Button>
        </div>

        {/* Indicatore di stato connessione */}
        <div className="mt-4 px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-500 flex-shrink-0" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Info utente */}
        {user && (
          <div className="mt-2 px-2 py-1 text-xs text-muted-foreground truncate">{user.username || user.email}</div>
        )}
      </div>
    </div>
  )
}
