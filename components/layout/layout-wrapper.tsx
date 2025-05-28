"use client"

import type React from "react"

import { useCustomTheme } from "@/contexts/theme-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { layout } = useCustomTheme()

  // Determiniamo le classi per il contenuto principale in base al layout
  const mainClass = cn("flex-1", layout === "sidebar" && "lg:ml-64")

  return (
    <div className="flex flex-col min-h-screen">
      {layout === "sidebar" && <Sidebar />}
      <Header />
      <main className={mainClass}>{children}</main>
      <Footer />
    </div>
  )
}
