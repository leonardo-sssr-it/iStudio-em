"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed left-4 top-3 z-40" aria-label="Toggle Menu">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
          <SidebarContent pathname={pathname} user={user} isAdmin={isAdmin} isOnline={isOnline} />
        </SheetContent>
      </Sheet>
    )
  }

  // Versione desktop della sidebar
  return (
    <div className={cn("pb-12 w-[240px] flex-shrink-0", className)} {...props}>
      <SidebarContent pathname={pathname} user={user} isAdmin={isAdmin} isOnline={isOnline} />
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
      <div className="px-4 py-2">
        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">iStudio</h2>
        <div className="space-y-1">
          <Button asChild variant={pathname === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-u" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/dashboard-u">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard U
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-utente" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/dashboard-utente">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard Utente
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/dashboard-mobile" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link href="/dashboard-mobile">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard Mobile
            </Link>
          </Button>
        </div>
      </div>
      <div className="px-4 py-2">
        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Gestione</h2>
        <ScrollArea className="h-[300px] px-1">
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname?.includes("/pagine") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/pagine">
                <FileText className="mr-2 h-4 w-4" />
                Pagine
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/note") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/note">
                <StickyNote className="mr-2 h-4 w-4" />
                Note
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "appuntamenti"
                  ? "secondary"
                  : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=appuntamenti">
                <Calendar className="mr-2 h-4 w-4" />
                Appuntamenti
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "attivita"
                  ? "secondary"
                  : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=attivita">
                <ClipboardList className="mr-2 h-4 w-4" />
                Attività
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "scadenze"
                  ? "secondary"
                  : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=scadenze">
                <Clock className="mr-2 h-4 w-4" />
                Scadenze
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "todolist"
                  ? "secondary"
                  : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=todolist">
                <CheckSquare className="mr-2 h-4 w-4" />
                To-Do List
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "progetti"
                  ? "secondary"
                  : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=progetti">
                <BarChart3 className="mr-2 h-4 w-4" />
                Progetti
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "clienti" ? "secondary" : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=clienti">
                <Users className="mr-2 h-4 w-4" />
                Clienti
              </Link>
            </Button>
            <Button
              asChild
              variant={
                pathname?.includes("/data-explorer") && searchParams?.get("table") === "pagine" ? "secondary" : "ghost"
              }
              className="w-full justify-start"
            >
              <Link href="/data-explorer?table=pagine">
                <FileText className="mr-2 h-4 w-4" />
                Pagine
              </Link>
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Sezione Admin */}
      {isAdmin && (
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Amministrazione</h2>
          <div className="space-y-1">
            <Button asChild variant={pathname === "/admin" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/admin/users") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Gestione Utenti
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/data-explorer") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/data-explorer">
                <Database className="mr-2 h-4 w-4" />
                Data Explorer
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/table-explorer") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/table-explorer">
                <Layers className="mr-2 h-4 w-4" />
                Table Explorer
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname?.includes("/debug-scadenze") ? "secondary" : "ghost"}
              className="w-full justify-start"
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
      <div className="px-4 py-2 mt-auto">
        <div className="space-y-1">
          <Button asChild variant={pathname === "/profile" ? "secondary" : "ghost"} className="w-full justify-start">
            <Link href="/profile">
              <Users className="mr-2 h-4 w-4" />
              Profilo
            </Link>
          </Button>
        </div>

        {/* Indicatore di stato connessione */}
        <div className="mt-4 px-2 py-1 text-xs text-muted-foreground flex items-center">
          {isOnline ? (
            <>
              <Wifi className="mr-1 h-3 w-3 text-green-500" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="mr-1 h-3 w-3 text-red-500" />
              Offline
            </>
          )}
        </div>

        {/* Info utente */}
        {user && <div className="mt-2 px-2 py-1 text-xs text-muted-foreground">{user.username || user.email}</div>}
      </div>
    </div>
  )
}
