"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
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

  // Gestione responsive ottimizzata
  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    setIsMounted(true)
    checkIfMobile()

    // Throttled resize handler per performance
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkIfMobile, 100)
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [checkIfMobile])

  // Prevenire hydration mismatch
  if (!isMounted) {
    return (
      <div className={cn("pb-12 w-[240px] flex-shrink-0 bg-background border-r border-border", className)}>
        <div className="animate-pulse p-4">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Versione mobile della sidebar
  if (isMobile) {
    return (
      <>
        {/* Trigger button per mobile */}
        <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden fixed left-4 top-3 z-50 bg-background border-border shadow-md"
              aria-label="Toggle Menu"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] p-0 bg-background border-r border-border z-50"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SidebarContent pathname={pathname} user={user} isAdmin={isAdmin} isOnline={isOnline} isMobile={true} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Versione desktop della sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-[240px] bg-background border-r border-border z-40",
        "transition-transform duration-300 ease-in-out",
        "flex flex-col",
        className,
      )}
      {...props}
      role="navigation"
      aria-label="Main navigation"
    >
      <SidebarContent pathname={pathname} user={user} isAdmin={isAdmin} isOnline={isOnline} isMobile={false} />
    </aside>
  )
}

// Contenuto della sidebar ottimizzato
function SidebarContent({
  pathname,
  user,
  isAdmin,
  isOnline,
  isMobile = false,
}: {
  pathname: string
  user: any
  isAdmin: boolean
  isOnline: boolean
  isMobile?: boolean
}) {
  const searchParams = useSearchParams()

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          iStudio
          <span className="text-xs text-muted-foreground ml-2">v0.4</span>
        </h2>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Dashboard Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Dashboard</h3>
              <nav className="space-y-1" role="navigation">
                <SidebarButton
                  href="/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  isActive={pathname === "/dashboard"}
                />
                <SidebarButton
                  href="/dashboard-u"
                  icon={LayoutDashboard}
                  label="Dashboard U"
                  isActive={pathname === "/dashboard-u"}
                />
                <SidebarButton
                  href="/dashboard-utente"
                  icon={LayoutDashboard}
                  label="Dashboard Utente"
                  isActive={pathname === "/dashboard-utente"}
                />
                <SidebarButton
                  href="/dashboard-mobile"
                  icon={LayoutDashboard}
                  label="Dashboard Mobile"
                  isActive={pathname === "/dashboard-mobile"}
                />
              </nav>
            </div>

            {/* Management Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Gestione</h3>
              <nav className="space-y-1" role="navigation">
                <SidebarButton href="/pagine" icon={FileText} label="Pagine" isActive={pathname?.includes("/pagine")} />
                <SidebarButton href="/note" icon={StickyNote} label="Note" isActive={pathname?.includes("/note")} />
                <SidebarButton
                  href="/data-explorer?table=appuntamenti"
                  icon={Calendar}
                  label="Appuntamenti"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "appuntamenti"}
                />
                <SidebarButton
                  href="/data-explorer?table=attivita"
                  icon={ClipboardList}
                  label="Attività"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "attivita"}
                />
                <SidebarButton
                  href="/data-explorer?table=scadenze"
                  icon={Clock}
                  label="Scadenze"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "scadenze"}
                />
                <SidebarButton
                  href="/data-explorer?table=todolist"
                  icon={CheckSquare}
                  label="To-Do List"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "todolist"}
                />
                <SidebarButton
                  href="/data-explorer?table=progetti"
                  icon={BarChart3}
                  label="Progetti"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "progetti"}
                />
                <SidebarButton
                  href="/data-explorer?table=clienti"
                  icon={Users}
                  label="Clienti"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "clienti"}
                />
                <SidebarButton
                  href="/data-explorer?table=pagine"
                  icon={FileText}
                  label="Pagine (Data)"
                  isActive={pathname?.includes("/data-explorer") && searchParams?.get("table") === "pagine"}
                />
              </nav>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Amministrazione</h3>
                <nav className="space-y-1" role="navigation">
                  <SidebarButton href="/admin" icon={Settings} label="Admin Panel" isActive={pathname === "/admin"} />
                  <SidebarButton
                    href="/admin/users"
                    icon={Users}
                    label="Gestione Utenti"
                    isActive={pathname?.includes("/admin/users")}
                  />
                  <SidebarButton
                    href="/data-explorer"
                    icon={Database}
                    label="Data Explorer"
                    isActive={pathname?.includes("/data-explorer") && !searchParams?.get("table")}
                  />
                  <SidebarButton
                    href="/table-explorer"
                    icon={Layers}
                    label="Table Explorer"
                    isActive={pathname?.includes("/table-explorer")}
                  />
                  <SidebarButton
                    href="/debug-scadenze"
                    icon={AlertTriangle}
                    label="Debug Scadenze"
                    isActive={pathname?.includes("/debug-scadenze")}
                  />
                </nav>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <nav className="space-y-1 mb-4" role="navigation">
          <SidebarButton href="/profile" icon={Users} label="Profilo" isActive={pathname === "/profile"} />
        </nav>

        {/* Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center px-2 py-1 text-xs text-muted-foreground">
            {isOnline ? (
              <>
                <Wifi className="mr-2 h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-3 w-3 text-red-500 flex-shrink-0" />
                <span>Offline</span>
              </>
            )}
          </div>

          {user && (
            <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user.username || user.email}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Button ottimizzato per la sidebar
function SidebarButton({
  href,
  icon: Icon,
  label,
  isActive = false,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive?: boolean
}) {
  return (
    <Button
      asChild
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-9 px-3",
        "text-sm font-normal",
        "transition-colors duration-200",
        isActive && "bg-secondary text-secondary-foreground font-medium",
      )}
    >
      <Link href={href} className="flex items-center">
        <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    </Button>
  )
}
