"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSafeCustomTheme } from "@/contexts/theme-context"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { usePathname } from "next/navigation"

// Simula la lettura delle configurazioni dal DB
interface LayoutConfig {
  sidebarCollapsible: boolean
  sidebarPosition: "left" | "right"
}

const defaultLayoutConfig: LayoutConfig = {
  sidebarCollapsible: true,
  sidebarPosition: "left",
}

export function LayoutWrapper({
  children,
  layoutConfig = defaultLayoutConfig,
}: {
  children: React.ReactNode
  layoutConfig?: LayoutConfig
}) {
  const { layout: themeLayoutChoice } = useSafeCustomTheme()
  const { user } = useAuth()
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebarState()

  const showSidebar = themeLayoutChoice === "sidebar" && user

  const pathname = usePathname()
  const isDashboardPage = pathname.startsWith("/dashboard")

  const actualIsCollapsed = layoutConfig.sidebarCollapsible ? isCollapsed : false
  const sidebarWidth = actualIsCollapsed ? 64 : 256

  const sidebarComponent =
    showSidebar && !isMobile ? (
      <motion.div
        key="sidebar-desktop"
        layout="position"
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: sidebarWidth }}
        exit={{ opacity: 0, width: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "h-full flex-shrink-0 bg-background border-e dark:border-slate-700", // Aggiunto sfondo e bordo
          layoutConfig.sidebarPosition === "right" && "border-s dark:border-slate-700 border-e-0",
        )}
      >
        <Sidebar />
      </motion.div>
    ) : null

  const mobileSidebarComponent =
    showSidebar && isMobile ? (
      <motion.div
        key="sidebar-mobile"
        initial={{ x: layoutConfig.sidebarPosition === "left" ? -sidebarWidth : sidebarWidth, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: layoutConfig.sidebarPosition === "left" ? -sidebarWidth : sidebarWidth, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed inset-y-0 z-50 shadow-2xl bg-background",
          layoutConfig.sidebarPosition === "left" ? "left-0" : "right-0",
        )}
        style={{ width: sidebarWidth }}
      >
        <Sidebar />
      </motion.div>
    ) : null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="w-full">
        {" "}
        {/* Header wrapper per larghezza piena */}
        <Header />
      </div>

      {/* Corpo Centrale */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {" "}
        {/* Aggiunto overflow-hidden */}
        {/* Sidebar Mobile (Overlay) */}
        <AnimatePresence>
          {showSidebar && !actualIsCollapsed && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => layoutConfig.sidebarCollapsible && setIsCollapsed(true)}
            />
          )}
        </AnimatePresence>
        {mobileSidebarComponent}
        {/* Sidebar Desktop */}
        {layoutConfig.sidebarPosition === "left" && sidebarComponent}
        {/* Contenuto Principale */}
        <motion.main
          key="main-content"
          className="flex-1 min-w-0" // Aggiunto overflow-y-auto
          layout
          transition={{ duration: 0.3, type: "spring", bounce: 0.1 }}
        >
          <div
            className={cn(
              "py-6 h-full",
              isDashboardPage ? "w-full px-4 sm:px-6 lg:px-8" : "container mx-auto px-4 sm:px-6 lg:px-8 max-w-full",
            )}
          >
            {children}
          </div>
        </motion.main>
        {/* Sidebar Desktop (se a destra) */}
        {layoutConfig.sidebarPosition === "right" && sidebarComponent}
      </div>

      {/* Footer */}
      <div className="w-full">
        {" "}
        {/* Footer wrapper per larghezza piena */}
        <Footer />
      </div>
    </div>
  )
}
