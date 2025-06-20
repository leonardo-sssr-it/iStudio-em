"use client"

import { useState, useEffect } from "react"

interface AgendaWidgetProps {
  onViewChange?: (view: "day" | "week" | "month") => void
}

export function AgendaWidget({ onViewChange }: AgendaWidgetProps) {
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("week")

  useEffect(() => {
    onViewChange?.(currentView)
  }, [currentView, onViewChange])

  const handleViewChange = (view: "day" | "week" | "month") => {
    setCurrentView(view)
  }

  return (
    <div>
      <div>
        <button onClick={() => handleViewChange("day")}>Day</button>
        <button onClick={() => handleViewChange("week")}>Week</button>
        <button onClick={() => handleViewChange("month")}>Month</button>
      </div>
      <div>
        {currentView === "day" && <p>Day View Content</p>}
        {currentView === "week" && <p>Week View Content</p>}
        {currentView === "month" && <p>Month View Content</p>}
      </div>
    </div>
  )
}
