"use client"

import { useState } from "react"
import { EnhancedDatePicker } from "./ui/enhanced-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

export function TestDatePicker() {
  const [testValue, setTestValue] = useState("")

  return (
    <Card className="w-full max-w-md mx-auto mt-4 border-2 border-green-500">
      <CardHeader>
        <CardTitle>🔧 Test EnhancedDatePicker - Interattività</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label>Test Date Picker (dovrebbe essere interattivo):</label>
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

          {/* Debug per l'interattività */}
          <div className="text-xs text-blue-600 mt-4">
            <p>Debug interattività:</p>
            <div className="mt-2 p-2 bg-blue-100 border">
              <p>1. Il popover si apre? {testValue ? "✅" : "❌"}</p>
              <p>2. Puoi cliccare sui giorni del calendario?</p>
              <p>3. Puoi modificare l'orario?</p>
              <p>4. I bottoni funzionano?</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
