"use client"

import { useState } from "react"
import { EnhancedDatePicker } from "./ui/enhanced-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

export function TestDatePicker() {
  const [testValue, setTestValue] = useState("")

  return (
    <Card className="w-full max-w-md mx-auto mt-4 border-2 border-red-500">
      <CardHeader>
        <CardTitle>🔧 Test EnhancedDatePicker (RIMUOVERE DOPO DEBUG)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label>Test Date Picker (funziona?):</label>
            <EnhancedDatePicker
              id="test-picker"
              value={testValue}
              onChange={(value) => {
                console.log("Test picker onChange:", value)
                setTestValue(value)
              }}
              placeholder="Seleziona data test"
              showTimeSelect={true}
            />
          </div>
          <div className="text-sm text-gray-600">Valore corrente: {testValue || "Nessun valore"}</div>

          {/* Debug visivo per vedere tutti i popover */}
          <div className="text-xs text-red-600 mt-4">
            <p>Debug: Controlla se vedi popover nascosti:</p>
            <div className="mt-2 p-2 bg-yellow-100 border">
              Popover count: {document.querySelectorAll("[data-radix-popover-content]").length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
