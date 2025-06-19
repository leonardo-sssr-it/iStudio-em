"use client"

import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { ThemeProvider } from "@/contexts/theme-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { SidebarStateProvider } from "@/contexts/sidebar-state-context"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useIsMobile } from "@/hooks/use-is-mobile"

const inter = Inter({ subsets: ["latin"] })

function MobileRedirectHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()

  useEffect(() => {
    // Only redirect if we're on desktop routes and user is on mobile
    if (isMobile && pathname && !pathname.startsWith("/dashboard-mobile")) {
      // List of routes that should redirect to mobile version
      const desktopRoutes = ["/dashboard", "/dashboard-u", "/dashboard-utente"]

      if (desktopRoutes.includes(pathname)) {
        console.log("Mobile detected, redirecting to mobile dashboard")
        router.push("/dashboard-mobile")
      }
    }
    // Also handle reverse case: if user is on desktop but accessing mobile routes
    else if (!isMobile && pathname && pathname.startsWith("/dashboard-mobile")) {
      console.log("Desktop detected, redirecting to desktop dashboard")
      router.push("/dashboard")
    }
  }, [isMobile, pathname, router])

  return <>{children}</>
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <AuthProvider>
            <ThemeProvider>
              <SidebarStateProvider>
                <SidebarProvider>
                  <MobileRedirectHandler>
                    <LayoutWrapper>{children}</LayoutWrapper>
                    <Toaster />
                  </MobileRedirectHandler>
                </SidebarProvider>
              </SidebarStateProvider>
            </ThemeProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
