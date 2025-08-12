"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAgendaItems } from "@/hooks/use-agenda-items"
import { useAuth } from "@/lib/auth-provider"
import { cn } from "@/lib/utils"
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
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns"
import { it } from "date-fns/locale"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  FileText,
  CheckSquare,
  AlertTriangle,
  Briefcase,
  Plus,
  Eye,
  CalendarDays,
  CalendarRange,
  Grid3X3,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface AgendaWidgetProps {
  className?: string
  mode?: "desktop" | "mobile"
}

// Costanti per la memorizzazione delle preferenze
const AGENDA_VIEW_PREFERENCE_KEY = "agenda-view-preference"

// Funzioni per gestire le preferenze di visualizzazione
const saveViewPreference = (view: "daily" | "weekly" | "monthly") => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(AGENDA_VIEW_PREFERENCE_KEY, view)
      console.log(`📅 AgendaWidget: View preference saved: ${view}`)
    }
  } catch (error) {
    console.error("❌ AgendaWidget: Error saving view preference:", error)
  }
}

const getViewPreference = (): "daily" | "weekly" | "monthly" => {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(AGENDA_VIEW_PREFERENCE_KEY)
      if (saved && ["daily", "weekly", "monthly"].includes(saved)) {
        console.log(`📅 AgendaWidget: View preference loaded: ${saved}`)
        return saved as "daily" | "weekly" | "monthly"
      }
    }
  } catch (error) {
    console.error("❌ AgendaWidget: Error loading view preference:", error)
  }

  return "daily" // Default
}

