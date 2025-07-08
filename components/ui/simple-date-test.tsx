"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "lucide-react"

export function SimpleDateTest() {
  const [open, setOpen] = React.useState(false)

  const handleClick = () => {
    console.log("[SimpleDateTest] Button clicked!")
    setOpen(!open)
  }

  const handleOpenChange = (newOpen: boolean) => {
    console.log(`[SimpleDateTest] Open changed to: ${newOpen}`)
    setOpen(newOpen)
  }

  return (
    <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
      <h3 className="text-lg font-bold text-red-700 mb-2">Test Popover Semplice</h3>
      <p className="text-sm text-red-600 mb-4">
        Stato: {open ? "APERTO" : "CHIUSO"} - Se questo non si apre, il problema è nel Popover base
      </p>

      {/* Test 1: Popover controllato */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Test 1: Popover Controllato</h4>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" onClick={handleClick} className="bg-white">
                <Calendar className="mr-2 h-4 w-4" />
                Clicca qui (Controllato) - Stato: {open ? "APERTO" : "CHIUSO"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white border shadow-lg">
              <div className="p-4">
                <h4 className="font-semibold">Popover Aperto!</h4>
                <p>Se vedi questo, il popover funziona.</p>
                <Button onClick={() => setOpen(false)} className="mt-2" size="sm">
                  Chiudi
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Test 2: Popover non controllato */}
        <div>
          <h4 className="font-semibold">Test 2: Popover Non Controllato</h4>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => console.log("[SimpleDateTest] Non-controlled button clicked")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Clicca qui (Non Controllato)
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white border shadow-lg">
              <div className="p-4">
                <h4 className="font-semibold">Popover Non Controllato Aperto!</h4>
                <p>Questo dovrebbe aprirsi automaticamente.</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Test 3: Button normale per confronto */}
        <div>
          <h4 className="font-semibold">Test 3: Button Normale (per confronto)</h4>
          <Button
            onClick={() => {
              console.log("[SimpleDateTest] Normal button clicked")
              alert("Button normale funziona!")
            }}
            className="bg-blue-500 text-white"
          >
            Button Normale (dovrebbe sempre funzionare)
          </Button>
        </div>
      </div>
    </div>
  )
}
