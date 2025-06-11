"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar } from "@/components/layout/sidebar"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Pages that should not show header/footer/sidebar
  const isAuthPage = pathname === "/"
  const isFullScreenPage = ["/admin"].includes(pathname)

  if (isAuthPage) {
    return <>{children}</>
  }

  if (isFullScreenPage) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <LayoutWrapper>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Footer />
    </LayoutWrapper>
  )
}
