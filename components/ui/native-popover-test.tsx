"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function NativePopoverTest() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const handleClick = () => {
    console.log("[NativePopoverTest] Button cliccato, stato attuale:", open)
    setOpen(!open)
  }

  return (
    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
      <h3 className="text-sm font-bold text-green-700 mb-2">TEST 2: Popover Nativo (Senza Radix)</h3>
      <div className="relative">
        <Button
          variant="outline"
          onClick={handleClick}
          className="w-full justify-start text-left font-normal bg-transparent"
        >
          {open ? "Popover Nativo Aperto!" : "Clicca per aprire popover nativo"}
        </Button>

        {open && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 mt-2 w-80 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50"
          >
            <div className="space-y-2">
              <h4 className="font-medium">Popover Nativo Funzionante!</h4>
              <p className="text-sm text-muted-foreground">
                Questo è un popover senza Radix UI. Stato: {open ? "APERTO" : "CHIUSO"}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  console.log("[NativePopoverTest] Chiusura popover nativo")
                  setOpen(false)
                }}
              >
                Chiudi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
