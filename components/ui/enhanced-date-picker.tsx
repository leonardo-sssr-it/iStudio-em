"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [debugInfo, setDebugInfo] = useState("")

  console.log(`[EnhancedDatePicker] Render - open: ${open}, value: ${value}`)

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

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[EnhancedDatePicker] Trigger clicked, current open:", open)
    setDebugInfo(`Trigger clicked, open: ${!open}`)
    setOpen(!open)
  }

  const handleOpenChange = (newOpen: boolean) => {
    console.log("[EnhancedDatePicker] Open change:", newOpen)
    setDebugInfo(`Open change: ${newOpen}`)
    setOpen(newOpen)
  }

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

  // VERSIONE NATIVA SENZA RADIX per evitare conflitti
  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        className={cn("w-full justify-start text-left font-normal", !displayValue && "text-muted-foreground")}
        disabled={disabled}
        onClick={handleTriggerClick}
        id={id}
        type="button"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue || placeholder}
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] p-0">
          {/* Debug Panel */}
          <div className="p-2 text-xs bg-blue-100 border-b">
            <strong>Debug Enhanced:</strong> {debugInfo}
            <br />
            <strong>Open:</strong> {open ? "SI" : "NO"}
            <br />
            <strong>Selected:</strong> {selectedDate?.toISOString() || "none"}
            <br />
            <strong>Time:</strong> {timeValue || "none"}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus locale={it} />
          </div>

          {/* Time Input */}
          <div className="p-3 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor={`${id}-time`} className="flex items-center text-sm font-medium">
                <Clock className="mr-2 h-4 w-4" />
                Ora:
              </Label>
              <Input
                id={`${id}-time`}
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-32"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between space-x-2">
              <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 bg-transparent" type="button">
                Cancella
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1 bg-transparent"
                type="button"
              >
                <X className="mr-1 h-3 w-3" />
                Annulla
              </Button>
              <Button size="sm" onClick={handleConfirm} className="flex-1" type="button">
                <Check className="mr-1 h-3 w-3" />
                Conferma
              </Button>
            </div>
          </div>

          {/* Overlay per chiudere cliccando fuori */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
