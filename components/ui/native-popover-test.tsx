"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export function NativePopoverTest() {
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    console.log("[NativePopoverTest] Button clicked!")

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        x: rect.left,
        y: rect.bottom + 4,
      })
    }

    setOpen(!open)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  React.useEffect(() => {
    if (open) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [open])

  return (
    <div className="p-4 border-2 border-green-500 bg-green-50 rounded-lg">
      <h3 className="text-lg font-bold text-green-700 mb-2">Test Popover Nativo (senza Radix)</h3>
      <p className="text-sm text-green-600 mb-4">
        Stato: {open ? "APERTO" : "CHIUSO"} - Questo usa solo CSS e JavaScript nativo
      </p>

      <div className="relative">
        <Button ref={triggerRef} variant="outline" onClick={handleClick} className="bg-white">
          <Calendar className="mr-2 h-4 w-4" />
          Popover Nativo - Stato: {open ? "APERTO" : "CHIUSO"}
        </Button>

        {open && (
          <div
            className="fixed bg-white border shadow-lg rounded-md p-4 z-50"
            style={{
              left: position.x,
              top: position.y,
              width: "300px",
            }}
          >
            <h4 className="font-semibold mb-2">Popover Nativo Funziona!</h4>
            <p className="text-sm text-gray-600 mb-3">Questo popover è fatto senza Radix UI, solo con React e CSS.</p>
            <Button onClick={() => setOpen(false)} size="sm" className="bg-green-500 text-white">
              Chiudi
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
