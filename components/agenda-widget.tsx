"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react"
import { useAgendaItems } from "@/hooks/use-agenda-items"
import { useAuth } from "@/lib/auth-provider"
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

  console.log(`📅 AgendaWidget: Calculated date range for ${view}:`, {
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

  // Usa il hook con le date corrette
  const { items, isLoading, error } = useAgendaItems(startDate, endDate)

  console.log("📅 AgendaWidget: Render state:", {
    authLoading,
    hasUser: !!user,
    selectedDate: selectedDate.toISOString(),
    view,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    itemsCount: items?.length || 0,
    isLoading,
    error: error?.message,
  })

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
    console.log(`📅 AgendaWidget: Navigated ${direction} to:`, newDate.toISOString())
  }

  // Funzione per formattare la data del titolo
  const formatTitle = () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Europe/Rome",
    }

    switch (view) {
      case "daily":
        return selectedDate.toLocaleDateString("it-IT", {
          ...options,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      case "weekly":
        const weekStart = new Date(startDate)
        const weekEnd = new Date(endDate)
        return `${weekStart.toLocaleDateString("it-IT", { ...options, day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("it-IT", { ...options, day: "numeric", month: "short", year: "numeric" })}`
      case "monthly":
        return selectedDate.toLocaleDateString("it-IT", {
          ...options,
          year: "numeric",
          month: "long",
        })
      default:
        return ""
    }
  }

  // Funzione per filtrare gli elementi in base alla vista
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items.filter((item) => {
      if (!item.data_scadenza) return false

      const itemDate = new Date(item.data_scadenza)
      return itemDate >= startDate && itemDate <= endDate
    })
  }, [items, startDate, endDate])

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
            <p className="text-muted-foreground mb-4">Accesso richiesto per visualizzare l'agenda</p>
            <Button asChild>
              <Link href="/login">Accedi</Link>
            </Button>
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("daily")}
              className={view === "daily" ? "bg-primary text-primary-foreground" : ""}
            >
              Giorno
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("weekly")}
              className={view === "weekly" ? "bg-primary text-primary-foreground" : ""}
            >
              Settimana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("monthly")}
              className={view === "monthly" ? "bg-primary text-primary-foreground" : ""}
            >
              Mese
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">{formatTitle()}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}>
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
            <p className="text-destructive mb-2">Errore nel caricamento dell'agenda</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nessun elemento in agenda per questo periodo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{item.titolo || "Senza titolo"}</h4>
                    {item.tipo && (
                      <Badge variant="secondary" className="text-xs">
                        {item.tipo}
                      </Badge>
                    )}
                  </div>
                  {item.descrizione && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.descrizione}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {item.data_scadenza && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.data_scadenza).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    {item.luogo && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.luogo}
                      </div>
                    )}
                    {item.assegnato_a && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.assegnato_a}
                      </div>
                    )}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/agenda/${item.id}`}>Dettagli</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
