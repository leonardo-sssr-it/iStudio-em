"use client"

import { useState, useEffect } from "react"
import { AuthWidget } from "@/components/auth-widget"
import { ImageGallery } from "@/components/image-gallery"
import { useAuth } from "@/lib/auth-provider"
import { useCustomTheme } from "@/contexts/theme-context"
import { BarChart, Database, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// Migliorare il rendering condizionale nella landing page
export default function Home() {
  const { user, isLoading } = useAuth()
  const { layout, isDarkMode } = useCustomTheme()
  const [mounted, setMounted] = useState(false)

  // Assicuriamoci che il componente sia montato solo lato client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determiniamo le classi del container in base al layout
  const containerClass = cn(
    layout === "fullWidth" ? "w-full" : "container mx-auto",
    "px-4 py-8 lg:py-12",
    // Correggiamo il padding quando c'è la sidebar
    layout === "withSidebar" && user ? "md:pl-8" : "md:px-8",
  )

  // Mostriamo un placeholder durante il caricamento per evitare flickering
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

  // Variante per l'animazione delle card
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  }

  // Utilizziamo una chiave per forzare il re-render completo quando cambia lo stato dell'utente
  return (
    <div className="min-h-[calc(100vh-8rem)]" key={user ? "logged-in" : "logged-out"}>
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
            <ImageGallery className="shadow-2xl rounded-xl overflow-hidden" />
          </div>
        </div>
      </div>

      {/* Features Section - Mostrata solo se l'utente NON è autenticato */}
      {!user && !isLoading && (
        <div className="bg-muted/30 dark:bg-muted/10 py-16 mt-8">
          <div className={layout === "fullWidth" ? "w-full px-4 md:px-8" : "container mx-auto px-4 md:px-8"}>
            <h2 className="text-3xl font-bold text-center mb-12">Cosa farà iStudio?</h2>

            {/* Grid di card con animazioni */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Database className="h-8 w-8 text-primary" />,
                  title: "Gestione Dati",
                  description: "Organizza e gestisci tutti i tuoi dati in un unico posto",
                  color: "from-blue-500/20 to-cyan-400/20",
                  darkColor: "dark:from-blue-500/30 dark:to-cyan-400/30",
                },
                {
                  icon: <Users className="h-8 w-8 text-primary" />,
                  title: "Collaborazione",
                  description: "Lavora in team con accessi e permessi personalizzati",
                  color: "from-purple-500/20 to-pink-400/20",
                  darkColor: "dark:from-purple-500/30 dark:to-pink-400/30",
                },
                {
                  icon: <BarChart className="h-8 w-8 text-primary" />,
                  title: "Analisi Dati",
                  description: "Visualizza e analizza i tuoi dati con grafici interattivi",
                  color: "from-green-500/20 to-emerald-400/20",
                  darkColor: "dark:from-green-500/30 dark:to-emerald-400/30",
                },
                {
                  icon: <Clock className="h-8 w-8 text-primary" />,
                  title: "Automazione",
                  description: "Automatizza i processi ripetitivi e risparmia tempo",
                  color: "from-amber-500/20 to-orange-400/20",
                  darkColor: "dark:from-amber-500/30 dark:to-orange-400/30",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "rounded-xl p-6 shadow-lg transition-all",
                    "bg-gradient-to-br",
                    feature.color,
                    feature.darkColor,
                    "border border-transparent",
                    "hover:border-primary/20 dark:hover:border-primary/30",
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 shadow-md">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
