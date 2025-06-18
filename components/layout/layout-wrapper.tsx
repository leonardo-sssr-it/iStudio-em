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
import { Suspense } from "react"

// Configurazione layout ottimizzata
interface LayoutConfig {
  sidebarCollapsible: boolean
  sidebarPosition: "left" | "right"
  fullWidth: boolean
}

const defaultLayoutConfig: LayoutConfig = {
  sidebarCollapsible: true,
  sidebarPosition: "left",
  fullWidth: false,
}

// Loading component per Suspense
function LayoutSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="h-16 bg-muted border-b" />
      <div className="flex flex-1">
        <div className="w-[240px] bg-muted border-r hidden md:block" />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
      <div className="h-16 bg-muted border-t" />
    </div>
  )
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
  const { isMobile } = useSidebarState()
  const pathname = usePathname()

  // Determina se mostrare la sidebar
  const showSidebar = themeLayoutChoice === "sidebar" && user

  // Determina se è una pagina dashboard
  const isDashboardPage = pathname.startsWith("/dashboard")

  // Determina se usare full width
  const useFullWidth = layoutConfig.fullWidth || pathname.includes("/admin") || pathname.includes("/data-explorer")

  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <Header />

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Solo su desktop quando necessaria */}
          {showSidebar && !isMobile && (
            <aside className="w-[240px] flex-shrink-0 border-r border-border bg-background">
              <Sidebar />
            </aside>
          )}

          {/* Sidebar Mobile - Gestita internamente dal componente Sidebar */}
          {showSidebar && isMobile && <Sidebar />}

          {/* Main Content */}
          <main
            className={cn("flex-1 min-w-0 overflow-y-auto", "transition-all duration-300 ease-in-out")}
            role="main"
            aria-label="Contenuto principale"
          >
            <div
              className={cn(
                "py-6 h-full",
                // Gestione responsive del padding
                useFullWidth
                  ? "w-full px-4 sm:px-6 lg:px-8"
                  : isDashboardPage
                    ? "w-full px-4 sm:px-6 lg:px-8"
                    : "container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl",
              )}
            >
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </Suspense>
  )
}
