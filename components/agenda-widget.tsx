"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isWithinInterval,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
} from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Filter,
  Download,
  AlertCircle,
  Globe,
  User,
  HelpCircle,
  Bug,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAgendaItems, type AgendaItem } from "@/hooks/use-agenda-items"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-provider" // Ensure this path is correct
import { useDebugConfig } from "@/hooks/use-debug-config"
import { cn } from "@/lib/utils"

// Funzioni di utilità per il debug
const formatDateForDebug = (date: Date | undefined): string => {
  if (!date) return "UNDEFINED"
  if (!(date instanceof Date)) return "NOT_DATE"
  if (isNaN(date.getTime())) return "INVALID_DATE"
  return date.toISOString()
}

const checkInvalidDates = (items: AgendaItem[]): AgendaItem[] => {
  return items.filter((item) => {
    const hasInvalidStartDate =
      !item.data_inizio || !(item.data_inizio instanceof Date) || isNaN(item.data_inizio.getTime())
    const hasInvalidEndDate = item.data_fine && (!(item.data_fine instanceof Date) || isNaN(item.data_fine.getTime()))
    const hasInvalidScadenzaDate =
      item.data_scadenza && (!(item.data_scadenza instanceof Date) || isNaN(item.data_scadenza.getTime()))

    return hasInvalidStartDate || hasInvalidEndDate || hasInvalidScadenzaDate
  })
}

// Definizione dei colori per i diversi tipi di elementi
const COLORS = {
  attivita: "#ffcdd2", // Rosso pastello
  progetto: "#bbdefb", // Blu pastello
  appuntamento: "#c8e6c9", // Verde pastello
  scadenza: "#ffecb3", // Giallo pastello
  scadenza_generale: "#FFC107", // Giallo ambra
  todolist: "#e1bee7", // Viola pastello
}

// Abbreviazioni per i tipi di elementi
const TYPE_ABBR = {
  attivita: "ATT",
  progetto: "PRO",
  appuntamento: "APP",
  scadenza: "SCA",
  todolist: "TDL",
}

// Funzione per formattare l'ora
const formatTime = (date: Date) => {
  return format(date, "HH:mm")
}

// Funzione per il logging condizionale
const conditionalLog = (message: string, data?: any, isDebugEnabled = false) => {
  if (isDebugEnabled) {
    if (data) {
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

// Componente per visualizzare un singolo elemento dell'agenda
const AgendaItemComponent = ({ item }: { item: AgendaItem }) => {
  // Ottieni l'abbreviazione del tipo
  const typeAbbr = TYPE_ABBR[item.tipo] || item.tipo.substring(0, 3).toUpperCase()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="flex items-stretch p-0 rounded-md mb-1 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
          style={{ backgroundColor: item.colore }}
        >
          {/* Tipo in verticale */}
          <div className="bg-black text-white text-[8px] font-bold flex items-center justify-center px-0.5 vertical-text">
            {typeAbbr}
          </div>

          {/* Contenuto principale */}
          <div className="flex-1 p-1.5">
            <div className="font-medium text-gray-800 truncate flex items-center text-xs">
              {item.generale && <Globe className="h-2.5 w-2.5 mr-0.5 text-gray-700 flex-shrink-0" />}
              {item.titolo}
            </div>
            <div className="text-xs text-gray-700 flex items-center">
              <Clock className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
              {formatTime(item.data_inizio)}
              {item.data_fine &&
                item.data_fine.getTime() !== item.data_inizio.getTime() &&
                ` - ${formatTime(item.data_fine)}`}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div className="flex items-center">
            <h4 className="font-bold flex-1">{item.titolo}</h4>
            {item.generale ? (
              <Badge variant="outline" className="ml-2 bg-amber-100">
                <Globe className="h-3 w-3 mr-1" />
                Generale
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 bg-blue-100">
                <User className="h-3 w-3 mr-1" />
                Personale
              </Badge>
            )}
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {format(item.data_inizio, "PPP", { locale: it })} {formatTime(item.data_inizio)}
              {item.data_fine &&
                item.data_fine.getTime() !== item.data_inizio.getTime() &&
                ` - ${formatTime(item.data_fine)}`}
            </span>
          </div>

          {item.cliente && (
            <div className="text-sm">
              <span className="font-semibold">Cliente:</span> {item.cliente}
            </div>
          )}

          {item.stato && (
            <div className="text-sm">
              <span className="font-semibold">Stato:</span> {item.stato}
            </div>
          )}

          {item.priorita && (
            <div className="text-sm">
              <span className="font-semibold">Priorità:</span> {item.priorita}
            </div>
          )}

          {item.descrizione && (
            <div className="text-sm mt-2">
              <span className="font-semibold">Descrizione:</span>
              <p className="mt-1">{item.descrizione}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            Origine: {item.tabella_origine} (ID: {item.id_origine})
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Componente per la legenda dei colori
const ColorLegend = () => {
  return (
    <div className="flex flex-wrap gap-2 mt-4 p-3 bg-gray-50 rounded-md">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: COLORS.attivita }}></div>
        <span className="text-xs">Attività</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: COLORS.progetto }}></div>
        <span className="text-xs">Progetti</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: COLORS.appuntamento }}></div>
        <span className="text-xs">Appuntamenti</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: COLORS.scadenza }}></div>
        <span className="text-xs">Scadenze</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: COLORS.scadenza_generale }}></div>
        <span className="text-xs flex items-center">
          <Globe className="h-2.5 w-2.5 mr-0.5" />
          Scadenze generali
        </span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: COLORS.todolist }}></div>
        <span className="text-xs">Todo</span>
      </div>
    </div>
  )
}

