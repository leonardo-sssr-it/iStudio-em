"use client"

import { useState } from "react"
import { EnhancedDatePicker } from "./ui/enhanced-date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

export function TestDatePicker() {
  const [testValue, setTestValue] = useState("")

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Test EnhancedDatePicker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label>Test Date Picker:</label>
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
        </div>
      </CardContent>
    </Card>
  )
}
