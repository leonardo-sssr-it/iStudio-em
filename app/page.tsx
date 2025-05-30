"use client"

import { useState, useEffect } from "react"
import { AuthWidget } from "@/components/auth-widget"
import { ImageGallery } from "@/components/image-gallery"
import { useAuth } from "@/lib/auth-provider"
import { useCustomTheme } from "@/contexts/theme-context"
import { BarChart, Database, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Home() {
  const { user, isLoading } = useAuth()
  const { layout } = useCustomTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const containerClass = cn(
    layout === "fullWidth" ? "w-full" : "container mx-auto",
    "px-4 py-8 lg:py-12",
    layout === "withSidebar" && user ? "md:pl-8" : "md:px-8",
  )

  if (!mounted) {
    return (
      <div className={containerClass}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          <div className="flex flex-col space-y-8">
            <div className="text-center lg:text-left">
              <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-4"></div>
              <div className="h-6 w-1/2 bg-muted rounded animate-pulse mb-8"></div>
            </div>
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="h-80 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-[400px] lg:h-[600px] order-first lg:order-last">
            <div className="h-full bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <div className={containerClass}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Left Column */}
          <div className="flex flex-col space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Benvenuto in <span className="text-primary">iStudio</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">Il sistema di gestione integrato per il tuo ufficio</p>
            </div>
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <AuthWidget />
            </div>
          </div>

          {/* Right Column */}
          <div className="h-[400px] lg:h-[600px] order-first lg:order-last">
            <ImageGallery className="shadow-2xl rounded-xl overflow-hidden" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      {!user && !isLoading && (
        <div className="bg-muted/30 dark:bg-muted/10 py-16 mt-8">
          <div className={layout === "fullWidth" ? "w-full px-4 md:px-8" : "container mx-auto px-4 md:px-8"}>
            <h2 className="text-3xl font-bold text-center mb-12">Perché scegliere iStudio?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="rounded-xl p-6 shadow-lg transition-all bg-gradient-to-br from-blue-500/20 to-cyan-400/20 dark:from-blue-500/30 dark:to-cyan-400/30 border border-transparent hover:border-primary/20 dark:hover:border-primary/30">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-md">
                  <Database className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gestione Dati</h3>
                <p className="text-muted-foreground">Organizza e gestisci tutti i tuoi dati in un unico posto</p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl p-6 shadow-lg transition-all bg-gradient-to-br from-purple-500/20 to-pink-400/20 dark:from-purple-500/30 dark:to-pink-400/30 border border-transparent hover:border-primary/20 dark:hover:border-primary/30">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-md">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Collaborazione</h3>
                <p className="text-muted-foreground">Lavora in team con accessi e permessi personalizzati</p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl p-6 shadow-lg transition-all bg-gradient-to-br from-green-500/20 to-emerald-400/20 dark:from-green-500/30 dark:to-emerald-400/30 border border-transparent hover:border-primary/20 dark:hover:border-primary/30">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-md">
                  <BarChart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analisi Dati</h3>
                <p className="text-muted-foreground">Visualizza e analizza i tuoi dati con grafici interattivi</p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl p-6 shadow-lg transition-all bg-gradient-to-br from-amber-500/20 to-orange-400/20 dark:from-amber-500/30 dark:to-orange-400/30 border border-transparent hover:border-primary/20 dark:hover:border-primary/30">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-md">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Automazione</h3>
                <p className="text-muted-foreground">Automatizza i processi ripetitivi e risparmia tempo</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
