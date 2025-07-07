"use client"

import * as React from "react"
import { format, parseISO, isToday, isSameDay } from "date-fns"
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
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [timeValue, setTimeValue] = React.useState("")
  const [tempDate, setTempDate] = React.useState<Date | undefined>()
  const [tempTime, setTempTime] = React.useState("")

  // Inizializza i valori quando cambia il value prop
  React.useEffect(() => {
    if (value) {
      try {
        const date = parseISO(value)
        setSelectedDate(date)
        setTempDate(date)
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        const timeStr = `${hours}:${minutes}`
        setTimeValue(timeStr)
        setTempTime(timeStr)
      } catch (error) {
        console.error("Errore nel parsing della data:", error)
        setSelectedDate(undefined)
        setTempDate(undefined)
        setTimeValue("")
        setTempTime("")
      }
    } else {
      setSelectedDate(undefined)
      setTempDate(undefined)
      setTimeValue("")
      setTempTime("")
    }
  }, [value])

  // Funzione per arrotondare i minuti ai multipli di 5
  const roundToNearestFiveMinutes = (minutes: number): number => {
    return Math.round(minutes / 5) * 5
  }

  // Genera le opzioni per i minuti in multipli di 5
  const generateMinuteOptions = (): string[] => {
    const options: string[] = []
    for (let i = 0; i < 60; i += 5) {
      options.push(i.toString().padStart(2, "0"))
    }
    return options
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      let currentHours, currentMinutes

      if (showCurrentTime && !value) {
        // Se showCurrentTime è true e non c'è un valore, usa l'ora corrente
        const now = new Date()
        currentHours = now.getHours()
        currentMinutes = roundToNearestFiveMinutes(now.getMinutes())
      } else if (tempDate) {
        // Se c'è già una data temporanea, mantieni l'ora
        currentHours = tempDate.getHours()
        currentMinutes = tempDate.getMinutes()
      } else {
        // Altrimenti usa l'ora corrente
        const now = new Date()
        currentHours = now.getHours()
        currentMinutes = roundToNearestFiveMinutes(now.getMinutes())
      }

      const newDate = new Date(date)
      newDate.setHours(currentHours)
      newDate.setMinutes(currentMinutes)
      newDate.setSeconds(0)
      newDate.setMilliseconds(0)

      setTempDate(newDate)

      // Aggiorna anche il tempo temporaneo se non è già impostato
      if (!tempTime) {
        const hours = newDate.getHours().toString().padStart(2, "0")
        const minutes = newDate.getMinutes().toString().padStart(2, "0")
        setTempTime(`${hours}:${minutes}`)
      }
    } else {
      setTempDate(undefined)
    }
  }

  const setCurrentDateTime = () => {
    const now = new Date()
    const minutes = roundToNearestFiveMinutes(now.getMinutes())
    now.setMinutes(minutes)
    now.setSeconds(0)
    now.setMilliseconds(0)
    setTempDate(now)
    setTempTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`)
  }

  const clearDateTime = () => {
    setTempDate(undefined)
    setTempTime("")
  }

  const confirmSelection = () => {
    if (tempDate && tempTime && tempTime.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = tempTime.split(":").map(Number)

      // Crea una nuova data senza conversione timezone
      const finalDate = new Date(tempDate)
      finalDate.setHours(hours)
      finalDate.setMinutes(minutes)
      finalDate.setSeconds(0)
      finalDate.setMilliseconds(0)

      setSelectedDate(finalDate)

      // Formatta la data manualmente senza conversione timezone
      const year = finalDate.getFullYear()
      const month = String(finalDate.getMonth() + 1).padStart(2, "0")
      const day = String(finalDate.getDate()).padStart(2, "0")
      const hour = String(finalDate.getHours()).padStart(2, "0")
      const minute = String(finalDate.getMinutes()).padStart(2, "0")
      const second = String(finalDate.getSeconds()).padStart(2, "0")

      // Formato ISO locale senza timezone (YYYY-MM-DDTHH:mm:ss)
      const localISOString = `${year}-${month}-${day}T${hour}:${minute}:${second}`

      console.log(`[EnhancedDatePicker] Data confermata: ${localISOString}`)
      onChange(localISOString)
    } else if (!tempDate && !tempTime) {
      setSelectedDate(undefined)
      onChange("")
    }
    setOpen(false)
  }

  const cancelSelection = () => {
    // Ripristina i valori originali
    setTempDate(selectedDate)
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0")
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0")
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

  // Inizializza tempDate e tempTime quando si apre il popover
  React.useEffect(() => {
    if (open) {
      if (selectedDate) {
        setTempDate(selectedDate)
        const hours = selectedDate.getHours().toString().padStart(2, "0")
        const minutes = selectedDate.getMinutes().toString().padStart(2, "0")
        setTempTime(`${hours}:${minutes}`)
      } else if (showCurrentTime) {
        setCurrentDateTime()
      }
    }
  }, [open, selectedDate, showCurrentTime])

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
                    // Assicurati che i minuti siano sempre multipli di 5
                    const roundedMinutes = roundToNearestFiveMinutes(Number.parseInt(minutes))
                      .toString()
                      .padStart(2, "0")
                    setTempTime(`${hours}:${roundedMinutes}`)
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
