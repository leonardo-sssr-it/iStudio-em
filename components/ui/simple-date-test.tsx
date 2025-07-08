"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SimpleDateTest() {
  const [open, setOpen] = React.useState(false)

  console.log(`[SimpleDateTest] Render - open: ${open}`)

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-sm font-bold text-red-700 mb-2">TEST 1: Popover Radix UI</h3>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" onClick={() => console.log("[SimpleDateTest] Button clicked")}>
            Apri Popover Test (stato: {open ? "APERTO" : "CHIUSO"})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Test Popover</h4>
            <p className="text-sm text-muted-foreground">Se vedi questo, il Popover funziona!</p>
            <Button
              size="sm"
              onClick={() => {
                console.log("[SimpleDateTest] Chiudo popover")
                setOpen(false)
              }}
            >
              Chiudi
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
