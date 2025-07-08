"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
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
  const [timeValue, setTimeValue] = React.useState("12:00")

  console.log(`[EnhancedDatePicker] Render - open: ${open}, value: ${value}, disabled: ${disabled}`)

  // Inizializza i valori dal prop value
  React.useEffect(() => {
    if (value) {
      try {
        const date = parseISO(value)
        setSelectedDate(date)
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        setTimeValue(`${hours}:${minutes}`)
        console.log(`[EnhancedDatePicker] Parsed date: ${date}, time: ${hours}:${minutes}`)
      } catch (error) {
        console.error("Errore nel parsing della data:", error)
        setSelectedDate(undefined)
        setTimeValue("12:00")
      }
    } else {
      setSelectedDate(undefined)
      setTimeValue("12:00")
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
    console.log(`[EnhancedDatePicker] Date selected: ${date}`)
    if (date) {
      // Applica l'ora corrente se non c'è una data selezionata
      if (!selectedDate) {
        const now = new Date()
        const minutes = roundToNearestFiveMinutes(now.getMinutes())
        date.setHours(now.getHours())
        date.setMinutes(minutes)
        setTimeValue(`${now.getHours().toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
      } else {
        // Mantieni l'ora esistente
        const [hours, minutes] = timeValue.split(":").map(Number)
        date.setHours(hours)
        date.setMinutes(minutes)
      }
      date.setSeconds(0)
      date.setMilliseconds(0)
      setSelectedDate(date)
    } else {
      setSelectedDate(undefined)
    }
  }

  const handleTimeChange = (newTime: string) => {
    console.log(`[EnhancedDatePicker] Time changed: ${newTime}`)
    setTimeValue(newTime)

    if (selectedDate && newTime.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
      newDate.setSeconds(0)
      newDate.setMilliseconds(0)
      setSelectedDate(newDate)
    }
  }

  const setCurrentDateTime = () => {
    console.log(`[EnhancedDatePicker] Setting current date time`)
    const now = new Date()
    const minutes = roundToNearestFiveMinutes(now.getMinutes())
    now.setMinutes(minutes)
    now.setSeconds(0)
    now.setMilliseconds(0)
    setSelectedDate(now)
    setTimeValue(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`)
  }

  const clearDateTime = () => {
    console.log(`[EnhancedDatePicker] Clearing date time`)
    setSelectedDate(undefined)
    setTimeValue("12:00")
  }

  const confirmSelection = () => {
    console.log(`[EnhancedDatePicker] Confirming selection - selectedDate: ${selectedDate}, timeValue: ${timeValue}`)

    if (selectedDate && timeValue.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const finalDate = new Date(selectedDate)
      finalDate.setHours(hours)
      finalDate.setMinutes(minutes)
      finalDate.setSeconds(0)
      finalDate.setMilliseconds(0)

      // Formatta la data manualmente senza conversione timezone
      const year = finalDate.getFullYear()
      const month = String(finalDate.getMonth() + 1).padStart(2, "0")
      const day = String(finalDate.getDate()).padStart(2, "0")
      const hour = String(finalDate.getHours()).padStart(2, "0")
      const minute = String(finalDate.getMinutes()).padStart(2, "0")
      const second = String(finalDate.getSeconds()).padStart(2, "0")

      const localISOString = `${year}-${month}-${day}T${hour}:${minute}:${second}`

      console.log(`[EnhancedDatePicker] Final date: ${localISOString}`)
      onChange(localISOString)
    } else if (!selectedDate) {
      console.log(`[EnhancedDatePicker] Clearing selection`)
      onChange("")
    }
    setOpen(false)
  }

  const cancelSelection = () => {
    console.log(`[EnhancedDatePicker] Cancelling selection`)
    setOpen(false)
  }

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
            disabled={disabled}
            type="button"
            onClick={() => console.log(`[EnhancedDatePicker] Trigger clicked, disabled: ${disabled}`)}
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
          <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
            Debug: open={open.toString()}, selectedDate={selectedDate ? "SET" : "NONE"}
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabled}
            initialFocus
            locale={it}
            className="rounded-md border-0"
          />
          <div className="p-3 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor={`${id}-time`} className="text-sm font-medium">
                Ora:
              </Label>
              <div className="flex gap-1">
                <select
                  id={`${id}-time-hours`}
                  value={timeValue.split(":")[0] || "12"}
                  onChange={(e) => {
                    const hours = e.target.value
                    const minutes = timeValue.split(":")[1] || "00"
                    handleTimeChange(`${hours}:${minutes}`)
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={disabled}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="py-1">:</span>
                <select
                  id={`${id}-time-minutes`}
                  value={timeValue.split(":")[1] || "00"}
                  onChange={(e) => {
                    const hours = timeValue.split(":")[0] || "12"
                    const minutes = e.target.value
                    handleTimeChange(`${hours}:${minutes}`)
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={disabled}
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
              <Button
                variant="outline"
                size="sm"
                onClick={setCurrentDateTime}
                className="flex-1 bg-transparent"
                type="button"
                disabled={disabled}
              >
                <Clock className="mr-2 h-4 w-4" />
                Ora
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearDateTime}
                className="flex-1 bg-transparent"
                type="button"
                disabled={disabled}
              >
                Cancella
              </Button>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelSelection}
                className="flex-1 bg-transparent"
                type="button"
              >
                Annulla
              </Button>
              <Button
                size="sm"
                onClick={confirmSelection}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                type="button"
              >
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
