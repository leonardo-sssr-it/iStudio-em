"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnhancedDatePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  showCurrentTime?: boolean
  onDateTimeSet?: (dateTime: string) => void
  className?: string
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
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = React.useState({ hours: "09", minutes: "00" })

  // Parse the initial value
  React.useEffect(() => {
    if (value) {
      try {
        const date = parseISO(value)
        if (isValid(date)) {
          setSelectedDate(date)
          setSelectedTime({
            hours: date.getHours().toString().padStart(2, "0"),
            minutes:
              Math.round(date.getMinutes() / 5) *
              (5) // Round to nearest 5 minutes
                .toString()
                .padStart(2, "0"),
          })
        }
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    } else if (showCurrentTime) {
      const now = new Date()
      setSelectedDate(now)
      setSelectedTime({
        hours: now.getHours().toString().padStart(2, "0"),
        minutes: Math.round(now.getMinutes() / 5) * (5).toString().padStart(2, "0"),
      })
    }
  }, [value, showCurrentTime])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || readOnly) return

    setSelectedDate(date)

    // Combine date with current time
    const newDateTime = new Date(date)
    newDateTime.setHours(Number.parseInt(selectedTime.hours))
    newDateTime.setMinutes(Number.parseInt(selectedTime.minutes))

    const isoString = newDateTime.toISOString()
    onChange?.(isoString)

    // Call onDateTimeSet if provided (for auto-setting end time)
    if (onDateTimeSet) {
      const endDateTime = new Date(newDateTime.getTime() + 60 * 60 * 1000) // +1 hour
      onDateTimeSet(endDateTime.toISOString())
    }
  }

  const handleTimeChange = (type: "hours" | "minutes", value: string) => {
    if (readOnly) return

    const newTime = { ...selectedTime, [type]: value }
    setSelectedTime(newTime)

    if (selectedDate) {
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(Number.parseInt(newTime.hours))
      newDateTime.setMinutes(Number.parseInt(newTime.minutes))

      const isoString = newDateTime.toISOString()
      onChange?.(isoString)
    }
  }

  const formatDisplayValue = () => {
    if (!selectedDate) return "Seleziona data e ora"

    try {
      return format(selectedDate, "dd/MM/yyyy HH:mm", { locale: it })
    } catch (error) {
      return "Data non valida"
    }
  }

  // Generate time options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDisplayValue()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {readOnly && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                Modalità visualizzazione - non è possibile modificare
              </div>
            )}

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={readOnly ? undefined : handleDateSelect}
              disabled={disabled}
              initialFocus
              locale={it}
            />

            <div className="border-t pt-3">
              <Label className="text-sm font-medium mb-2 block">
                <Clock className="inline w-4 h-4 mr-1" />
                Orario
              </Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedTime.hours}
                  onValueChange={(value) => handleTimeChange("hours", value)}
                  disabled={readOnly || disabled}
                >
                  <SelectTrigger className="w-20">
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

                <span className="text-muted-foreground">:</span>

                <Select
                  value={selectedTime.minutes}
                  onValueChange={(value) => handleTimeChange("minutes", value)}
                  disabled={readOnly || disabled}
                >
                  <SelectTrigger className="w-20">
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

              <p className="text-xs text-muted-foreground mt-2">Orario in formato 24h, minuti in multipli di 5</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
