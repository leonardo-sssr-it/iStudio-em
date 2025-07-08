"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function SimpleDateTest() {
  const [date, setDate] = useState<Date>()
  const [open, setOpen] = useState(false)

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-sm font-bold text-red-700 mb-2">TEST 1: Popover Radix Funzionante</h3>
      <div className="space-y-2">
        <p className="text-xs text-red-600">
          Debug: open={open ? "SI" : "NO"}, date={date ? "SET" : "NONE"}
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-transparent"
              onClick={() => console.log("[SimpleDateTest] Trigger clicked")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: it }) : "Seleziona data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-2 text-xs bg-red-100 border-b">Debug Radix: Popover aperto correttamente!</div>
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={it} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
