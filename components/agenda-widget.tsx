"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Plus,
  CalendarDays,
  List,
  Grid3X3,
} from "lucide-react"
import { useAgendaItems } from "@/hooks/use-agenda-items"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"

interface AgendaItem {
  id: string
  titolo: string
  descrizione?: string
  data_inizio: string
  data_fine?: string
  ora_inizio?: string
  ora_fine?: string
  luogo?: string
  partecipanti?: string
  tipo: "appuntamento" | "attivita" | "todolist" | "scadenza" | "progetto"
  stato?: string
  priorita?: "bassa" | "media" | "alta"
  colore?: string
}

interface AgendaWidgetProps {
  mode?: "desktop" | "mobile"
  className?: string
}

// Costanti per localStorage
const AGENDA_VIEW_PREFERENCE_KEY = "agenda-view-preference"

// Funzioni per gestire le preferenze
const saveViewPreference = (view: "daily" | "weekly" | "monthly") => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(AGENDA_VIEW_PREFERENCE_KEY, view)
      console.log(`Agenda view preference saved: ${view}`)
    }
  } catch (error) {
    console.error("Error saving agenda view preference:", error)
  }
}

const getViewPreference = (): "daily" | "weekly" | "monthly" => {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(AGENDA_VIEW_PREFERENCE_KEY)
      if (saved && ["daily", "weekly", "monthly"].includes(saved)) {
        console.log(`Agenda view preference loaded: ${saved}`)
        return saved as "daily" | "weekly" | "monthly"
      }
    }
  } catch (error) {
    console.error("Error loading agenda view preference:", error)
  }
  return "daily" // Default
}

