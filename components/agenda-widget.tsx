"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, FileText, User } from "lucide-react"
import { useAgendaItems } from "@/hooks/use-agenda-items"
import { useAuth } from "@/lib/auth-provider"
import { formatDateIT } from "@/lib/date-utils"
import Link from "next/link"

type ViewType = "daily" | "weekly" | "monthly"

interface AgendaWidgetProps {
  className?: string
}

// Funzione per calcolare le date di inizio e fine in base alla vista
function calculateDateRange(selectedDate: Date, view: ViewType): { startDate: Date; endDate: Date } {
  const start = new Date(selectedDate)
  const end = new Date(selectedDate)

  switch (view) {
    case "daily":
      // Per la vista giornaliera: stesso giorno
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break

    case "weekly":
      // Per la vista settimanale: dall'inizio della settimana (lunedì) alla fine (domenica)
      const dayOfWeek = start.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Domenica = 0, quindi 6 giorni indietro

      start.setDate(start.getDate() - daysToMonday)
      start.setHours(0, 0, 0, 0)

      end.setDate(start.getDate() + 6) // 7 giorni totali
      end.setHours(23, 59, 59, 999)
      break

    case "monthly":
      // Per la vista mensile: dal primo all'ultimo giorno del mese
      start.setDate(1)
      start.setHours(0, 0, 0, 0)

      end.setMonth(end.getMonth() + 1, 0) // Ultimo giorno del mese
      end.setHours(23, 59, 59, 999)
      break
  }

  console.log("📅 AgendaWidget: Date range calculated", {
    view,
    selectedDate: selectedDate.toISOString(),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  })

  return { startDate: start, endDate: end }
}

export function AgendaWidget({ className }: AgendaWidgetProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<ViewType>("daily")

  // Calcola le date di inizio e fine in base alla vista selezionata
  const { startDate, endDate } = useMemo(() => {
    return calculateDateRange(selectedDate, view)
  }, [selectedDate, view])

  // Usa il hook con le date calcolate correttamente
  const { items, isLoading, error } = useAgendaItems(startDate, endDate)

  // Funzioni per la navigazione delle date
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)

    switch (view) {
      case "daily":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
        break
      case "weekly":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
        break
      case "monthly":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
        break
    }

    setSelectedDate(newDate)
  }

  // Funzione per ottenere il titolo della vista corrente
  const getViewTitle = () => {
    switch (view) {
      case "daily":
        return formatDateIT(selectedDate)
      case "weekly":
        const weekStart = new Date(selectedDate)
        const dayOfWeek = weekStart.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        weekStart.setDate(weekStart.getDate() - daysToMonday)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        return `${formatDateIT(weekStart)} - ${formatDateIT(weekEnd)}`
      case "monthly":
        return selectedDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
      default:
        return ""
    }
  }

  // Filtra gli elementi in base alla vista
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items.filter((item) => {
      if (!item.data_scadenza) return false

      const itemDate = new Date(item.data_scadenza)

      switch (view) {
        case "daily":
          return itemDate.toDateString() === selectedDate.toDateString()
        case "weekly":
          return itemDate >= startDate && itemDate <= endDate
        case "monthly":
          return (
            itemDate.getMonth() === selectedDate.getMonth() && itemDate.getFullYear() === selectedDate.getFullYear()
          )
        default:
          return true
      }
    })
  }, [items, view, selectedDate, startDate, endDate])

  // Verifica se l'utente è autenticato
  if (authLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Accesso richiesto per visualizzare l'agenda</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda
          </CardTitle>

          {/* Controlli vista */}
          <div className="flex gap-1">
            <Button variant={view === "daily" ? "default" : "outline"} size="sm" onClick={() => setView("daily")}>
              Giorno
            </Button>
            <Button variant={view === "weekly" ? "default" : "outline"} size="sm" onClick={() => setView("weekly")}>
              Settimana
            </Button>
            <Button variant={view === "monthly" ? "default" : "outline"} size="sm" onClick={() => setView("monthly")}>
              Mese
            </Button>
          </div>
        </div>

        {/* Navigazione date */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <CardDescription className="font-medium">{getViewTitle()}</CardDescription>

          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Errore nel caricamento: {error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun elemento in agenda per questo periodo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={`${item.tipo}-${item.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {item.tipo === "note" ? (
                    <FileText className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Link
                        href={`/${item.tipo}/${item.id}`}
                        className="font-medium text-sm hover:underline line-clamp-1"
                      >
                        {item.titolo || "Senza titolo"}
                      </Link>

                      {item.data_scadenza && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateIT(item.data_scadenza)}
                        </div>
                      )}
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      {item.tipo === "note" ? "Nota" : "Pagina"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
