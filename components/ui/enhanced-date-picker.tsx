"use client"

import * as React from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface EnhancedDatePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  showCurrentTime?: boolean
  onDateTimeSet?: (date: Date) => void
  className?: string
}

export function EnhancedDatePicker({
  id,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  placeholder = "Seleziona data...",
  showCurrentTime = false,
  onDateTimeSet,
  className,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined)
  const [timeValue, setTimeValue] = React.useState(() => {
    if (value) {
      const date = new Date(value)
      return format(date, "HH:mm")
    }
    return showCurrentTime ? format(new Date(), "HH:mm") : "00:00"
  })

  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      setTimeValue(format(date, "HH:mm"))
    } else {
      setSelectedDate(undefined)
      setTimeValue(showCurrentTime ? format(new Date(), "HH:mm") : "00:00")
    }
  }, [value, showCurrentTime])

  const handleDateSelect = (date: Date | undefined) => {
    if (readOnly || disabled) return

    if (date) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)

      setSelectedDate(newDate)

      const isoString = newDate.toISOString()
      onChange?.(isoString)
      onDateTimeSet?.(newDate)
    } else {
      setSelectedDate(undefined)
      onChange?.("")
    }
  }

  const handleTimeChange = (newTime: string) => {
    if (readOnly || disabled) return

    setTimeValue(newTime)

    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)

      setSelectedDate(newDate)

      const isoString = newDate.toISOString()
      onChange?.(isoString)
      onDateTimeSet?.(newDate)
    }
  }

  const handleSetCurrentDateTime = () => {
    if (readOnly || disabled) return

    const now = new Date()
    setSelectedDate(now)
    setTimeValue(format(now, "HH:mm"))

    const isoString = now.toISOString()
    onChange?.(isoString)
    onDateTimeSet?.(now)
    setOpen(false)
  }

  const displayValue = selectedDate ? format(selectedDate, "dd/MM/yyyy HH:mm", { locale: it }) : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {readOnly && (
            <div className="mb-3 text-sm text-muted-foreground bg-muted p-2 rounded">
              Modalità visualizzazione - Solo lettura
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

          <Separator className="my-3" />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <Label htmlFor="time-input" className="text-sm font-medium">
                Ora
              </Label>
            </div>

            <Input
              id="time-input"
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={disabled || readOnly}
              className="w-full"
            />

            {showCurrentTime && !readOnly && !disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetCurrentDateTime}
                className="w-full bg-transparent"
              >
                Imposta data e ora corrente
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
