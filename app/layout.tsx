import type React from "react"
import "@/app/globals.css"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { SidebarStateProvider } from "@/contexts/sidebar-state-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <NextThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SupabaseProvider>
            <AuthProvider> {/* AuthProvider is here */}
              <SidebarProvider>
                <SidebarStateProvider>
                  <ThemeProvider>
                    <LayoutWrapper>{children}</LayoutWrapper>
                    <Toaster />
                  </ThemeProvider>
                </SidebarStateProvider>
              </SidebarProvider>
            </AuthProvider>
          </SupabaseProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: "v0.dev",
}
