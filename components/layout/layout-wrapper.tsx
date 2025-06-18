"use client"

import type React from "react"
import { useSafeCustomTheme } from "@/contexts/theme-context"
import { useSidebarState } from "@/contexts/sidebar-state-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { usePathname } from "next/navigation"

// Configurazione layout
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Solo su desktop */}
        {showSidebar && !isMobile && (
          <div className="w-[240px] flex-shrink-0">
            <Sidebar />
          </div>
        )}

        {/* Sidebar Mobile - Renderizzata sempre ma gestita internamente */}
        {showSidebar && isMobile && <Sidebar />}

        {/* Main Content */}
        <main className={cn("flex-1 min-w-0 overflow-y-auto", "transition-all duration-300 ease-in-out")}>
          <div
            className={cn(
              "py-6 h-full",
              isDashboardPage ? "w-full px-4 sm:px-6 lg:px-8" : "container mx-auto px-4 sm:px-6 lg:px-8 max-w-full",
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
