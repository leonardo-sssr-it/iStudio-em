"use client"

import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Database, List, Filter, LogOut } from "lucide-react"
import Link from "next/link"
import { memo, useRef, useEffect, useState } from "react"

// Componente card memoizzato per evitare re-render inutili
const AdminCard = memo(
  ({
    href,
    icon: Icon,
    title,
    description,
    isVisible,
  }: {
    href: string
    icon: any
    title: string
    description: string
    isVisible: boolean
  }) => {
    return (
      <Link href={href} prefetch={true}>
        <Card
          className={`h-full hover:border-primary transition-all duration-300 cursor-pointer transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-center text-center h-full">
            <Icon className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground flex-grow">{description}</p>
          </CardContent>
        </Card>
      </Link>
    )
  },
)

AdminCard.displayName = "AdminCard"

// Hook personalizzato per Intersection Observer
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Disconnetti l'observer dopo la prima visualizzazione
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return [ref, isVisible] as const
}

// Componente principale memoizzato
const AdminDashboardContent = memo(() => {
  const { user, logout } = useAuth()
  const [cardsRef, cardsVisible] = useIntersectionObserver()
  const [card1Visible, setCard1Visible] = useState(false)
  const [card2Visible, setCard2Visible] = useState(false)
  const [card3Visible, setCard3Visible] = useState(false)

  // Animazione sequenziale delle card
  useEffect(() => {
    if (cardsVisible) {
      const timer1 = setTimeout(() => setCard1Visible(true), 100)
      const timer2 = setTimeout(() => setCard2Visible(true), 200)
      const timer3 = setTimeout(() => setCard3Visible(true), 300)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [cardsVisible])

  const adminCards = [
    {
      href: "/table-explorer",
      icon: Database,
      title: "Esploratore Tabelle",
      description: "Esplora tabelle, colonne e dati. Crea backup del database.",
      isVisible: card1Visible,
    },
    {
      href: "/user-filter",
      icon: Filter,
      title: "Filtro Dati Utente",
      description: "Filtra i dati delle tabelle in base all'utente selezionato.",
      isVisible: card2Visible,
    },
    {
      href: "/show-list",
      icon: List,
      title: "Visualizza Liste",
      description: "Visualizza liste di dati con campi predefiniti per ogni tabella.",
      isVisible: card3Visible,
    },
  ]

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header con responsive spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">Dashboard Amministratore</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Link href="/dashboard" prefetch={true}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center gap-2">
              <User className="h-4 w-4" />
              Dashboard utente
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Card di benvenuto */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Benvenuto, {user?.nome || user?.username}!</CardTitle>
          <CardDescription>
            Accesso effettuato come amministratore. Hai accesso completo a tutte le funzionalità del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Grid responsive migliorata */}
          <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {adminCards.map((card, index) => (
              <AdminCard
                key={card.href}
                href={card.href}
                icon={card.icon}
                title={card.title}
                description={card.description}
                isVisible={card.isVisible}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

AdminDashboardContent.displayName = "AdminDashboardContent"

// Componente principale esportato
export default function AdminDashboardPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