// Componente per il menu di creazione nuovi elementi
const NewItemMenu = ({ selectedDate }: { selectedDate: Date }) => {
  const dateParam = format(selectedDate, "yyyy-MM-dd")

  const menuItems = [
    {
      type: "appuntamento",
      label: "Appuntamento",
      table: "appuntamenti",
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      type: "attivita",
      label: "Attività",
      table: "attivita",
      icon: List,
      color: "bg-green-500",
    },
    {
      type: "todolist",
      label: "Todo",
      table: "todolist",
      icon: Grid3X3,
      color: "bg-yellow-500",
    },
    {
      type: "scadenza",
      label: "Scadenza",
      table: "scadenze",
      icon: Clock,
      color: "bg-red-500",
    },
    {
      type: "progetto",
      label: "Progetto",
      table: "progetti",
      icon: User,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-2 w-48">
      {menuItems.map((item) => {
        const Icon = item.icon
        const href = `/data-explorer/${item.table}/new?date=${dateParam}`

        return (
          <Link key={item.type} href={href}>
            <Button variant="ghost" className="w-full justify-start h-auto p-3 hover:bg-gray-50">
              <div className={`w-3 h-3 rounded-full ${item.color} mr-3`} />
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          </Link>
        )
      })}
    </div>
  )
}

export default function AgendaWidget({ mode = "desktop", className = "" }: AgendaWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily")
  const [mounted, setMounted] = useState(false)

  const { items, isLoading, error } = useAgendaItems()

  // Carica la preferenza salvata dopo il mount
  useEffect(() => {
    setMounted(true)
    if (mode !== "mobile") {
      const savedView = getViewPreference()
      setView(savedView)
      console.log(`Agenda widget mounted with view: ${savedView}`)
    }
  }, [mode])

  const handleViewChange = (newView: "daily" | "weekly" | "monthly") => {
    console.log(`Changing agenda view from ${view} to ${newView}`)
    setView(newView)
    if (mode !== "mobile") {
      saveViewPreference(newView)
    }
  }

  // Filtra gli elementi per la data corrente
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items.filter((item: AgendaItem) => {
      const itemDate = new Date(item.data_inizio)

      switch (view) {
        case "daily":
          return isSameDay(itemDate, currentDate)
        case "weekly":
          const weekStart = startOfWeek(currentDate, { locale: it })
          const weekEnd = endOfWeek(currentDate, { locale: it })
          return itemDate >= weekStart && itemDate <= weekEnd
        case "monthly":
          return isSameMonth(itemDate, currentDate)
        default:
          return false
      }
    })
  }, [items, currentDate, view])

  // Funzioni di navigazione
  const navigateDate = (direction: "prev" | "next") => {
    switch (view) {
      case "daily":
        setCurrentDate(direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1))
        break
      case "weekly":
        setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
        break
      case "monthly":
        setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
        break
    }
  }

  // Funzione per ottenere il titolo della data
  const getDateTitle = () => {
    switch (view) {
      case "daily":
        return format(currentDate, "EEEE d MMMM yyyy", { locale: it })
      case "weekly":
        const weekStart = startOfWeek(currentDate, { locale: it })
        const weekEnd = endOfWeek(currentDate, { locale: it })
        return `${format(weekStart, "d MMM", { locale: it })} - ${format(weekEnd, "d MMM yyyy", { locale: it })}`
      case "monthly":
        return format(currentDate, "MMMM yyyy", { locale: it })
      default:
        return ""
    }
  }

  // Componente per la vista giornaliera
  const DailyView = () => (
    <div className="space-y-3">
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nessun evento per oggi</p>
        </div>
      ) : (
        filteredItems.map((item: AgendaItem, index: number) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={item.tipo === "appuntamento" ? "default" : "secondary"}>{item.tipo}</Badge>
                  {item.priorita && (
                    <Badge variant={item.priorita === "alta" ? "destructive" : "outline"}>{item.priorita}</Badge>
                  )}
                </div>
                <h4 className="font-semibold text-lg mb-1">{item.titolo}</h4>
                {item.descrizione && <p className="text-muted-foreground text-sm mb-2">{item.descrizione}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.ora_inizio && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {item.ora_inizio}
                        {item.ora_fine && ` - ${item.ora_fine}`}
                      </span>
                    </div>
                  )}
                  {item.luogo && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{item.luogo}</span>
                    </div>
                  )}
                  {item.partecipanti && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{item.partecipanti}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // Componente per la vista settimanale
  const WeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { locale: it })
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate, { locale: it }),
    })

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayItems = filteredItems.filter((item: AgendaItem) => isSameDay(new Date(item.data_inizio), day))

          return (
            <div key={day.toISOString()} className="border rounded-lg p-2 min-h-[120px]">
              <div className="font-semibold text-sm mb-2 text-center">{format(day, "EEE d", { locale: it })}</div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item: AgendaItem) => (
                  <div key={item.id} className="text-xs p-1 bg-primary/10 rounded truncate" title={item.titolo}>
                    {item.titolo}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">+{dayItems.length - 3} altri</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Componente per la vista mensile
  const MonthlyView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { locale: it })
    const calendarEnd = endOfWeek(monthEnd, { locale: it })

    const weeks = eachWeekOfInterval({
      start: calendarStart,
      end: calendarEnd,
    })

    const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

    return (
      <div className="space-y-2">
        {/* Header giorni della settimana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((dayName) => (
            <div key={dayName} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {dayName}
            </div>
          ))}
        </div>

        {/* Griglia del calendario */}
        {weeks.map((weekStart) => {
          const weekDays = eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(weekStart, { locale: it }),
          })

          return (
            <div key={weekStart.toISOString()} className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayItems = items?.filter((item: AgendaItem) => isSameDay(new Date(item.data_inizio), day)) || []

                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      border rounded-lg p-2 min-h-[80px] relative
                      ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                      ${isToday ? "ring-2 ring-primary" : ""}
                      hover:shadow-sm transition-shadow
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                        text-sm font-medium
                        ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                        ${isToday ? "text-primary font-bold" : ""}
                      `}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Pulsante per aggiungere nuovo elemento */}
                      {isCurrentMonth && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <NewItemMenu selectedDate={day} />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* Eventi del giorno */}
                    <div className="space-y-1">
                      {dayItems.slice(0, 2).map((item: AgendaItem) => (
                        <div
                          key={item.id}
                          className="text-xs p-1 bg-primary/10 rounded truncate"
                          title={`${item.titolo} - ${item.tipo}`}
                        >
                          {item.titolo}
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-xs text-muted-foreground">+{dayItems.length - 2}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Errore nel caricamento dell'agenda</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agenda
          </CardTitle>

          {/* Controlli di navigazione */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")} disabled={isLoading}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-sm font-medium min-w-[200px] text-center">
              {mounted ? getDateTitle() : "Caricamento..."}
            </div>

            <Button variant="outline" size="sm" onClick={() => navigateDate("next")} disabled={isLoading}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tabs per cambiare vista (solo desktop) */}
        {mode === "desktop" && mounted && (
          <Tabs
            value={view}
            onValueChange={(value) => handleViewChange(value as "daily" | "weekly" | "monthly")}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Giorno
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Settimana
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Mese
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Contenuto dell'agenda */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {mounted && (
              <>
                {view === "daily" && <DailyView />}
                {view === "weekly" && <WeeklyView />}
                {view === "monthly" && <MonthlyView />}
              </>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