// Funzione per calcolare le date in base alla vista
const calculateDateRange = (selectedDate: Date, view: "daily" | "weekly" | "monthly") => {
  let startDate: Date
  let endDate: Date

  switch (view) {
    case "daily":
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      break

    case "weekly":
      startDate = startOfWeek(selectedDate, { weekStartsOn: 1 })
      startDate.setHours(0, 0, 0, 0)
      endDate = endOfWeek(selectedDate, { weekStartsOn: 1 })
      endDate.setHours(23, 59, 59, 999)
      break

    case "monthly":
      startDate = startOfMonth(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = endOfMonth(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      break

    default:
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
  }

  console.log(`📅 AgendaWidget: Date range for ${view} view:`, {
    selectedDate: selectedDate.toISOString(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })

  return { startDate, endDate }
}

// Funzione per ottenere l'abbreviazione della tabella
const getTableAbbreviation = (tableName: string): string => {
  const abbreviations: Record<string, string> = {
    appuntamenti: "APP",
    attivita: "ATT",
    progetti: "PRO",
    scadenze: "SCA",
    todolist: "TDL",
    todo: "TDL",
  }
  return abbreviations[tableName] || tableName.substring(0, 3).toUpperCase()
}

// Funzione per ottenere il colore del tag verticale
const getTableTagColor = (tableName: string): string => {
  const colors: Record<string, string> = {
    appuntamenti: "bg-blue-500",
    attivita: "bg-green-500",
    progetti: "bg-orange-500",
    scadenze: "bg-red-500",
    todolist: "bg-purple-500",
    todo: "bg-purple-500",
  }
  return colors[tableName] || "bg-gray-500"
}

// Componente per il tag verticale
const VerticalTag = ({ tableName }: { tableName: string }) => {
  const abbreviation = getTableAbbreviation(tableName)
  const color = getTableTagColor(tableName)

  return (
    <div className={cn("w-1 h-full rounded-l-md", color)} title={tableName}>
      <div
        className="writing-mode-vertical text-xs font-bold text-white p-1 rotate-180"
        style={{ writingMode: "vertical-rl" }}
      >
        {abbreviation}
      </div>
    </div>
  )
}

// Componente per il menu di creazione nuovo elemento
const NewItemMenu = ({ date }: { date: Date }) => {
  const router = useRouter()
  const dateParam = format(date, "yyyy-MM-dd")

  // Mappa dei tipi di elemento alle tabelle corrispondenti
  const tableMap = {
    appuntamento: "appuntamenti",
    attivita: "attivita",
    todolist: "todolist",
    scadenza: "scadenze",
    progetto: "progetti",
  }

  const handleNewItem = (type: keyof typeof tableMap) => {
    const tableName = tableMap[type]
    if (tableName) {
      const url = `/data-explorer/${tableName}/new?date=${dateParam}`
      console.log(`🔗 AgendaWidget: Navigating to: ${url}`)
      router.push(url)
    } else {
      console.error(`❌ AgendaWidget: Unknown item type: ${type}`)
    }
  }

  const menuItems = [
    { type: "appuntamento" as const, label: "Appuntamento", icon: CalendarIcon, color: "text-blue-600" },
    { type: "attivita" as const, label: "Attività", icon: CheckSquare, color: "text-green-600" },
    { type: "todolist" as const, label: "Todo", icon: FileText, color: "text-purple-600" },
    { type: "scadenza" as const, label: "Scadenza", icon: AlertTriangle, color: "text-red-600" },
    { type: "progetto" as const, label: "Progetto", icon: Briefcase, color: "text-orange-600" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10">
          <Plus className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {menuItems.map((item) => (
          <DropdownMenuItem
            key={item.type}
            onClick={() => handleNewItem(item.type)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <item.icon className={cn("h-4 w-4", item.color)} />
            <span>Nuovo {item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AgendaWidget({ className, mode = "desktop" }: AgendaWidgetProps) {
  const { user, isLoading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Funzione per gestire il click su un elemento
  const handleItemClick = (item: any) => {
    const url = `/data-explorer/${item.tabella_origine}/${item.id_origine}`
    console.log(`🔗 AgendaWidget: Navigating to item: ${url}`)
    router.push(url)
  }

  // Calcola le date corrette in base alla vista selezionata
  const { startDate, endDate } = useMemo(() => {
    return calculateDateRange(selectedDate, view)
  }, [selectedDate, view])

  // Ora passiamo le date corrette al hook invece di selectedDate e view
  const { items, isLoading, error } = useAgendaItems(startDate, endDate)

  // Carica la preferenza di visualizzazione dopo il mount del componente
  useEffect(() => {
    setMounted(true)
    if (mode === "desktop") {
      const savedView = getViewPreference()
      setView(savedView)
    }
  }, [mode])

  const handleViewChange = (newView: "daily" | "weekly" | "monthly") => {
    console.log(`📅 AgendaWidget: Changing view from ${view} to ${newView}`)
    setView(newView)
    if (mode === "desktop") {
      saveViewPreference(newView)
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "daily") {
      setSelectedDate(direction === "next" ? addDays(selectedDate, 1) : subDays(selectedDate, 1))
    } else if (view === "weekly") {
      setSelectedDate(direction === "next" ? addDays(selectedDate, 7) : subDays(selectedDate, 7))
    } else {
      setSelectedDate(direction === "next" ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1))
    }
  }

  const getDateRangeText = () => {
    if (view === "daily") {
      return format(selectedDate, "EEEE d MMMM yyyy", { locale: it })
    } else if (view === "weekly") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
      return `${format(start, "d MMM", { locale: it })} - ${format(end, "d MMM yyyy", { locale: it })}`
    } else {
      return format(selectedDate, "MMMM yyyy", { locale: it })
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "appuntamento":
        return <CalendarIcon className="h-4 w-4 text-blue-600" />
      case "attivita":
        return <CheckSquare className="h-4 w-4 text-green-600" />
      case "todolist":
        return <FileText className="h-4 w-4 text-purple-600" />
      case "scadenza":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "progetto":
        return <Briefcase className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getItemColor = (type: string) => {
    switch (type) {
      case "appuntamento":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "attivita":
        return "bg-green-100 text-green-800 border-green-200"
      case "todolist":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "scadenza":
        return "bg-red-100 text-red-800 border-red-200"
      case "progetto":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Vista giornaliera
  const renderDailyView = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nessun elemento per oggi</p>
          <NewItemMenu date={selectedDate} />
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={`${item.tipo}-${item.id}`}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    <VerticalTag tableName={item.tabella_origine} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getItemIcon(item.tipo)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.titolo}</h4>
                            {item.descrizione && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.descrizione}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {item.data_inizio && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(item.data_inizio), "HH:mm")}
                                </div>
                              )}
                              {item.cliente && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.cliente}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline" className={cn("text-xs", getItemColor(item.tipo))}>
                            {item.tipo}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemClick(item)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  // Vista settimanale con altezza dinamica
  const renderWeeklyView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayItems = items.filter((item) => item.data_inizio && isSameDay(new Date(item.data_inizio), day))
            const isToday = isSameDay(day, new Date())
            const isSelected = isSameDay(day, selectedDate)

            // Calcola altezza dinamica basata sul numero di elementi
            const minHeight = 120
            const itemHeight = 24 // Altezza approssimativa per elemento
            const dynamicHeight = Math.max(minHeight, dayItems.length * itemHeight + 60)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border rounded-lg p-2 cursor-pointer transition-colors",
                  isToday && "bg-primary/5 border-primary/20",
                  isSelected && "ring-2 ring-primary/50",
                  "hover:bg-muted/50",
                )}
                style={{ minHeight: `${dynamicHeight}px` }}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-sm font-medium", isToday && "text-primary")}>
                    {format(day, "d", { locale: it })}
                  </span>
                  <NewItemMenu date={day} />
                </div>
                <div className="space-y-1">
                  {dayItems.map((item, index) => (
                    <div
                      key={`${item.tipo}-${item.id}`}
                      className={cn(
                        "text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 flex items-center gap-1",
                        getItemColor(item.tipo),
                      )}
                      title={item.titolo}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleItemClick(item)
                      }}
                    >
                      <div className={cn("w-1 h-3 rounded", getTableTagColor(item.tabella_origine))} />
                      <span className="truncate">{item.titolo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Vista mensile con altezza dinamica
  const renderMonthlyView = () => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

    return (
      <div className="space-y-4">
        {/* Header giorni della settimana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Griglia del calendario */}
        <div className="space-y-2">
          {weeks.map((weekStart) => {
            const weekDays = eachDayOfInterval({
              start: weekStart,
              end: endOfWeek(weekStart, { weekStartsOn: 1 }),
            })

            return (
              <div key={weekStart.toISOString()} className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayItems = items.filter(
                    (item) => item.data_inizio && isSameDay(new Date(item.data_inizio), day),
                  )
                  const isToday = isSameDay(day, new Date())
                  const isCurrentMonth = isSameMonth(day, selectedDate)
                  const isSelected = isSameDay(day, selectedDate)

                  // Calcola altezza dinamica basata sul numero di elementi
                  const minHeight = 80
                  const itemHeight = 20
                  const dynamicHeight = Math.max(minHeight, dayItems.length * itemHeight + 40)

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "border rounded-lg p-2 cursor-pointer transition-colors",
                        !isCurrentMonth && "opacity-50 bg-muted/20",
                        isToday && "bg-primary/5 border-primary/20",
                        isSelected && "ring-2 ring-primary/50",
                        "hover:bg-muted/50",
                      )}
                      style={{ minHeight: `${dynamicHeight}px` }}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isToday && "text-primary",
                            !isCurrentMonth && "text-muted-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {isCurrentMonth && <NewItemMenu date={day} />}
                      </div>
                      <div className="space-y-1">
                        {dayItems.map((item) => (
                          <div
                            key={`${item.tipo}-${item.id}`}
                            className={cn(
                              "text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 flex items-center gap-1",
                              getItemColor(item.tipo),
                            )}
                            title={item.titolo}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemClick(item)
                            }}
                          >
                            <div className={cn("w-1 h-3 rounded", getTableTagColor(item.tabella_origine))} />
                            <span className="truncate">{item.titolo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Non renderizzare fino a quando il componente non è montato (per evitare hydration mismatch)
  if (!mounted || authLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  // Se l'utente non è autenticato, mostra un messaggio
  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Accesso richiesto per visualizzare l'agenda</p>
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
            <CalendarIcon className="h-5 w-5" />
            Agenda
          </CardTitle>

          {/* Controlli di navigazione */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-center bg-transparent">
                  {getDateRangeText()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={it}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs per la selezione della vista - solo su desktop */}
        {mode === "desktop" && (
          <Tabs value={view} onValueChange={(value) => handleViewChange(value as "daily" | "weekly" | "monthly")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Giornaliera
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4" />
                Settimanale
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Mensile
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="text-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Errore nel caricamento dell'agenda</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </div>
        ) : (
          <>
            {view === "daily" && renderDailyView()}
            {view === "weekly" && renderWeeklyView()}
            {view === "monthly" && renderMonthlyView()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
