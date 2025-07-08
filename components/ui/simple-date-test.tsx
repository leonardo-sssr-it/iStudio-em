"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function SimpleDateTest() {
  const [date, setDate] = useState<Date>()
  const [open, setOpen] = useState(false)

  console.log(`[SimpleDateTest] Render - open: ${open}, date: ${date}`)

  const handleOpenChange = (newOpen: boolean) => {
    console.log(`[SimpleDateTest] Open change: ${newOpen}`)
    setOpen(newOpen)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    console.log(`[SimpleDateTest] Date selected: ${selectedDate}`)
    setDate(selectedDate)
    setOpen(false)
  }

  const handleTriggerClick = () => {
    console.log(`[SimpleDateTest] Trigger clicked, current open: ${open}`)
  }

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-sm font-bold text-red-700 mb-2">TEST 1: Popover Radix Semplice</h3>
      <div className="space-y-2">
        <p className="text-xs text-red-600">
          Debug: open={open.toString()}, date={date ? "SET" : "NONE"}
        </p>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-transparent"
              onClick={handleTriggerClick}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: it }) : "Seleziona una data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2 text-xs bg-gray-100 border-b">Debug Popover: Aperto correttamente!</div>
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus locale={it} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
