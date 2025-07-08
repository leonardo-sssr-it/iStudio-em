"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

export function SimpleDateTest() {
  const [open, setOpen] = React.useState(false)

  console.log(`[SimpleDateTest] Render - open: ${open}`)

  return (
    <div className="p-4 border border-red-500 bg-red-50">
      <h3 className="text-sm font-bold mb-2">Test Popover Semplice</h3>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            onClick={() => {
              console.log(`[SimpleDateTest] Button clicked, current open: ${open}`)
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Test Popover (open: {open.toString()})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="p-4">
            <p>Popover funziona!</p>
            <Button onClick={() => setOpen(false)} className="mt-2">
              Chiudi
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
