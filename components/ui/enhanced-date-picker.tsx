"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface EnhancedDatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  showCurrentTime?: boolean
}

export function EnhancedDatePicker({
  value = "",
  onChange,
  placeholder = "Seleziona data e ora",
  disabled = false,
  className = "",
  id,
  showCurrentTime = false,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [timeValue, setTimeValue] = useState("")

  // Debug state
  const [debugInfo, setDebugInfo] = useState("")

  // Inizializza i valori quando cambia il prop value
  useEffect(() => {
    console.log("[EnhancedDatePicker] Value changed:", value)
    setDebugInfo(`Value: ${value}`)

    if (value) {
      try {
        const date = parseISO(value)
        setSelectedDate(date)
        setTimeValue(format(date, "HH:mm"))
        console.log("[EnhancedDatePicker] Parsed date:", date, "time:", format(date, "HH:mm"))
      } catch (error) {
        console.error("[EnhancedDatePicker] Error parsing date:", error)
        setSelectedDate(undefined)
        setTimeValue("")
      }
    } else {
      setSelectedDate(undefined)
      if (showCurrentTime) {
        const now = new Date()
        setTimeValue(format(now, "HH:mm"))
      } else {
        setTimeValue("")
      }
    }
  }, [value, showCurrentTime])

  const handleDateSelect = (date: Date | undefined) => {
    console.log("[EnhancedDatePicker] Date selected:", date)
    setSelectedDate(date)
    setDebugInfo(`Date selected: ${date?.toISOString()}`)

    if (date && onChange) {
      // Mantieni l'ora esistente o usa 12:00 come default
      const time = timeValue || "12:00"
      const [hours, minutes] = time.split(":").map(Number)

      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)

      const isoString = newDate.toISOString()
      console.log("[EnhancedDatePicker] Calling onChange with:", isoString)
      onChange(isoString)
    }
  }

  const handleTimeChange = (newTime: string) => {
    console.log("[EnhancedDatePicker] Time changed:", newTime)
    setTimeValue(newTime)
    setDebugInfo(`Time changed: ${newTime}`)

    if (selectedDate && onChange) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)

      const isoString = newDate.toISOString()
      console.log("[EnhancedDatePicker] Calling onChange with:", isoString)
      onChange(isoString)
    }
  }

  const handleConfirm = () => {
    console.log("[EnhancedDatePicker] Confirm clicked")
    setDebugInfo("Confirmed!")
    setOpen(false)
  }

  const handleCancel = () => {
    console.log("[EnhancedDatePicker] Cancel clicked")
    setDebugInfo("Cancelled")
    setOpen(false)
  }

  const handleClear = () => {
    console.log("[EnhancedDatePicker] Clear clicked")
    setSelectedDate(undefined)
    setTimeValue("")
    setDebugInfo("Cleared")
    if (onChange) {
      onChange("")
    }
  }

  const displayValue =
    selectedDate && timeValue ? `${format(selectedDate, "dd/MM/yyyy", { locale: it })} ${timeValue}` : ""

  const handleTriggerClick = () => {
    console.log("[EnhancedDatePicker] Trigger clicked, current open state:", open)
    setDebugInfo(`Trigger clicked, open: ${!open}`)
    setOpen(!open)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !displayValue && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
            onClick={handleTriggerClick}
            id={id}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Debug Panel */}
            <div className="text-xs bg-gray-100 p-2 rounded">
              <strong>Debug:</strong> {debugInfo}
              <br />
              <strong>Open:</strong> {open ? "SI" : "NO"}
              <br />
              <strong>Selected:</strong> {selectedDate?.toISOString() || "none"}
              <br />
              <strong>Time:</strong> {timeValue || "none"}
            </div>

            {/* Calendar */}
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus locale={it} />

            {/* Time Input */}
            <div className="space-y-2">
              <Label htmlFor="time-input" className="flex items-center text-sm font-medium">
                <Clock className="mr-2 h-4 w-4" />
                Ora
              </Label>
              <Input
                id="time-input"
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-2">
              <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 bg-transparent">
                Cancella
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 bg-transparent">
                Annulla
              </Button>
              <Button size="sm" onClick={handleConfirm} className="flex-1">
                Conferma
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
