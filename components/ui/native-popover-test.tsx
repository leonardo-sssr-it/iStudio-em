"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function NativePopoverTest() {
  const [date, setDate] = useState<Date>()
  const [open, setOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

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

  const handleTriggerClick = () => {
    console.log("[NativePopoverTest] Trigger clicked")
    setDebugInfo(`Trigger clicked, open: ${!open}`)
    setOpen(!open)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setDebugInfo(`Data selezionata: ${selectedDate?.toISOString()}`)
    setOpen(false)
  }

  return (
    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
      <h3 className="text-sm font-bold text-green-700 mb-2">TEST 2: Popover Nativo</h3>
      <div className="space-y-2">
        <p className="text-xs text-green-600">
          Debug: open={open ? "SI" : "NO"}, date={date ? "SET" : "NONE"}, info={debugInfo}
        </p>
        <div className="relative">
          <Button
            ref={triggerRef}
            variant="outline"
            className="w-full justify-start text-left font-normal bg-transparent"
            onClick={handleTriggerClick}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: it }) : "Seleziona data nativa"}
          </Button>

          {open && (
            <div
              ref={popoverRef}
              className="absolute top-full left-0 mt-2 w-auto bg-white border border-gray-200 rounded-md shadow-lg z-[9999] p-0"
            >
              <div className="p-2 text-xs bg-green-100 border-b">Debug Nativo: Popover aperto correttamente!</div>
              <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus locale={it} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
