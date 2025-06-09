import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { ThemeProvider } from "@/contexts/theme-context"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { SidebarStateProvider } from "@/contexts/sidebar-state-context"
import ClientLayout from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "iStudio v0.5.2 beta",
  description: "Supabase Table Explorer with Advanced Features",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <NextThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <SupabaseProvider>
            <AuthProvider>
              <ThemeProvider>
                <SidebarProvider>
                  <SidebarStateProvider>
                    <ClientLayout>{children}</ClientLayout>
                  </SidebarStateProvider>
                </SidebarProvider>
              </ThemeProvider>
            </AuthProvider>
          </SupabaseProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}
