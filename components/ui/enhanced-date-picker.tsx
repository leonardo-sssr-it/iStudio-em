"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnhancedDatePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  showCurrentTime?: boolean
  onDateTimeSet?: (dateTime: string) => void
}

// Funzione per arrotondare ai 5 minuti successivi
function roundToNext5Minutes(date: Date = new Date()): Date {
  const minutes = date.getMinutes()
  const roundedMinutes = Math.ceil(minutes / 5) * 5
  const newDate = new Date(date)
  newDate.setMinutes(roundedMinutes, 0, 0)

  // Se abbiamo superato i 60 minuti, aggiungi un'ora
  if (roundedMinutes >= 60) {
    newDate.setHours(newDate.getHours() + 1)
    newDate.setMinutes(0, 0, 0)
  }

  return newDate
}

export function EnhancedDatePicker({
  id,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  placeholder = "Seleziona data e ora",
  showCurrentTime = false,
  onDateTimeSet,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedHour, setSelectedHour] = React.useState<string>("")
  const [selectedMinute, setSelectedMinute] = React.useState<string>("")

  // Inizializza con il valore corrente o l'ora attuale arrotondata
  React.useEffect(() => {
    if (value && value.trim()) {
      try {
        const date = parseISO(value)
        if (isValid(date)) {
          setSelectedDate(date)
          setSelectedHour(date.getHours().toString().padStart(2, "0"))
          setSelectedMinute(date.getMinutes().toString().padStart(2, "0"))
          return
        }
      } catch (error) {
        console.warn("Data non valida:", value)
      }
    }

    // Se showCurrentTime è true e non c'è un valore valido, usa l'ora corrente
    if (showCurrentTime && (!value || !value.trim())) {
      const now = roundToNext5Minutes()
      setSelectedDate(now)
      setSelectedHour(now.getHours().toString().padStart(2, "0"))
      setSelectedMinute(now.getMinutes().toString().padStart(2, "0"))
    }
  }, [value, showCurrentTime])

  // Genera le opzioni per le ore (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

  // Genera le opzioni per i minuti (multipli di 5)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)

    // Se non abbiamo ore/minuti selezionati, usa l'ora corrente arrotondata
    if (!selectedHour || !selectedMinute) {
      const now = roundToNext5Minutes()
      const hour = now.getHours().toString().padStart(2, "0")
      const minute = now.getMinutes().toString().padStart(2, "0")
      setSelectedHour(hour)
      setSelectedMinute(minute)

      // Combina data e ora
      const combined = new Date(date)
      combined.setHours(now.getHours(), now.getMinutes(), 0, 0)

      if (onChange) {
        onChange(combined.toISOString())
      }

      // Callback per impostare automaticamente data_fine
      if (onDateTimeSet) {
        const endDateTime = new Date(combined.getTime() + 60 * 60 * 1000) // +1 ora
        onDateTimeSet(endDateTime.toISOString())
      }
    } else {
      // Usa ore/minuti già selezionati
      const combined = new Date(date)
      combined.setHours(Number.parseInt(selectedHour), Number.parseInt(selectedMinute), 0, 0)

      if (onChange) {
        onChange(combined.toISOString())
      }
    }
  }

  const handleTimeChange = (hour?: string, minute?: string) => {
    const newHour = hour || selectedHour
    const newMinute = minute || selectedMinute

    if (hour) setSelectedHour(hour)
    if (minute) setSelectedMinute(minute)

    if (selectedDate && newHour && newMinute) {
      const combined = new Date(selectedDate)
      combined.setHours(Number.parseInt(newHour), Number.parseInt(newMinute), 0, 0)

      if (onChange) {
        onChange(combined.toISOString())
      }
    }
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return ""

    try {
      return format(selectedDate, "dd/MM/yyyy HH:mm", { locale: it })
    } catch (error) {
      return ""
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? formatDisplayValue() : placeholder}
          {readOnly && <span className="ml-2 text-xs text-muted-foreground">(Solo lettura)</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={readOnly || disabled}
            initialFocus
          />

          {!readOnly && !disabled && (
            <>
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Orario</span>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={selectedHour} onValueChange={(hour) => handleTimeChange(hour, undefined)}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-sm font-medium">:</span>

                  <Select value={selectedMinute} onValueChange={(minute) => handleTimeChange(undefined, minute)}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minuteOptions.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground mt-2">Minuti in multipli di 5</p>
              </div>

              <div className="border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => {
                    const now = roundToNext5Minutes()
                    setSelectedDate(now)
                    setSelectedHour(now.getHours().toString().padStart(2, "0"))
                    setSelectedMinute(now.getMinutes().toString().padStart(2, "0"))

                    if (onChange) {
                      onChange(now.toISOString())
                    }
                  }}
                >
                  Usa ora corrente
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
