"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import { useIsMobile } from "@/hooks/use-is-mobile"
import {
  Menu,
  Home,
  Database,
  FileText,
  Users,
  Settings,
  BarChart3,
  Calendar,
  BookOpen,
  Layers,
  Search,
  Shield,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()
  const { isCollapsed, setIsCollapsed } = useSidebarState()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !isCollapsed) {
      setIsCollapsed(true)
    }
  }, [isMobile, isCollapsed, setIsCollapsed])

  const navigationItems = [
    {
      title: "Dashboard",
      items: [
        { name: "Home", href: "/", icon: Home },
        { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
        { name: "Dashboard Utente", href: "/dashboard-utente", icon: User },
      ],
    },
    {
      title: "Gestione Dati",
      items: [
        { name: "Data Explorer", href: "/data-explorer", icon: Database },
        { name: "Table Explorer", href: "/table-explorer", icon: Layers },
        { name: "Show List", href: "/show-list", icon: Search },
      ],
    },
    {
      title: "Contenuti",
      items: [
        { name: "Note", href: "/note", icon: FileText },
        { name: "Pagine", href: "/pagine", icon: BookOpen },
        { name: "Agenda", href: "/dashboard-mobile/agenda", icon: Calendar },
      ],
    },
  ]

  const adminItems = [
    {
      title: "Amministrazione",
      items: [
        { name: "Admin Panel", href: "/admin", icon: Shield },
        { name: "Gestione Utenti", href: "/admin/users", icon: Users },
        { name: "Configurazione", href: "/admin/config", icon: Settings },
      ],
    },
  ]

  const SidebarContent = () => (
    <div className="sidebar-container">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className={cn("font-bold text-lg", isCollapsed && "hidden")}>iStudio</h2>
        {!isMobile && (
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-2">
          {navigationItems.map((section) => (
            <div key={section.title}>
              {!isCollapsed && <div className="sidebar-section-title">{section.title}</div>}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn("sidebar-link", isActive && "active")}
                      onClick={() => isMobile && setIsOpen(false)}
                    >
                      <Icon />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {isAdmin &&
            adminItems.map((section) => (
              <div key={section.title}>
                {!isCollapsed && <div className="sidebar-section-title">{section.title}</div>}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn("sidebar-link", isActive && "active")}
                        onClick={() => isMobile && setIsOpen(false)}
                      >
                        <Icon />
                        {!isCollapsed && <span>{item.name}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>

      {user && (
        <div className="border-t p-3">
          <div className="space-y-1">
            <Link
              href="/profile"
              className={cn("sidebar-link", pathname === "/profile" && "active")}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <User />
              {!isCollapsed && <span>Profilo</span>}
            </Link>
            <button
              onClick={() => {
                logout()
                isMobile && setIsOpen(false)
              }}
              className="sidebar-link w-full text-left"
            >
              <LogOut />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="fixed top-4 left-4 z-50 bg-background border shadow-md">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-background border-r z-50">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <SidebarContent />
    </div>
  )
}
