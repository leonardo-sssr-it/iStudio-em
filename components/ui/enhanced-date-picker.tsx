"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EnhancedDatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "Seleziona data e ora",
  disabled = false,
  className,
  id,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  // Stato per il valore confermato
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value ? parseISO(value) : undefined)
  const [timeValue, setTimeValue] = React.useState("") // Ora confermata

  // Stato temporaneo per modifiche nel popover
  const [tempDate, setTempDate] = React.useState<Date | undefined>(value ? parseISO(value) : undefined)
  const [tempTime, setTempTime] = React.useState("") // Ora temporanea

  React.useEffect(() => {
    if (value) {
      const date = parseISO(value)
      setSelectedDate(date)
      setTempDate(date) // Aggiorna anche tempDate
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
      setTempTime(`${hours}:${minutes}`) // Aggiorna anche tempTime
    } else {
      setSelectedDate(undefined)
      setTempDate(undefined)
      setTimeValue("")
      setTempTime("")
    }
  }, [value])

  // L'effetto per timeValue deve basarsi su selectedDate (valore confermato)
  React.useEffect(() => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0")
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
    } else {
      setTimeValue("")
    }
  }, [selectedDate])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const currentHours = tempDate ? tempDate.getHours() : new Date().getHours()
      const currentMinutes = tempDate ? tempDate.getMinutes() : new Date().getMinutes()
      date.setHours(currentHours)
      date.setMinutes(currentMinutes)
      date.setSeconds(0)
      date.setMilliseconds(0)
      setTempDate(date)
      // Aggiorna tempTime se la data è selezionata e tempTime è vuoto
      if (!tempTime) {
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        setTempTime(`${hours}:${minutes}`)
      }
    } else {
      setTempDate(undefined) // Permetti la deselezione della data
    }
  }

  const handleTimeChange = (timeString: string) => {
    setTempTime(timeString) // Aggiorna solo lo stato temporaneo
    // Non chiamare onChange qui
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

      // Determina se stiamo modificando ore o minuti
      if (cursorPosition <= 2) {
        // Modifica ore
        newHours = Math.max(0, Math.min(23, hours + (increment > 0 ? 1 : -1)))
      } else {
        // Modifica minuti (in multipli di 5)
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
    const minutes = Math.round(now.getMinutes() / 5) * 5
    now.setMinutes(minutes)
    now.setSeconds(0)
    now.setMilliseconds(0)
    setTempDate(now)
    setTempTime(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`)
  }

  const clearDateTime = () => {
    setTempDate(undefined)
    setTempTime("")
    // Non chiamare onChange qui, la cancellazione avviene con Conferma
  }

  const confirmSelection = () => {
    if (tempDate && tempTime && tempTime.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = tempTime.split(":").map(Number)
      const finalDate = new Date(tempDate)
      finalDate.setHours(hours)
      finalDate.setMinutes(minutes)
      finalDate.setSeconds(0)
      finalDate.setMilliseconds(0)

      setSelectedDate(finalDate) // Aggiorna lo stato visualizzato

      // Formatta la data senza conversione timezone
      const year = finalDate.getFullYear()
      const month = String(finalDate.getMonth() + 1).padStart(2, "0")
      const day = String(finalDate.getDate()).padStart(2, "0")
      const hour = String(finalDate.getHours()).padStart(2, "0")
      const minute = String(finalDate.getMinutes()).padStart(2, "0")
      const second = String(finalDate.getSeconds()).padStart(2, "0")

      const localISOString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
      onChange(localISOString)
    } else if (!tempDate && !tempTime) {
      // Se entrambi sono vuoti, è una cancellazione
      setSelectedDate(undefined)
      onChange("")
    }
    setOpen(false)
  }

  const cancelSelection = () => {
    // Ripristina tempDate e tempTime ai valori di selectedDate e timeValue
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

  // Gestione della pressione di Enter sul trigger
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(!open)
    }
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
          />
          <div className="p-3 border-t space-y-3">
            {/* Selezione ora */}
            <div className="flex items-center gap-2">
              <Label htmlFor={`${id}-time-popover`} className="text-sm font-medium">
                Ora:
              </Label>
              <Input
                id={`${id}-time-popover`}
                type="time"
                step="300" // step 5 minuti
                value={tempTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                onKeyDown={handleTimeInputKeyDown}
                className="w-32"
                disabled={disabled || !tempDate}
                placeholder="HH:MM"
              />
            </div>
            {/* Pulsanti di azione rapida */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={setCurrentDateTime} className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Ora
              </Button>
              <Button variant="outline" size="sm" onClick={clearDateTime} className="flex-1">
                Cancella
              </Button>
            </div>
            {/* Pulsanti di conferma */}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={cancelSelection} className="flex-1">
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
