"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface EnhancedDatePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  showCurrentTime?: boolean
  onDateTimeSet?: (dateTime: string) => void
  className?: string
  placeholder?: string
}

export function EnhancedDatePicker({
  id,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  showCurrentTime = false,
  onDateTimeSet,
  className,
  placeholder = "Seleziona data e ora",
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = React.useState({ hours: "09", minutes: "00" })

  // Funzione per arrotondare ai 5 minuti successivi
  const roundToNext5Minutes = (date: Date) => {
    const minutes = date.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 5) * 5
    const newDate = new Date(date)

    if (roundedMinutes >= 60) {
      newDate.setHours(date.getHours() + 1, 0, 0, 0)
    } else {
      newDate.setMinutes(roundedMinutes, 0, 0)
    }

    return newDate
  }

  // Inizializza con l'ora attuale arrotondata se showCurrentTime è true
  React.useEffect(() => {
    if (value) {
      try {
        const date = parseISO(value)
        if (isValid(date)) {
          setSelectedDate(date)
          setSelectedTime({
            hours: date.getHours().toString().padStart(2, "0"),
            minutes: date.getMinutes().toString().padStart(2, "0"),
          })
        }
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    } else if (showCurrentTime) {
      const now = roundToNext5Minutes(new Date())
      setSelectedDate(now)
      setSelectedTime({
        hours: now.getHours().toString().padStart(2, "0"),
        minutes: now.getMinutes().toString().padStart(2, "0"),
      })
    }
  }, [value, showCurrentTime])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || readOnly || disabled) return

    setSelectedDate(date)

    // Combina data con orario selezionato
    const newDateTime = new Date(date)
    newDateTime.setHours(Number.parseInt(selectedTime.hours))
    newDateTime.setMinutes(Number.parseInt(selectedTime.minutes))
    newDateTime.setSeconds(0, 0)

    const isoString = newDateTime.toISOString()
    onChange?.(isoString)

    // Chiama onDateTimeSet se fornito (per impostare automaticamente l'ora di fine)
    if (onDateTimeSet) {
      const endDateTime = new Date(newDateTime.getTime() + 60 * 60 * 1000) // +1 ora
      onDateTimeSet(endDateTime.toISOString())
    }
  }

  const handleTimeChange = (type: "hours" | "minutes", value: string) => {
    if (readOnly || disabled) return

    const newTime = { ...selectedTime, [type]: value }
    setSelectedTime(newTime)

    if (selectedDate) {
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(Number.parseInt(newTime.hours))
      newDateTime.setMinutes(Number.parseInt(newTime.minutes))
      newDateTime.setSeconds(0, 0)

      const isoString = newDateTime.toISOString()
      onChange?.(isoString)
    }
  }

  const handleSetCurrentDateTime = () => {
    if (readOnly || disabled) return

    const now = roundToNext5Minutes(new Date())
    setSelectedDate(now)
    setSelectedTime({
      hours: now.getHours().toString().padStart(2, "0"),
      minutes: now.getMinutes().toString().padStart(2, "0"),
    })

    const isoString = now.toISOString()
    onChange?.(isoString)
    onDateTimeSet?.(isoString)
    setOpen(false)
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder

    try {
      return format(selectedDate, "dd/MM/yyyy HH:mm", { locale: it })
    } catch (error) {
      return "Data non valida"
    }
  }

  // Genera opzioni per le ore (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

  // Genera opzioni per i minuti (multipli di 5)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            type="button"
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDisplayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-0">
            {readOnly && (
              <div className="text-sm text-muted-foreground bg-muted p-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Modalità visualizzazione - Solo lettura
                </div>
              </div>
            )}

            {/* Calendario */}
            <div className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={readOnly ? undefined : handleDateSelect}
                disabled={disabled}
                initialFocus
                locale={it}
              />
            </div>

            <Separator />

            {/* Selettore orario */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Orario</Label>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Select
                  value={selectedTime.hours}
                  onValueChange={(value) => handleTimeChange("hours", value)}
                  disabled={readOnly || disabled}
                >
                  <SelectTrigger className="w-16 text-center">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-lg font-mono text-muted-foreground">:</span>

                <Select
                  value={selectedTime.minutes}
                  onValueChange={(value) => handleTimeChange("minutes", value)}
                  disabled={readOnly || disabled}
                >
                  <SelectTrigger className="w-16 text-center">
                    <SelectValue />
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

              {showCurrentTime && !readOnly && !disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetCurrentDateTime}
                  className="w-full bg-transparent"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Imposta ora corrente
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">Formato 24h • Minuti in multipli di 5</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
