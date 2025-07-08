"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function SimpleDateTest() {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    console.log("[SimpleDateTest] Button cliccato, stato attuale:", open)
    setOpen(!open)
  }

  return (
    <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50">
      <h3 className="text-sm font-bold text-red-700 mb-2">TEST 1: Popover Radix UI (Funzionante)</h3>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            onClick={handleClick}
            className="w-full justify-start text-left font-normal bg-transparent"
          >
            {open ? "Popover Aperto!" : "Clicca per aprire popover"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Popover Funzionante!</h4>
            <p className="text-sm text-muted-foreground">
              Questo popover si apre correttamente. Stato: {open ? "APERTO" : "CHIUSO"}
            </p>
            <Button
              size="sm"
              onClick={() => {
                console.log("[SimpleDateTest] Chiusura popover")
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