// Componente per il popup delle statistiche
const StatsPopup = ({ tableStats }: { tableStats: Record<string, number> }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Mostra statistiche dettagliate</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Riepilogo per tipo</h4>
          <div className="space-y-1">
            {Object.entries(tableStats).map(([tipo, count]) => (
              <div key={tipo} className="flex justify-between items-center text-sm">
                <span className="flex items-center">
                  {tipo === "scadenze_generali" ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Scadenze generali
                    </>
                  ) : (
                    tipo.charAt(0).toUpperCase() + tipo.slice(1)
                  )}
                </span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Totale</span>
              <Badge variant="default" className="text-xs">
                {Object.values(tableStats).reduce((sum, count) => sum + count, 0)}
              </Badge>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Componente per la visualizzazione giornaliera
const DailyView = ({
  items,
  currentDate,
  filters,
  isDebugEnabled,
}: {
  items: AgendaItem[]
  currentDate: Date
  filters: any
  isDebugEnabled: boolean
}) => {
  // Debug: Verifica la validità di currentDate
  conditionalLog(
    "DailyView - currentDate:",
    {
      value: currentDate,
      isDate: currentDate instanceof Date,
      isValid: !isNaN(currentDate.getTime()),
      iso: currentDate.toISOString(),
      local: currentDate.toLocaleString(),
    },
    isDebugEnabled,
  )

  // Filtra gli elementi per il giorno corrente
  const dailyItems = useMemo(() => {
    conditionalLog("DailyView - Filtraggio elementi per la data:", currentDate.toISOString(), isDebugEnabled)
    conditionalLog("DailyView - Numero totale elementi disponibili:", items.length, isDebugEnabled)

    // Debug: Verifica elementi con date non valide
    const invalidItems = checkInvalidDates(items)
    if (invalidItems.length > 0 && isDebugEnabled) {
      console.warn("DailyView - Elementi con date non valide:", invalidItems)
    }

    const filteredItems = items
      .filter((item) => {
        try {
          // Validazione migliorata delle date
          const isValidStartDate = item.data_inizio instanceof Date && !isNaN(item.data_inizio.getTime())
          const isValidScadenzaDate = item.data_scadenza instanceof Date && !isNaN(item.data_scadenza?.getTime())
          const isValidEndDate = item.data_fine instanceof Date && !isNaN(item.data_fine?.getTime())

          // Debug: Log dettagliato per ogni elemento
          if (isDebugEnabled) {
            const debugInfo = {
              id: item.id,
              titolo: item.titolo,
              tipo: item.tipo,
              data_inizio: isValidStartDate ? item.data_inizio.toISOString() : "INVALID",
              data_fine: isValidEndDate ? item.data_fine?.toISOString() : "INVALID",
              data_scadenza: isValidScadenzaDate ? item.data_scadenza?.toISOString() : "INVALID",
              currentDate: currentDate.toISOString(),
            }

            // Per scadenze e todolist, confrontiamo solo la data ignorando l'ora
            if (item.tipo === "scadenza" || item.tipo === "todolist") {
              const matchesStartDate =
                isValidStartDate &&
                currentDate.getFullYear() === item.data_inizio.getFullYear() &&
                currentDate.getMonth() === item.data_inizio.getMonth() &&
                currentDate.getDate() === item.data_inizio.getDate()

              const matchesScadenzaDate =
                isValidScadenzaDate &&
                currentDate.getFullYear() === item.data_scadenza!.getFullYear() &&
                currentDate.getMonth() === item.data_scadenza!.getMonth() &&
                currentDate.getDate() === item.data_scadenza!.getDate()

              // Debug: Aggiungi risultati del confronto
              debugInfo.matchesStartDate = matchesStartDate
              debugInfo.matchesScadenzaDate = matchesScadenzaDate
              debugInfo.included = matchesStartDate || matchesScadenzaDate

              // Log solo per scadenze e todolist
              if (item.tipo === "scadenza" || item.tipo === "todolist") {
                conditionalLog("DailyView - Debug scadenza/todolist:", debugInfo, isDebugEnabled)
              }
            } else {
              // Per gli altri tipi (attività, progetti, appuntamenti), usiamo la logica esistente
              const matchesStartDate = isValidStartDate && isSameDay(item.data_inizio, currentDate)
              const matchesScadenzaDate = isValidScadenzaDate && isSameDay(item.data_scadenza!, currentDate)
              const isWithinDateRange =
                isValidStartDate &&
                isValidEndDate &&
                isWithinInterval(currentDate, {
                  start: item.data_inizio,
                  end: item.data_fine!,
                })

              // Debug: Aggiungi risultati del confronto
              debugInfo.matchesStartDate = matchesStartDate
              debugInfo.matchesScadenzaDate = matchesScadenzaDate
              debugInfo.isWithinDateRange = isWithinDateRange
              debugInfo.included = matchesStartDate || matchesScadenzaDate || isWithinDateRange

              // Log per altri tipi di elementi
              conditionalLog("DailyView - Debug altro tipo:", debugInfo, isDebugEnabled)
            }
          }

          // Per scadenze e todolist, confrontiamo solo la data ignorando l'ora
          if (item.tipo === "scadenza" || item.tipo === "todolist") {
            const matchesStartDate =
              isValidStartDate &&
              currentDate.getFullYear() === item.data_inizio.getFullYear() &&
              currentDate.getMonth() === item.data_inizio.getMonth() &&
              currentDate.getDate() === item.data_inizio.getDate()

            const matchesScadenzaDate =
              isValidScadenzaDate &&
              currentDate.getFullYear() === item.data_scadenza!.getFullYear() &&
              currentDate.getMonth() === item.data_scadenza!.getMonth() &&
              currentDate.getDate() === item.data_scadenza!.getDate()

            return matchesStartDate || matchesScadenzaDate
          }

          // Per gli altri tipi (attività, progetti, appuntamenti), usiamo la logica esistente
          const matchesStartDate = isValidStartDate && isSameDay(item.data_inizio, currentDate)
          const matchesScadenzaDate = isValidScadenzaDate && isSameDay(item.data_scadenza!, currentDate)
          const isWithinDateRange =
            isValidStartDate &&
            isValidEndDate &&
            isWithinInterval(currentDate, {
              start: item.data_inizio,
              end: item.data_fine!,
            })

          return matchesStartDate || matchesScadenzaDate || isWithinDateRange
        } catch (error) {
          if (isDebugEnabled) {
            console.error("Errore nel filtraggio degli elementi giornalieri:", error, item)
          }
          return false
        }
      })
      .sort((a, b) => a.data_inizio.getTime() - b.data_inizio.getTime())

    conditionalLog("DailyView - Elementi filtrati:", filteredItems.length, isDebugEnabled)
    return filteredItems
  }, [items, currentDate, isDebugEnabled])

  // Aggiungiamo log di debug specifici per le scadenze generali
  if (isDebugEnabled) {
    const scadenzeGenerali = items.filter((item) => item.tipo === "scadenza" && item.generale === true)
    conditionalLog("DailyView - Scadenze generali disponibili:", scadenzeGenerali.length, isDebugEnabled)
    if (scadenzeGenerali.length > 0) {
      conditionalLog(
        "DailyView - Dettagli scadenze generali:",
        scadenzeGenerali.map((item) => ({
          id: item.id,
          titolo: item.titolo,
          data_inizio: formatDateForDebug(item.data_inizio),
          data_scadenza: formatDateForDebug(item.data_scadenza),
          inclusa: dailyItems.some(
            (di) => di.id === item.id && di.tabella_origine === item.tabella_origine && di.generale === true,
          ),
        })),
        isDebugEnabled,
      )
    }

    // Aggiungi un log per verificare i filtri attivi
    conditionalLog("DailyView - Filtri attivi:", filters, isDebugEnabled)

    // Aggiungiamo log di debug
    conditionalLog("DailyView - Elementi filtrati per la vista giornaliera:", dailyItems.length, isDebugEnabled)
    conditionalLog(
      "DailyView - Elementi per tipo nella vista giornaliera:",
      {
        attivita: dailyItems.filter((item) => item.tipo === "attivita").length,
        progetto: dailyItems.filter((item) => item.tipo === "progetto").length,
        appuntamento: dailyItems.filter((item) => item.tipo === "appuntamento").length,
        scadenza: dailyItems.filter((item) => item.tipo === "scadenza" && !item.generale).length,
        scadenza_generale: dailyItems.filter((item) => item.tipo === "scadenza" && item.generale).length,
        todolist: dailyItems.filter((item) => item.tipo === "todolist").length,
      },
      isDebugEnabled,
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {format(currentDate, "EEEE d MMMM yyyy", { locale: it })}
        {isToday(currentDate) && <Badge className="ml-2">Oggi</Badge>}
      </h3>

      {dailyItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nessun elemento in agenda per questa giornata</div>
      ) : (
        <div className="space-y-1">
          {dailyItems.map((item) => (
            <AgendaItemComponent
              key={`${item.tabella_origine}-${item.id}-${item.generale ? "gen" : "pers"}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Componente per la visualizzazione settimanale
const WeeklyView = ({
  items,
  currentDate,
  filters,
  isDebugEnabled,
}: {
  items: AgendaItem[]
  currentDate: Date
  filters: any
  isDebugEnabled: boolean
}) => {
  // Calcola l'inizio e la fine della settimana
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Inizia da lunedì
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  // Debug: Verifica la validità delle date
  conditionalLog(
    "WeeklyView - Date:",
    {
      currentDate: currentDate.toISOString(),
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    },
    isDebugEnabled,
  )

  // Ottieni tutti i giorni della settimana
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Settimana dal {format(weekStart, "d MMMM", { locale: it })} al {format(weekEnd, "d MMMM yyyy", { locale: it })}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {weekDays.map((day) => {
          // Filtra gli elementi per questo giorno
          const dayItems = items
            .filter((item) => {
              try {
                // Validazione migliorata delle date
                const isValidStartDate = item.data_inizio instanceof Date && !isNaN(item.data_inizio.getTime())
                const isValidScadenzaDate = item.data_scadenza instanceof Date && !isNaN(item.data_scadenza?.getTime())
                const isValidEndDate = item.data_fine instanceof Date && !isNaN(item.data_fine?.getTime())

                // Per scadenze e todolist, confrontiamo solo la data ignorando l'ora
                if (item.tipo === "scadenza" || item.tipo === "todolist") {
                  const matchesStartDate =
                    isValidStartDate &&
                    day.getFullYear() === item.data_inizio.getFullYear() &&
                    day.getMonth() === item.data_inizio.getMonth() &&
                    day.getDate() === item.data_inizio.getDate()

                  const matchesScadenzaDate =
                    isValidScadenzaDate &&
                    day.getFullYear() === item.data_scadenza!.getFullYear() &&
                    day.getMonth() === item.data_scadenza!.getMonth() &&
                    day.getDate() === item.data_scadenza!.getDate()

                  return matchesStartDate || matchesScadenzaDate
                }

                // Per gli altri tipi (attività, progetti, appuntamenti), usiamo la logica esistente
                return (
                  (isValidStartDate && isSameDay(item.data_inizio, day)) ||
                  (isValidScadenzaDate && isSameDay(item.data_scadenza!, day)) ||
                  (isValidStartDate &&
                    isValidEndDate &&
                    isWithinInterval(day, {
                      start: item.data_inizio,
                      end: item.data_fine!,
                    }))
                )
              } catch (error) {
                if (isDebugEnabled) {
                  console.error("Errore nel filtraggio degli elementi settimanali:", error)
                }
                return false
              }
            })
            .sort((a, b) => a.data_inizio.getTime() - b.data_inizio.getTime())

          return (
            <div
              key={day.toString()}
              className={`p-2 rounded-md ${isToday(day) ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
            >
              <div className="text-center font-medium mb-2 text-sm">{format(day, "EEEE d", { locale: it })}</div>

              {dayItems.length === 0 ? (
                <div className="text-center py-2 text-xs text-gray-500">Nessun elemento</div>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {dayItems.map((item) => (
                    <AgendaItemComponent
                      key={`${item.tabella_origine}-${item.id}-${item.generale ? "gen" : "pers"}`}
                      item={item}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Componente per la visualizzazione mensile
const MonthlyView = ({
  items,
  currentDate,
  filters,
  isDebugEnabled,
}: {
  items: AgendaItem[]
  currentDate: Date
  filters: any
  isDebugEnabled: boolean
}) => {
  // Calcola l'inizio e la fine del mese
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Debug: Verifica la validità delle date
  conditionalLog(
    "MonthlyView - Date:",
    {
      currentDate: currentDate.toISOString(),
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
    },
    isDebugEnabled,
  )

  // Ottieni tutti i giorni del mese, estendendo per includere l'inizio e la fine della settimana
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Raggruppa i giorni in settimane
  const calendarWeeks = []
  let week = []

  for (const day of calendarDays) {
    week.push(day)
    if (week.length === 7) {
      calendarWeeks.push(week)
      week = []
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy", { locale: it })}</h3>

      <div className="grid grid-cols-7 gap-1 text-center font-medium text-xs">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mer</div>
        <div>Gio</div>
        <div>Ven</div>
        <div>Sab</div>
        <div>Dom</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarWeeks.flat().map((day) => {
          // Filtra gli elementi per questo giorno
          const dayItems = items.filter((item) => {
            try {
              // Validazione migliorata delle date
              const isValidStartDate = item.data_inizio instanceof Date && !isNaN(item.data_inizio.getTime())
              const isValidScadenzaDate = item.data_scadenza instanceof Date && !isNaN(item.data_scadenza?.getTime())
              const isValidEndDate = item.data_fine instanceof Date && !isNaN(item.data_fine?.getTime())

              // Per scadenze e todolist, confrontiamo solo la data ignorando l'ora
              if (item.tipo === "scadenza" || item.tipo === "todolist") {
                const matchesStartDate =
                  isValidStartDate &&
                  day.getFullYear() === item.data_inizio.getFullYear() &&
                  day.getMonth() === item.data_inizio.getMonth() &&
                  day.getDate() === item.data_inizio.getDate()

                const matchesScadenzaDate =
                  isValidScadenzaDate &&
                  day.getFullYear() === item.data_scadenza!.getFullYear() &&
                  day.getMonth() === item.data_scadenza!.getMonth() &&
                  day.getDate() === item.data_scadenza!.getDate()

                return matchesStartDate || matchesScadenzaDate
              }

              // Per gli altri tipi (attività, progetti, appuntamenti), usiamo la logica esistente
              return (
                (isValidStartDate && isSameDay(item.data_inizio, day)) ||
                (isValidScadenzaDate && isSameDay(item.data_scadenza!, day)) ||
                (isValidStartDate &&
                  isValidEndDate &&
                  isWithinInterval(day, {
                    start: item.data_inizio,
                    end: item.data_fine!,
                  }))
              )
            } catch (error) {
              if (isDebugEnabled) {
                console.error("Errore nel filtraggio degli elementi mensili:", error)
              }
              return false
            }
          })

          const isCurrentMonth = day.getMonth() === currentDate.getMonth()

          return (
            <div
              key={day.toString()}
              className={`
                p-1 min-h-[80px] rounded-md border text-sm
                ${isToday(day) ? "bg-blue-50 border-blue-200" : ""}
                ${!isCurrentMonth ? "bg-gray-100 text-gray-400" : ""}
              `}
            >
              <div className="text-right font-medium mb-1 text-xs">{format(day, "d")}</div>

              <div className="space-y-0.5 max-h-[60px] overflow-y-auto">
                {dayItems.length > 0
                  ? dayItems.slice(0, 3).map((item) => {
                      // Ottieni l'abbreviazione del tipo
                      const typeAbbr = TYPE_ABBR[item.tipo] || item.tipo.substring(0, 3).toUpperCase()

                      return (
                        <Popover key={`${item.tabella_origine}-${item.id}-${item.generale ? "gen" : "pers"}`}>
                          <PopoverTrigger asChild>
                            <div
                              className="text-[10px] rounded truncate flex items-stretch overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: item.colore }}
                            >
                              {/* Tipo in verticale */}
                              <div className="bg-black text-white text-[6px] font-bold flex items-center justify-center px-0.5 writing-vertical-rl">
                                {typeAbbr}
                              </div>

                              {/* Contenuto principale */}
                              <div className="flex-1 p-0.5 truncate flex items-center">
                                {item.generale && <Globe className="h-2 w-2 mr-0.5 text-gray-700 flex-shrink-0" />}
                                {item.titolo}
                              </div>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <h4 className="font-bold flex-1">{item.titolo}</h4>
                                {item.generale ? (
                                  <Badge variant="outline" className="ml-2 bg-amber-100">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Generale
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="ml-2 bg-blue-100">
                                    <User className="h-3 w-3 mr-1" />
                                    Personale
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>
                                  {format(item.data_inizio, "PPP", { locale: it })} {formatTime(item.data_inizio)}
                                  {item.data_fine &&
                                    item.data_fine.getTime() !== item.data_inizio.getTime() &&
                                    ` - ${formatTime(item.data_fine)}`}
                                </span>
                              </div>

                              {item.cliente && (
                                <div className="text-sm">
                                  <span className="font-semibold">Cliente:</span> {item.cliente}
                                </div>
                              )}

                              {item.stato && (
                                <div className="text-sm">
                                  <span className="font-semibold">Stato:</span> {item.stato}
                                </div>
                              )}

                              {item.priorita && (
                                <div className="text-sm">
                                  <span className="font-semibold">Priorità:</span> {item.priorita}
                                </div>
                              )}

                              {item.descrizione && (
                                <div className="text-sm mt-2">
                                  <span className="font-semibold">Descrizione:</span>
                                  <p className="mt-1">{item.descrizione}</p>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 mt-2">
                                Origine: {item.tabella_origine} (ID: {item.id_origine})
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )
                    })
                  : null}

                {dayItems.length > 3 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="text-[10px] text-center cursor-pointer text-blue-600 hover:underline">
                        +{dayItems.length - 3} altri
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="font-bold">{format(day, "EEEE d MMMM", { locale: it })}</h4>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                          {dayItems.map((item) => {
                            // Ottieni l'abbreviazione del tipo
                            const typeAbbr = TYPE_ABBR[item.tipo] || item.tipo.substring(0, 3).toUpperCase()

                            return (
                              <Popover
                                key={`popup-${item.tabella_origine}-${item.id}-${item.generale ? "gen" : "pers"}`}
                              >
                                <PopoverTrigger asChild>
                                  <div
                                    className="text-xs rounded overflow-hidden flex items-stretch cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: item.colore }}
                                  >
                                    {/* Tipo in verticale */}
                                    <div className="bg-black text-white text-[8px] font-bold flex items-center justify-center px-0.5 writing-vertical-rl">
                                      {typeAbbr}
                                    </div>

                                    {/* Contenuto principale */}
                                    <div className="flex-1 p-1.5">
                                      <div className="font-medium flex items-center">
                                        {item.generale && <Globe className="h-2.5 w-2.5 mr-0.5 text-gray-700" />}
                                        {item.titolo}
                                      </div>
                                      <div className="text-xs">
                                        {formatTime(item.data_inizio)}
                                        {item.data_fine &&
                                          item.data_fine.getTime() !== item.data_inizio.getTime() &&
                                          ` - ${formatTime(item.data_fine)}`}
                                      </div>
                                    </div>
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <h4 className="font-bold flex-1">{item.titolo}</h4>
                                      {item.generale ? (
                                        <Badge variant="outline" className="ml-2 bg-amber-100">
                                          <Globe className="h-3 w-3 mr-1" />
                                          Generale
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="ml-2 bg-blue-100">
                                          <User className="h-3 w-3 mr-1" />
                                          Personale
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center text-sm">
                                      <Clock className="h-4 w-4 mr-1" />
                                      <span>
                                        {format(item.data_inizio, "PPP", { locale: it })} {formatTime(item.data_inizio)}
                                        {item.data_fine &&
                                          item.data_fine.getTime() !== item.data_inizio.getTime() &&
                                          ` - ${formatTime(item.data_fine)}`}
                                      </span>
                                    </div>

                                    {item.cliente && (
                                      <div className="text-sm">
                                        <span className="font-semibold">Cliente:</span> {item.cliente}
                                      </div>
                                    )}

                                    {item.stato && (
                                      <div className="text-sm">
                                        <span className="font-semibold">Stato:</span> {item.stato}
                                      </div>
                                    )}

                                    {item.priorita && (
                                      <div className="text-sm">
                                        <span className="font-semibold">Priorità:</span> {item.priorita}
                                      </div>
                                    )}

                                    {item.descrizione && (
                                      <div className="text-sm mt-2">
                                        <span className="font-semibold">Descrizione:</span>
                                        <p className="mt-1">{item.descrizione}</p>
                                      </div>
                                    )}

                                    <div className="text-xs text-gray-500 mt-2">
                                      Origine: {item.tabella_origine} (ID: {item.id_origine})
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface AgendaWidgetProps {
  initialDate?: Date
  mode?: "desktop" | "mobile"
}

export function AgendaWidget({ initialDate, mode = "desktop" }: AgendaWidgetProps) {
  const { user, isAdmin, isLoading: authIsLoading } = useAuth() // user can be null
  const { isDebugEnabled, isLoading: isDebugConfigLoading } = useDebugConfig()

  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [view, setView] = useState<"daily" | "weekly" | "monthly">(mode === "mobile" ? "daily" : "daily")
  const [filters, setFilters] = useState({
    attivita: true,
    progetti: true,
    appuntamenti: true,
    scadenze: true,
    scadenze_generali: true,
    todo: true,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [clienteFilter, setClienteFilter] = useState<string | null>(null)
  const [clientiList, setClientiList] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [debugItems, setDebugItems] = useState<any[]>([])

  const isDebugAllowed = isAdmin && isDebugEnabled && !isDebugConfigLoading

  const { startDate, endDate } = useMemo(() => {
    let start: Date, end: Date
    switch (view) {
      case "daily":
        start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(currentDate)
        end.setHours(23, 59, 59, 999)
        break
      case "weekly":
        start = startOfWeek(currentDate, { weekStartsOn: 1 })
        start.setHours(0, 0, 0, 0)
        end = endOfWeek(currentDate, { weekStartsOn: 1 })
        end.setHours(23, 59, 59, 999)
        break
      case "monthly":
        start = startOfMonth(currentDate)
        start.setHours(0, 0, 0, 0)
        end = endOfMonth(currentDate)
        end.setHours(23, 59, 59, 999)
        break
      default:
        start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(currentDate)
        end.setHours(23, 59, 59, 999)
    }
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      if (isDebugAllowed) console.error("startDate non è un oggetto Date valido", start)
      start = new Date()
      start.setHours(0, 0, 0, 0)
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      if (isDebugAllowed) console.error("endDate non è un oggetto Date valido", end)
      end = new Date()
      end.setHours(23, 59, 59, 999)
    }
    conditionalLog(
      "AgendaWidget - Date calcolate:",
      { view, currentDate: currentDate.toISOString(), startDate: start.toISOString(), endDate: end.toISOString() },
      isDebugAllowed,
    )
    return { startDate: start, endDate: end }
  }, [currentDate, view, isDebugAllowed])

  const addLog = useCallback(
    (message: string) => {
      if (isDebugAllowed) setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
    },
    [isDebugAllowed],
  )

  const { items, isLoading, error, tableStats } = useAgendaItems(startDate, endDate)

  useEffect(() => {
    if (items && items.length > 0 && isDebugAllowed) {
      const invalidItems = checkInvalidDates(items)
      if (invalidItems.length > 0) {
        console.warn("AgendaWidget - Elementi con date non valide:", invalidItems)
        addLog(`Trovati ${invalidItems.length} elementi con date non valide`)
      }
      const debugData = items.map((item) => ({
        id: item.id,
        titolo: item.titolo,
        tipo: item.tipo,
        generale: item.generale,
        data_inizio: formatDateForDebug(item.data_inizio),
        data_fine: formatDateForDebug(item.data_fine),
        data_scadenza: formatDateForDebug(item.data_scadenza),
        tabella_origine: item.tabella_origine,
        matchesCurrentDate: item.data_inizio instanceof Date && isSameDay(item.data_inizio, currentDate),
      }))
      setDebugItems(debugData)
      conditionalLog("AgendaWidget - Dettagli elementi:", debugData, isDebugAllowed)
      addLog(
        `Caricati ${items.length} elementi, di cui ${debugData.filter((i) => i.matchesCurrentDate).length} corrispondono alla data corrente`,
      )
    }
  }, [items, currentDate, isDebugAllowed, addLog])

  useEffect(() => {
    if (isDebugAllowed) {
      addLog(`Selected date: ${currentDate.toISOString()}`)
      addLog(`View: ${view}`)
      if (items) {
        addLog(`Items count: ${items.length}`)
        if (items.length > 0)
          addLog(
            `First item: ${JSON.stringify({ id: items[0].id, titolo: items[0].titolo, tipo: items[0].tipo, data_inizio: formatDateForDebug(items[0].data_inizio) })}`,
          )
      }
    }
  }, [currentDate, view, items, isDebugAllowed, addLog])

  useMemo(() => {
    if (items.length > 0) {
      const clienti = [...new Set(items.map((item) => item.cliente).filter(Boolean))] as string[]
      setClientiList(clienti)
    }
  }, [items])

  const filteredItems = useMemo(() => {
    // Guard against user being null during auth loading or if not authenticated
    if (authIsLoading || !user) {
      return [] // Return empty array if user is not available yet
    }
    return items.filter((item) => {
      let passesTypeFilter = false
      switch (item.tipo) {
        case "attivita":
          passesTypeFilter = filters.attivita
          break
        case "progetto":
          passesTypeFilter = filters.progetti
          break
        case "appuntamento":
          passesTypeFilter = filters.appuntamenti
          break
        case "scadenza":
          if (item.generale) {
            // user is guaranteed to be non-null here due to the guard above
            if (user.id === 1) {
              // Check user.id directly
              if (isDebugAllowed)
                console.log("Filtro: utente 1 non dovrebbe vedere scadenze generali qui (già filtrate)")
              passesTypeFilter = false
            } else {
              passesTypeFilter = filters.scadenze_generali
            }
          } else {
            passesTypeFilter = filters.scadenze
          }
          break
        case "todolist":
          passesTypeFilter = filters.todo
          break
        default:
          passesTypeFilter = true
      }
      const passesSearchFilter =
        searchTerm === "" ||
        (item.titolo && item.titolo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.descrizione && item.descrizione.toLowerCase().includes(searchTerm.toLowerCase()))
      const passesClienteFilter = !clienteFilter || item.cliente === clienteFilter
      return passesTypeFilter && passesSearchFilter && passesClienteFilter
    })
  }, [items, filters, searchTerm, clienteFilter, user, authIsLoading, isDebugAllowed]) // Added authIsLoading and user

  const navigatePrevious = () => {
    switch (view) {
      case "daily":
        setCurrentDate((prev) => addDays(prev, -1))
        break
      case "weekly":
        setCurrentDate((prev) => subWeeks(prev, 1))
        break
      case "monthly":
        setCurrentDate((prev) => subMonths(prev, 1))
        break
    }
  }
  const navigateNext = () => {
    switch (view) {
      case "daily":
        setCurrentDate((prev) => addDays(prev, 1))
        break
      case "weekly":
        setCurrentDate((prev) => addWeeks(prev, 1))
        break
      case "monthly":
        setCurrentDate((prev) => addMonths(prev, 1))
        break
    }
  }
  const navigateToday = () => {
    setCurrentDate(new Date())
  }
  const exportAgenda = () => {
    alert("Funzionalità di esportazione in fase di sviluppo")
  }

  useEffect(() => {
    conditionalLog(
      "Periodo selezionato:",
      { view, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      isDebugAllowed,
    )
  }, [view, startDate, endDate, isDebugAllowed])

  useEffect(() => {
    conditionalLog(
      "Elementi filtrati:",
      {
        total: filteredItems.length,
        byType: {
          attivita: filteredItems.filter((item) => item.tipo === "attivita").length,
          progetto: filteredItems.filter((item) => item.tipo === "progetto").length,
          appuntamento: filteredItems.filter((item) => item.tipo === "appuntamento").length,
          scadenza: filteredItems.filter((item) => item.tipo === "scadenza" && !item.generale).length,
          scadenza_generale: filteredItems.filter((item) => item.tipo === "scadenza" && item.generale).length,
          todolist: filteredItems.filter((item) => item.tipo === "todolist").length,
        },
      },
      isDebugAllowed,
    )
  }, [filteredItems, isDebugAllowed])

  useEffect(() => {
    return () => {
      if (isDebugAllowed) console.log("AgendaWidget unmounted - cleaning up")
    }
  }, [isDebugAllowed])

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <CardTitle className="text-xl whitespace-nowrap">Agenda</CardTitle>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToday}>
              {" "}
              Oggi{" "}
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {isDebugAllowed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className={showDebug ? "bg-blue-100" : ""}
              >
                <Bug className="h-4 w-4 mr-1 sm:mr-1" />
                <span className={mode === "mobile" ? "hidden sm:inline" : ""}>Debug</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-2">
            <Tabs
              defaultValue={mode === "mobile" ? "daily" : "daily"}
              value={view}
              onValueChange={(v) => setView(v as any)}
            >
              <TabsList
                className={cn(
                  mode === "mobile"
                    ? "grid w-full grid-cols-2"
                    : "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
                  // For desktop, we use the default shadcn/ui classes for TabsList or simply 'inline-flex' if you want minimal styling.
                  // The default classes provide the standard look and feel.
                )}
              >
                <TabsTrigger value="daily" className="flex items-center gap-1 text-xs sm:text-sm">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Giorno
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs sm:text-sm">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Settimana
                </TabsTrigger>
                {mode === "desktop" && (
                  <TabsTrigger value="monthly" className="flex items-center gap-1 text-xs sm:text-sm">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Mese
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Cerca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                  aria-label="Cerca nell'agenda"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" /> Filtri
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <div className="font-medium mb-2">Tipi di elementi</div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-attivita"
                          checked={filters.attivita}
                          onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, attivita: !!checked }))}
                        />
                        <Label htmlFor="filter-attivita" className="text-sm">
                          Attività
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-progetti"
                          checked={filters.progetti}
                          onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, progetti: !!checked }))}
                        />
                        <Label htmlFor="filter-progetti" className="text-sm">
                          Progetti
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-appuntamenti"
                          checked={filters.appuntamenti}
                          onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, appuntamenti: !!checked }))}
                        />
                        <Label htmlFor="filter-appuntamenti" className="text-sm">
                          Appuntamenti
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-scadenze"
                          checked={filters.scadenze}
                          onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, scadenze: !!checked }))}
                        />
                        <Label htmlFor="filter-scadenze" className="text-sm flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Scadenze personali
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-scadenze-generali"
                          checked={filters.scadenze_generali}
                          onCheckedChange={(checked) =>
                            setFilters((prev) => ({ ...prev, scadenze_generali: !!checked }))
                          }
                        />
                        <Label htmlFor="filter-scadenze-generali" className="text-sm flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          Scadenze generali
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="filter-todo"
                          checked={filters.todo}
                          onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, todo: !!checked }))}
                        />
                        <Label htmlFor="filter-todo" className="text-sm">
                          Todo
                        </Label>
                      </div>
                    </div>
                    {clientiList.length > 0 && (
                      <>
                        <div className="font-medium mt-4 mb-2">Cliente</div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="filter-cliente-tutti"
                              checked={clienteFilter === null}
                              onCheckedChange={() => setClienteFilter(null)}
                            />
                            <Label htmlFor="filter-cliente-tutti" className="text-sm">
                              Tutti i clienti
                            </Label>
                          </div>
                          {clientiList.map((cliente) => (
                            <div key={cliente} className="flex items-center space-x-2">
                              <Checkbox
                                id={`filter-cliente-${cliente}`}
                                checked={clienteFilter === cliente}
                                onCheckedChange={() => setClienteFilter(cliente)}
                              />
                              <Label htmlFor={`filter-cliente-${cliente}`} className="text-sm">
                                {cliente}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {mode === "desktop" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAgenda}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" /> Esporta
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>
                Si è verificato un errore nel caricamento degli elementi: {error.message}
              </AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_,
