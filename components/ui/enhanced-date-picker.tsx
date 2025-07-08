"use client"

import * as React from "react"
import { format, isToday, isSameDay } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

interface EnhancedDatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  showCurrentTime?: boolean
  onDateTimeSet?: (startDateTime: string) => void // Callback per impostare data_fine
}

// 🔧 FUNZIONE PER CREARE DATA LOCALE PURA (SENZA TIMEZONE)
function createPureLocalDate(year: number, month: number, day: number, hours: number, minutes: number): Date {
  const date = new Date()
  date.setFullYear(year)
  date.setMonth(month - 1) // month è 1-based, setMonth è 0-based
  date.setDate(day)
  date.setHours(hours)
  date.setMinutes(minutes)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

// 🔧 FUNZIONE PER CONVERTIRE DATA IN ISO LOCALE (SENZA TIMEZONE)
function dateToLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`
}

// 🔧 FUNZIONE PER PARSARE ISO IN DATA LOCALE (SENZA TIMEZONE)
function parseLocalISOString(isoString: string): Date | null {
  if (!isoString) return null

  try {
    // Estrai componenti dalla stringa ISO
    const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!match) return null

    const [, year, month, day, hours, minutes, seconds] = match
    return createPureLocalDate(
      Number.parseInt(year),
      Number.parseInt(month),
      Number.parseInt(day),
      Number.parseInt(hours),
      Number.parseInt(minutes),
    )
  } catch (error) {
    console.error("Errore nel parsing ISO locale:", error)
    return null
  }
}

// 🔧 GENERA SOLO I MINUTI IN MULTIPLI DI 5
const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

// 🔧 ARROTONDA I MINUTI AL MULTIPLO DI 5 PIÙ VICINO
function roundToNearestFiveMinutes(minutes: number): number {
  return Math.round(minutes / 5) * 5
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "Seleziona data e ora",
  disabled = false,
  className,
  id,
  showCurrentTime = false,
  onDateTimeSet,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [tempDate, setTempDate] = React.useState<Date | undefined>()
  const [tempHours, setTempHours] = React.useState("00")
  const [tempMinutes, setTempMinutes] = React.useState("00")

  // Inizializza i valori dal prop value
  React.useEffect(() => {
    if (value) {
      const date = parseLocalISOString(value)
      if (date) {
        setSelectedDate(date)
        setTempDate(date)
        setTempHours(date.getHours().toString().padStart(2, "0"))
        setTempMinutes(roundToNearestFiveMinutes(date.getMinutes()).toString().padStart(2, "0"))
      }
    } else {
      setSelectedDate(undefined)
      setTempDate(undefined)
      setTempHours("00")
      setTempMinutes("00")
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Crea una nuova data locale pura
      const newDate = createPureLocalDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        Number.parseInt(tempHours),
        Number.parseInt(tempMinutes),
      )
      setTempDate(newDate)

      // Se è la prima selezione e showCurrentTime è true, imposta l'ora corrente
      if (showCurrentTime && !tempDate) {
        const now = new Date()
        const currentHours = now.getHours().toString().padStart(2, "0")
        const currentMinutes = roundToNearestFiveMinutes(now.getMinutes()).toString().padStart(2, "0")
        setTempHours(currentHours)
        setTempMinutes(currentMinutes)
      }
    } else {
      setTempDate(undefined)
    }
  }

  const setCurrentDateTime = () => {
    const now = new Date()
    const currentDate = createPureLocalDate(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      roundToNearestFiveMinutes(now.getMinutes()),
    )

    setTempDate(currentDate)
    setTempHours(now.getHours().toString().padStart(2, "0"))
    setTempMinutes(roundToNearestFiveMinutes(now.getMinutes()).toString().padStart(2, "0"))
  }

  const clearDateTime = () => {
    setTempDate(undefined)
    setTempHours("00")
    setTempMinutes("00")
  }

  const confirmSelection = () => {
    if (tempDate) {
      // Crea la data finale con ore e minuti selezionati
      const finalDate = createPureLocalDate(
        tempDate.getFullYear(),
        tempDate.getMonth() + 1,
        tempDate.getDate(),
        Number.parseInt(tempHours),
        Number.parseInt(tempMinutes),
      )

      setSelectedDate(finalDate)

      // Converte in ISO locale
      const localISOString = dateToLocalISOString(finalDate)
      console.log("🔧 Data confermata (locale pura):", localISOString)

      onChange(localISOString)

      // Se c'è il callback per impostare data_fine, chiamalo con data_inizio + 1 ora
      if (onDateTimeSet) {
        const endDate = createPureLocalDate(
          finalDate.getFullYear(),
          finalDate.getMonth() + 1,
          finalDate.getDate(),
          finalDate.getHours() + 1, // +1 ora
          finalDate.getMinutes(),
        )
        const endISOString = dateToLocalISOString(endDate)
        console.log("🔧 Data fine calcolata (+1 ora):", endISOString)
        onDateTimeSet(endISOString)
      }
    } else if (!tempDate) {
      setSelectedDate(undefined)
      onChange("")
    }
    setOpen(false)
  }

  const cancelSelection = () => {
    if (selectedDate) {
      setTempDate(selectedDate)
      setTempHours(selectedDate.getHours().toString().padStart(2, "0"))
      setTempMinutes(roundToNearestFiveMinutes(selectedDate.getMinutes()).toString().padStart(2, "0"))
    } else {
      setTempDate(undefined)
      setTempHours("00")
      setTempMinutes("00")
    }
    setOpen(false)
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(!open)
    }
  }

  // Imposta ora corrente quando si apre il popover per la prima volta
  React.useEffect(() => {
    if (showCurrentTime && !value && open && !tempDate) {
      setCurrentDateTime()
    }
  }, [showCurrentTime, value, open, tempDate])

  const modifiers = React.useMemo(() => {
    return {
      today: (date: Date) => isToday(date),
      selected: (date: Date) => (tempDate ? isSameDay(date, tempDate) : false),
    }
  }, [tempDate])

  const modifiersStyles = React.useMemo(
    () => ({
      today: {
        backgroundColor: "#dcfce7",
        color: "#166534",
        fontWeight: "bold",
      },
      selected: {
        backgroundColor: "#22c55e",
        color: "white",
        fontWeight: "bold",
      },
    }),
    [],
  )

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            disabled={disabled}
            onKeyDown={handleTriggerKeyDown}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              <div className="flex items-center gap-2">
                <span>{format(selectedDate, "PPP", { locale: it })}</span>
                <span className="text-muted-foreground">•</span>
                <span>
                  {selectedDate.getHours().toString().padStart(2, "0")}:
                  {roundToNearestFiveMinutes(selectedDate.getMinutes()).toString().padStart(2, "0")}
                </span>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={tempDate}
            onSelect={handleDateSelect}
            disabled={disabled}
            initialFocus
            locale={it}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
          />
          <div className="p-3 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Ora:</Label>
              <div className="flex gap-1 items-center">
                <select
                  value={tempHours}
                  onChange={(e) => setTempHours(e.target.value)}
                  className="px-2 py-1 border rounded text-sm min-w-[50px]"
                  disabled={disabled || !tempDate}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, "0")
                    return (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    )
                  })}
                </select>
                <span className="text-sm font-medium">:</span>
                <select
                  value={tempMinutes}
                  onChange={(e) => setTempMinutes(e.target.value)}
                  className="px-2 py-1 border rounded text-sm min-w-[50px]"
                  disabled={disabled || !tempDate}
                >
                  {MINUTE_OPTIONS.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              ⏰ Minuti disponibili: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={setCurrentDateTime} className="flex-1 bg-transparent">
                <Clock className="mr-2 h-4 w-4" />
                Ora attuale
              </Button>
              <Button variant="outline" size="sm" onClick={clearDateTime} className="flex-1 bg-transparent">
                Cancella
              </Button>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={cancelSelection} className="flex-1 bg-transparent">
                Annulla
              </Button>
              <Button size="sm" onClick={confirmSelection} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="mr-2 h-4 w-4" />
                Conferma
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
