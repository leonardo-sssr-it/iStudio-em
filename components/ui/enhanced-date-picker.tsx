"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Clock, Check, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  const [timeValue, setTimeValue] = useState("12:00")
  const [debugInfo, setDebugInfo] = useState("")

  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  console.log(`[EnhancedDatePicker] Render - open: ${open}, value: ${value}`)

  // Chiudi il popover quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setDebugInfo("Chiuso cliccando fuori")
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

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
        setTimeValue("12:00")
      }
    } else {
      setSelectedDate(undefined)
      if (showCurrentTime) {
        const now = new Date()
        setTimeValue(format(now, "HH:mm"))
      } else {
        setTimeValue("12:00")
      }
    }
  }, [value, showCurrentTime])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return

    console.log("[EnhancedDatePicker] Trigger clicked, current open:", open)
    setDebugInfo(`Trigger clicked, open: ${!open}`)
    setOpen(!open)
  }

  const handleDateSelect = (date: Date | undefined) => {
    console.log("[EnhancedDatePicker] Date selected:", date)
    setSelectedDate(date)
    setDebugInfo(`Date selected: ${date?.toISOString()}`)

    // Non chiudere automaticamente, lascia che l'utente selezioni anche l'ora
    if (date) {
      // Mantieni l'ora esistente o usa l'ora corrente
      const time = timeValue || "12:00"
      const [hours, minutes] = time.split(":").map(Number)

      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)

      // Non chiamare onChange qui, aspetta la conferma
    }
  }

  const handleTimeChange = (newTime: string) => {
    console.log("[EnhancedDatePicker] Time changed:", newTime)
    setTimeValue(newTime)
    setDebugInfo(`Time changed: ${newTime}`)
  }

  const handleConfirm = () => {
    console.log("[EnhancedDatePicker] Confirm clicked")
    setDebugInfo("Confirmed!")

    if (selectedDate && timeValue.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const finalDate = new Date(selectedDate)
      finalDate.setHours(hours, minutes, 0, 0)

      // Formatta la data in ISO string locale
      const year = finalDate.getFullYear()
      const month = String(finalDate.getMonth() + 1).padStart(2, "0")
      const day = String(finalDate.getDate()).padStart(2, "0")
      const hour = String(finalDate.getHours()).padStart(2, "0")
      const minute = String(finalDate.getMinutes()).padStart(2, "0")
      const second = String(finalDate.getSeconds()).padStart(2, "0")

      const localISOString = `${year}-${month}-${day}T${hour}:${minute}:${second}`

      console.log("[EnhancedDatePicker] Final date:", localISOString)
      if (onChange) {
        onChange(localISOString)
      }
    } else if (!selectedDate) {
      console.log("[EnhancedDatePicker] Clearing selection")
      if (onChange) {
        onChange("")
      }
    }
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
    setTimeValue("12:00")
    setDebugInfo("Cleared")
  }

  const handleSetNow = () => {
    console.log("[EnhancedDatePicker] Set now clicked")
    const now = new Date()
    setSelectedDate(now)
    setTimeValue(format(now, "HH:mm"))
    setDebugInfo("Set to current time")
  }

  // Genera le opzioni per ore e minuti
  const generateHourOptions = () => {
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  }

  const generateMinuteOptions = () => {
    const options: string[] = []
    for (let i = 0; i < 60; i += 5) {
      options.push(i.toString().padStart(2, "0"))
    }
    return options
  }

  const displayValue =
    selectedDate && timeValue ? `${format(selectedDate, "dd/MM/yyyy", { locale: it })} ${timeValue}` : ""

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={triggerRef}
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !displayValue && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        disabled={disabled}
        onClick={handleTriggerClick}
        id={id}
        type="button"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayValue || placeholder}
      </Button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] p-0"
          style={{ minWidth: "384px" }}
        >
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={it}
              className="rounded-md border-0"
            />
          </div>

          {/* Time Selection */}
          <div className="p-3 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Label className="flex items-center text-sm font-medium min-w-fit">
                <Clock className="mr-2 h-4 w-4" />
                Ora:
              </Label>
              <div className="flex gap-1 items-center">
                <select
                  value={timeValue.split(":")[0] || "12"}
                  onChange={(e) => {
                    const hours = e.target.value
                    const minutes = timeValue.split(":")[1] || "00"
                    handleTimeChange(`${hours}:${minutes}`)
                  }}
                  className="px-2 py-1 border rounded text-sm min-w-[60px]"
                  disabled={disabled}
                >
                  {generateHourOptions().map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <span className="text-sm">:</span>
                <select
                  value={timeValue.split(":")[1] || "00"}
                  onChange={(e) => {
                    const hours = timeValue.split(":")[0] || "12"
                    const minutes = e.target.value
                    handleTimeChange(`${hours}:${minutes}`)
                  }}
                  className="px-2 py-1 border rounded text-sm min-w-[60px]"
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

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetNow}
                className="flex-1 bg-transparent"
                type="button"
                disabled={disabled}
              >
                <Clock className="mr-1 h-3 w-3" />
                Ora
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1 bg-transparent"
                type="button"
                disabled={disabled}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Cancella
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
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
              <Button
                size="sm"
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                type="button"
              >
                <Check className="mr-1 h-3 w-3" />
                Conferma
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
