"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock, Check, X } from "lucide-react"
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
  showTimeSelect?: boolean
  dateFormat?: string
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "Seleziona data e ora",
  disabled = false,
  className,
  id,
  showTimeSelect = true,
  dateFormat = "dd/MM/yyyy HH:mm",
}: EnhancedDatePickerProps) {
  console.log(`EnhancedDatePicker rendered for ${id}:`, { value, disabled, showTimeSelect })

  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [timeInput, setTimeInput] = React.useState("")

  // Inizializza il componente con il valore esistente
  React.useEffect(() => {
    if (value && value.trim() !== "") {
      try {
        const date = parseISO(value)
        if (isValid(date)) {
          setSelectedDate(date)
          const hours = date.getHours().toString().padStart(2, "0")
          const minutes = date.getMinutes().toString().padStart(2, "0")
          setTimeInput(`${hours}:${minutes}`)
        }
      } catch (error) {
        console.warn("Invalid date value:", value)
        setSelectedDate(undefined)
        setTimeInput("")
      }
    } else {
      setSelectedDate(undefined)
      setTimeInput("")
    }
  }, [value])

  // Gestisce la selezione della data dal calendario
  const handleDateSelect = (date: Date | undefined) => {
    console.log(`Date selected: ${date}`)
    if (!date) {
      setSelectedDate(undefined)
      return
    }

    // Se non c'è un orario impostato, usa l'ora corrente
    if (!timeInput || !timeInput.match(/^\d{2}:\d{2}$/)) {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, "0")
      const minutes = now.getMinutes().toString().padStart(2, "0")
      setTimeInput(`${hours}:${minutes}`)
    }

    setSelectedDate(date)
  }

  // Gestisce il cambio dell'orario
  const handleTimeChange = (newTime: string) => {
    console.log(`Time changed: ${newTime}`)
    setTimeInput(newTime)
  }

  // Conferma la selezione e chiude il popover
  const handleConfirm = () => {
    console.log(`Confirming selection: date=${selectedDate}, time=${timeInput}`)
    if (!selectedDate) {
      onChange("")
      setOpen(false)
      return
    }

    const finalDate = new Date(selectedDate)

    // Applica l'orario se presente e valido
    if (showTimeSelect && timeInput && timeInput.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeInput.split(":").map(Number)
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        finalDate.setHours(hours, minutes, 0, 0)
      }
    } else if (!showTimeSelect) {
      // Se non mostra l'orario, imposta a mezzanotte
      finalDate.setHours(0, 0, 0, 0)
    }

    // Crea stringa ISO locale
    const year = finalDate.getFullYear()
    const month = String(finalDate.getMonth() + 1).padStart(2, "0")
    const day = String(finalDate.getDate()).padStart(2, "0")
    const hour = String(finalDate.getHours()).padStart(2, "0")
    const minute = String(finalDate.getMinutes()).padStart(2, "0")

    const isoString = `${year}-${month}-${day}T${hour}:${minute}:00`
    console.log(`Final ISO string: ${isoString}`)
    onChange(isoString)
    setOpen(false)
  }

  // Cancella la selezione
  const handleClear = () => {
    console.log("Clearing selection")
    setSelectedDate(undefined)
    setTimeInput("")
    onChange("")
    setOpen(false)
  }

  // Imposta data e ora corrente
  const handleSetNow = () => {
    console.log("Setting current date/time")
    const now = new Date()
    setSelectedDate(now)
    const hours = now.getHours().toString().padStart(2, "0")
    const minutes = now.getMinutes().toString().padStart(2, "0")
    setTimeInput(`${hours}:${minutes}`)
  }

  // Formatta la data per la visualizzazione
  const getDisplayValue = () => {
    if (!selectedDate) return placeholder

    try {
      if (showTimeSelect && timeInput) {
        return `${format(selectedDate, "dd/MM/yyyy", { locale: it })} ${timeInput}`
      }
      return format(selectedDate, "dd/MM/yyyy", { locale: it })
    } catch {
      return placeholder
    }
  }

  return (
    <div className={cn("enhanced-date-picker-wrapper relative", className)} style={{ zIndex: 1 }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "enhanced-date-picker-trigger w-full justify-start text-left font-normal h-10",
              !selectedDate && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
            disabled={disabled}
            type="button"
            onClick={(e) => {
              console.log(`EnhancedDatePicker button clicked for ${id}, disabled: ${disabled}`)
              e.preventDefault()
              e.stopPropagation()
              if (!disabled) {
                console.log(`Toggling popover for ${id}, current state: ${open}`)
                setOpen(!open)
              }
            }}
            style={{ pointerEvents: "auto" }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{getDisplayValue()}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="enhanced-date-picker-content w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          style={{
            zIndex: 99999,
            position: "fixed",
            pointerEvents: "auto",
          }}
          onInteractOutside={(e) => {
            // Previeni la chiusura accidentale quando si clicca sui controlli
            const target = e.target as Element
            if (target.closest(".enhanced-date-picker-content")) {
              e.preventDefault()
            }
          }}
        >
          <div className="p-3" style={{ pointerEvents: "auto" }}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabled}
              initialFocus
              locale={it}
              className="rounded-md border-0"
              style={{ pointerEvents: "auto" }}
            />

            {showTimeSelect && (
              <div className="mt-3 pt-3 border-t space-y-3" style={{ pointerEvents: "auto" }}>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium min-w-[30px]">Ora:</Label>
                  <Input
                    type="time"
                    value={timeInput}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="flex-1"
                    disabled={disabled || !selectedDate}
                    style={{ pointerEvents: "auto" }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSetNow()
                    }}
                    className="flex-1"
                    disabled={disabled}
                    style={{ pointerEvents: "auto" }}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Ora
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleClear()
                    }}
                    className="flex-1"
                    disabled={disabled}
                    style={{ pointerEvents: "auto" }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancella
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ pointerEvents: "auto" }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setOpen(false)
                }}
                className="flex-1"
                disabled={disabled}
                style={{ pointerEvents: "auto" }}
              >
                Annulla
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleConfirm()
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={disabled}
                style={{ pointerEvents: "auto" }}
              >
                <Check className="mr-1 h-3 w-3" />
                Conferma
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
