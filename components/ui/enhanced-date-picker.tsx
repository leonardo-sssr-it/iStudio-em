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
}

// 🔧 FUNZIONI NATIVE SENZA TIMEZONE - IDENTICHE A QUELLE NEI FILE DI DETTAGLIO
function formatDateTimeForInput(dateString: string): string {
  if (!dateString) return ""
  try {
    // Parsing della data ISO senza conversione timezone
    const date = new Date(dateString)

    // Ottieni i componenti della data in locale (senza timezone)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")

    // Arrotonda i minuti al multiplo di 5 più vicino
    const minutes = Math.round(date.getMinutes() / 5) * 5
    const formattedMinutes = String(minutes).padStart(2, "0")

    // Formato per datetime-local: YYYY-MM-DDTHH:MM (senza timezone)
    return `${year}-${month}-${day}T${hours}:${formattedMinutes}`
  } catch (error) {
    console.error("Errore nel formato data:", error)
    return ""
  }
}

function parseDateTimeFromInput(inputValue: string): string {
  if (!inputValue) return ""
  try {
    // Parsing diretto del valore datetime-local (già in formato locale)
    const [datePart, timePart] = inputValue.split("T")
    const [year, month, day] = datePart.split("-").map(Number)
    const [hours, minutes] = timePart.split(":").map(Number)

    // Arrotonda i minuti al multiplo di 5 più vicino
    const roundedMinutes = Math.round(minutes / 5) * 5

    // Crea la data in locale (senza conversione timezone)
    const date = new Date(year, month - 1, day, hours, roundedMinutes, 0, 0)

    // Converte in ISO string mantenendo il tempo locale
    const isoString =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0") +
      "T" +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0") +
      ":00.000Z"

    return isoString
  } catch (error) {
    console.error("Errore nel parsing data:", error)
    return ""
  }
}

