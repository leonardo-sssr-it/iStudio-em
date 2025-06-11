import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { ThemeProvider } from "@/contexts/theme-context"
import { SidebarStateProvider } from "@/contexts/sidebar-state-context"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "iStudio - Gestione Dati Integrata",
  description: "Piattaforma completa per la gestione di dati, clienti, progetti e attività",
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
        <ThemeProvider>
          <SupabaseProvider>
            <AuthProvider>
              <SidebarStateProvider>
                <ClientLayout>{children}</ClientLayout>
                <Toaster />
              </SidebarStateProvider>
            </AuthProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
