"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-provider"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import { cn } from "@/lib/utils"
import {
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
  Smartphone,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user, isAdmin } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isCollapsed, toggleCollapsed, isMobile } = useSidebarState()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    ...(user
      ? [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          {
            href: "/dashboard-u",
            label: "Dashboard Utente",
            icon: LayoutGrid,
          },
          {
            href: "/dashboard-mobile",
            label: "Dashboard Mobile",
            icon: Smartphone,
          },
          {
            href: "/dashboard-utente",
            label: "Dashboard Utente",
            icon: LayoutGrid,
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
        { href: "/data-explorer?table=pagine", label: "Pagine", icon: FileText },
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

  // Componente per renderizzare un link con tooltip se collassato
  const SidebarLink = ({ item, active }: { item: any; active: boolean }) => {
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm" // Usa text-primary-foreground per garantire contrasto
            : "text-foreground hover:bg-accent hover:text-accent-foreground",
          isCollapsed ? "justify-center" : "space-x-3",
        )}
        aria-current={active ? "page" : undefined}
      >
        <motion.div>
          <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "")} />
        </motion.div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return linkContent
  }

  if (!isMounted) return null

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn("h-screen border-r bg-background flex-shrink-0 relative", className)}
    >
      {/* Indicatore visivo dello stato */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary to-primary/50 transition-all duration-300",
          isCollapsed ? "opacity-50" : "opacity-100",
        )}
      />

      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">i</span>
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-xl"
              >
                Studio
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="h-8 w-8 hover:bg-accent/50">
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </motion.div>
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <motion.div className="px-3 py-4" layout transition={{ duration: 0.3 }}>
          <nav className="space-y-4">
            {/* Menu principale */}
            <motion.div className="space-y-1" layout>
              {menuItems.map((item, index) => {
                const active = isLinkActive(item.href)
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SidebarLink item={item} active={active} />
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Sezione Dati */}
            {dataItems.length > 0 && (
              <motion.div className="pt-2" layout>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      Dati
                    </motion.h3>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  {/* Link all'esploratore dati generale */}
                  <SidebarLink
                    item={{
                      href: "/data-explorer",
                      label: "Tutti i Dati",
                      icon: FolderKanban,
                    }}
                    active={pathname === "/data-explorer" && !searchParams.get("table")}
                  />

                  {/* Link alle tabelle specifiche */}
                  {dataItems.map((item, index) => {
                    const active = isLinkActive(item.href)
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (menuItems.length + index) * 0.1 }}
                      >
                        <SidebarLink item={item} active={active} />
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Sezione Admin */}
            {adminItems.length > 0 && (
              <motion.div className="pt-2" layout>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      Admin
                    </motion.h3>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  {adminItems.map((item, index) => {
                    const active = isLinkActive(item.href)
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (menuItems.length + dataItems.length + index) * 0.1 }}
                      >
                        <SidebarLink item={item} active={active} />
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </nav>
        </motion.div>
      </ScrollArea>
    </motion.div>
  )
}