// 🔧 FUNZIONE PER CREARE DATA LOCALE SENZA TIMEZONE
function createLocalDate(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

// 🔧 FUNZIONE PER CONVERTIRE DATA IN ISO SENZA TIMEZONE
function dateToLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "Seleziona data e ora",
  disabled = false,
  className,
  id,
  showCurrentTime = false,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined)
  const [timeValue, setTimeValue] = React.useState("")

  const [tempDate, setTempDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined)
  const [tempTime, setTempTime] = React.useState("")

  // 🔧 GENERA LE OPZIONI PER I MINUTI IN MULTIPLI DI 5
  const generateMinuteOptions = (): string[] => {
    const options: string[] = []
    for (let i = 0; i < 60; i += 5) {
      options.push(i.toString().padStart(2, "0"))
    }
    return options
  }

  // 🔧 ARROTONDA I MINUTI AI MULTIPLI DI 5
  const roundToNearestFiveMinutes = (minutes: number): number => {
    return Math.round(minutes / 5) * 5
  }

  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      setTempDate(date)
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = roundToNearestFiveMinutes(date.getMinutes()).toString().padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
      setTempTime(`${hours}:${minutes}`)
    } else {
      setSelectedDate(undefined)
      setTempDate(undefined)
      setTimeValue("")
      setTempTime("")
    }
  }, [value])

  React.useEffect(() => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0")
      const minutes = roundToNearestFiveMinutes(selectedDate.getMinutes()).toString().padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
    } else {
      setTimeValue("")
    }
  }, [selectedDate])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      let currentHours, currentMinutes
      if (showCurrentTime && !value) {
        const now = new Date()
        currentHours = now.getHours()
        currentMinutes = roundToNearestFiveMinutes(now.getMinutes())
      } else {
        currentHours = tempDate ? tempDate.getHours() : new Date().getHours()
        currentMinutes = tempDate
          ? roundToNearestFiveMinutes(tempDate.getMinutes())
          : roundToNearestFiveMinutes(new Date().getMinutes())
      }

      // 🔧 CREA DATA LOCALE SENZA TIMEZONE
      const newDate = createLocalDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        currentHours,
        currentMinutes,
      )

      setTempDate(newDate)

      if (!tempTime || (showCurrentTime && !value)) {
        const hours = newDate.getHours().toString().padStart(2, "0")
        const minutes = newDate.getMinutes().toString().padStart(2, "0")
        setTempTime(`${hours}:${minutes}`)
      }
    } else {
      setTempDate(undefined)
    }
  }

  const handleTimeChange = (timeString: string) => {
    if (timeString && timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":").map(Number)
      const roundedMinutes = roundToNearestFiveMinutes(minutes)
      const adjustedTimeString = `${hours.toString().padStart(2, "0")}:${roundedMinutes.toString().padStart(2, "0")}`
      setTempTime(adjustedTimeString)
    } else {
      setTempTime(timeString)
    }
  }

  const handleTimeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const [hours, minutes] = tempTime.split(":").map(Number)

    if (e.key === "Enter") {
      e.preventDefault()
      confirmSelection()
      return
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()

      const increment = e.key === "ArrowUp" ? 5 : -5
      const cursorPosition = input.selectionStart || 0

      let newHours = hours
      let newMinutes = minutes

      if (cursorPosition <= 2) {
        newHours = Math.max(0, Math.min(23, hours + (increment > 0 ? 1 : -1)))
      } else {
        newMinutes = minutes + increment
        if (newMinutes >= 60) {
          newMinutes = 0
          newHours = Math.min(23, hours + 1)
        } else if (newMinutes < 0) {
          newMinutes = 55
          newHours = Math.max(0, hours - 1)
        }
      }

      const newTimeString = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`
      setTempTime(newTimeString)
    }
  }

  const setCurrentDateTime = () => {
    const now = new Date()
    const minutes = roundToNearestFiveMinutes(now.getMinutes())

    // 🔧 CREA DATA LOCALE SENZA TIMEZONE
    const currentDate = createLocalDate(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), minutes)

    setTempDate(currentDate)
    setTempTime(
      `${currentDate.getHours().toString().padStart(2, "0")}:${currentDate.getMinutes().toString().padStart(2, "0")}`,
    )
  }

  const clearDateTime = () => {
    setTempDate(undefined)
    setTempTime("")
  }

  const confirmSelection = () => {
    if (tempDate && tempTime && tempTime.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = tempTime.split(":").map(Number)

      // 🔧 CREA DATA FINALE LOCALE SENZA TIMEZONE
      const finalDate = createLocalDate(
        tempDate.getFullYear(),
        tempDate.getMonth() + 1,
        tempDate.getDate(),
        hours,
        roundToNearestFiveMinutes(minutes),
      )

      setSelectedDate(finalDate)

      // 🔧 CONVERTE IN ISO SENZA TIMEZONE
      const localISOString = dateToLocalISOString(finalDate)
      console.log("🔧 Data selezionata (senza timezone):", localISOString)
      onChange(localISOString)
    } else if (!tempDate && !tempTime) {
      setSelectedDate(undefined)
      onChange("")
    }
    setOpen(false)
  }

  const cancelSelection = () => {
    setTempDate(selectedDate)
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0")
      const minutes = roundToNearestFiveMinutes(selectedDate.getMinutes()).toString().padStart(2, "0")
      setTempTime(`${hours}:${minutes}`)
    } else {
      setTempTime("")
    }
    setOpen(false)
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(!open)
    }
  }

  React.useEffect(() => {
    if (showCurrentTime && !value && open && !tempDate) {
      setCurrentDateTime()
    }
  }, [showCurrentTime, value, open, tempDate])

  const modifiers = React.useMemo(() => {
    const today = new Date()
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
                <span>{timeValue}</span>
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
              <Label htmlFor={`${id}-time-popover`} className="text-sm font-medium">
                Ora:
              </Label>
              <div className="flex gap-1">
                <select
                  value={tempTime.split(":")[0] || "00"}
                  onChange={(e) => {
                    const hours = e.target.value
                    const minutes = tempTime.split(":")[1] || "00"
                    setTempTime(`${hours}:${minutes}`)
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={disabled || !tempDate}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="py-1">:</span>
                <select
                  value={tempTime.split(":")[1] || "00"}
                  onChange={(e) => {
                    const hours = tempTime.split(":")[0] || "00"
                    const minutes = e.target.value
                    setTempTime(`${hours}:${minutes}`)
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={disabled || !tempDate}
                >
                  {generateMinuteOptions().map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              ⏰ Minuti disponibili: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={setCurrentDateTime} className="flex-1 bg-transparent">
                <Clock className="mr-2 h-4 w-4" />
                Ora
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
