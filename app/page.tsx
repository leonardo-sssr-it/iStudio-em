"use client"

import { useState, useEffect } from "react"
import { AuthWidget } from "@/components/auth-widget"
import { ImageGallery } from "@/components/image-gallery"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { useCustomTheme } from "@/contexts/theme-context"
import { Sparkles, Zap, Shield, BarChart, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function Home() {
  const { user, isLoading } = useAuth()
  const { layout, isDarkMode } = useCustomTheme()
  const [mounted, setMounted] = useState(false)

  // Assicuriamoci che il componente sia montato solo lato client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determiniamo le classi del container in base al layout
  const containerClass = cn(layout === "fullWidth" ? "w-full" : "container mx-auto", "px-4 py-8 lg:py-12")

  if (!mounted) {
    return null // Evita il rendering durante l'SSR
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section with Two Columns */}
      <div className={containerClass}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Left Column - Auth Widget and Features */}
          <div className="flex flex-col space-y-8">
            {/* Welcome Text */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Benvenuto in <span className="text-primary">iStudio</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">Il sistema di gestione integrato per il tuo ufficio</p>
            </div>

            {/* Auth Widget */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <AuthWidget />
            </div>
          </div>

          {/* Right Column - Image Gallery */}
          <div className="h-[400px] lg:h-[600px] order-first lg:order-last">
            <ImageGallery className="shadow-2xl" />
          </div>
        </div>
      </div>

      {/* Additional Features Section - Only on larger screens */}
      <div className="hidden lg:block bg-muted/30 py-16">
        <div className={layout === "fullWidth" ? "w-full px-4" : "container mx-auto px-4"}>
          <h2 className="text-3xl font-bold text-center mb-12">Perché scegliere iStudio?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestione Completa</h3>
              <p className="text-muted-foreground">
                Tutti gli strumenti di cui hai bisogno in un'unica piattaforma integrata
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automazione Smart</h3>
              <p className="text-muted-foreground">
                Automatizza i processi ripetitivi e concentrati su ciò che conta davvero
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report Avanzati</h3>
              <p className="text-muted-foreground">Analizza i dati in tempo reale con dashboard personalizzabili</p>
            </Card>
          </div>
          {/* Features Grid - Hidden on mobile when logged in */}
          <div className={`grid grid-cols-2 gap-4 ${user ? "hidden lg:grid" : ""}`}>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Innovativo</h3>
              <p className="text-sm text-muted-foreground">Tecnologie all'avanguardia</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Zap className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Veloce</h3>
              <p className="text-sm text-muted-foreground">Performance ottimizzate</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Sicuro</h3>
              <p className="text-sm text-muted-foreground">Protezione avanzata</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <BarChart className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">Insights dettagliati</p>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
