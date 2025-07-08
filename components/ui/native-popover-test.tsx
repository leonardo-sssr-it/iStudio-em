"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export function NativePopoverTest() {
  const [open, setOpen] = React.useState(false)

  console.log(`[NativePopoverTest] Render - open: ${open}`)

  return (
    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
      <h3 className="text-sm font-bold text-green-700 mb-2">TEST 2: Popover Nativo</h3>
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => {
            console.log("[NativePopoverTest] Button clicked")
            setOpen(!open)
          }}
        >
          Apri Popover Nativo (stato: {open ? "APERTO" : "CHIUSO"})
        </Button>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-white border rounded-lg shadow-lg z-50">
            <div className="space-y-2">
              <h4 className="font-medium">Test Popover Nativo</h4>
              <p className="text-sm text-muted-foreground">Questo è un popover fatto senza Radix UI</p>
              <Button
                size="sm"
                onClick={() => {
                  console.log("[NativePopoverTest] Chiudo popover nativo")
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
