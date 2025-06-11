import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/lib/auth-provider"
import { SupabaseProvider } from "@/lib/supabase-provider"
import { Toaster } from "@/components/ui/toaster"
import ClientLayout from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "iStudio - Dashboard Intelligente",
  description: "Dashboard intelligente per la gestione dei dati e delle attività",
  keywords: ["dashboard", "gestione", "dati", "attività", "intelligente"],
  authors: [{ name: "iStudio Team" }],
  viewport: "width=device-width, initial-scale=1",
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
        <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <SupabaseProvider>
            <AuthProvider>
              <ThemeProvider>
                <ClientLayout>{children}</ClientLayout>
                <Toaster />
              </ThemeProvider>
            </AuthProvider>
          </SupabaseProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}
