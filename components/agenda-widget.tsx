"use client"

import { useMemo } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  isToday,
} from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, Globe, User, Calendar, CheckSquare, Target, Briefcase } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { AgendaItem } from "@/hooks/use-agenda-items"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Cookie management per salvare la vista selezionata - SOSTITUITO CON LOCALSTORAGE
const AGENDA_VIEW_STORAGE_KEY = "agenda_view_preference"

const saveViewPreference = (view: "daily" | "weekly" | "monthly") => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(AGENDA_VIEW_STORAGE_KEY, view)
    }
  } catch (error) {
    console.warn("Impossibile salvare la preferenza della vista agenda:", error)
  }
}

const getViewPreference = (): "daily" | "weekly" | "monthly" => {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(AGENDA_VIEW_STORAGE_KEY)
      if (saved && (saved === "daily" || saved === "weekly" || saved === "monthly")) {
        return saved
      }
    }
  } catch (error) {
    console.warn("Impossibile leggere la preferenza della vista agenda:", error)
  }
  return "daily" // Default
}

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

// Componente per il menu di creazione nuovo elemento
const NewItemMenu = ({ day, onClose }: { day: Date; onClose: () => void }) => {
  const router = useRouter()

  const handleNewItem = (type: string) => {
    // Formatta la data per il passaggio come parametro
    const dateParam = format(day, "yyyy-MM-dd")

    // Mappa i tipi alle tabelle corrette in data-explorer
    const tableMap = {
      appuntamento: "appuntamenti",
      attivita: "attivita",
      todolist: "todolist",
      scadenza: "scadenze",
      progetto: "progetti",
    }

    const tableName = tableMap[type as keyof typeof tableMap]

    if (tableName) {
      // Naviga alla pagina specifica per creare nuovo elemento nella tabella corretta
      router.push(`/data-explorer/${tableName}/new?date=${dateParam}`)
    } else {
      console.error(`Tipo non riconosciuto: ${type}`)
    }

    onClose()
  }

  return (
    <div className="space-y-2 p-2">
      <div className="font-semibold text-sm mb-2">Nuovo elemento per {format(day, "d MMMM yyyy", { locale: it })}</div>

      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleNewItem("appuntamento")}>
        <Calendar className="h-4 w-4 mr-2" />
        Nuovo Appuntamento
      </Button>

      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleNewItem("attivita")}>
        <Target className="h-4 w-4 mr-2" />
        Nuova Attività
      </Button>

      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleNewItem("todolist")}>
        <CheckSquare className="h-4 w-4 mr-2" />
        Nuova Todolist
      </Button>

      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleNewItem("scadenza")}>
        <AlertCircle className="h-4 w-4 mr-2" />
        Nuova Scadenza
      </Button>

      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleNewItem("progetto")}>
        <Briefcase className="h-4 w-4 mr-2" />
        Nuovo Progetto
      </Button>
    </div>
  )
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
          {/* Tipo in verticale ruotato di 90° */}
          <div className="bg-black text-white text-[8px] font-bold flex items-center justify-center px-0.5 w-4">
            <span className="transform rotate-90 whitespace-nowrap">{typeAbbr}</span>
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
    <div className="flex flex-wrap gap-2 mt-2">
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
                p-1 rounded-md border text-sm
                ${isToday(day) ? "bg-blue-50 border-blue-200" : ""}
                ${!isCurrentMonth ? "bg-gray-100 text-gray-400" : ""}
              `}
              style={{
                minHeight: "120px", // ALTEZZA CELLE MENSILI: Modifica questo valore per cambiare l'altezza delle celle (es: 100px, 140px, 160px)
              }}
            >
              {/* Numero del giorno con background invertito e menu per nuovo elemento */}
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "text-right font-medium mb-1 text-xs cursor-pointer rounded transition-colors",
                      "px-1.5 py-0.5", // PADDING NUMERO GIORNO: Modifica questi valori per cambiare il padding (es: px-2 py-1, px-1 py-0.5)
                      isCurrentMonth
                        ? "bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300" // COLORI INVERTITI: Modifica questi colori per personalizzare l'aspetto
                        : "bg-gray-400 text-white hover:bg-gray-500",
                    )}
                    title="Clicca per aggiungere nuovo elemento"
                  >
                    {format(day, "d")}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="bottom" align="start">
                  <NewItemMenu day={day} onClose={() => {}} />
                </PopoverContent>
              </Popover>

              <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
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
                              {/* Tipo in verticale ruotato di 90° */}
                              <div className="bg-black text-white text-[6px] font-bold flex items-center justify-center px-0.5 w-4">
                                <span className="transform rotate-90 whitespace-nowrap">{typeAbbr}</span>
                              </div>

                              {/* Contenuto principale */}
                              <div className="flex-1 p-1.5">
                                <div className="font-medium text-gray-800 truncate flex items-center text-xs">
                                  {item.generale && (
                                    <Globe className="h-2.5 w-2.5 mr-0.5 text-gray-700 flex-shrink-0" />
                                  )}
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
                        </Popover>
                      )
                    })
                  : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
