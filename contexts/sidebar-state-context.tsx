"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface SidebarStateContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobile: boolean
  isMobileView: boolean
  toggleMobileView: () => void
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined)

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  // Throttled resize handler per performance
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)

    // Auto-collapse su mobile
    if (mobile && !isCollapsed) {
      setIsCollapsed(true)
    }
  }, [isCollapsed])

  useEffect(() => {
    // Initial check
    handleResize()

    // Throttled resize listener
    let timeoutId: NodeJS.Timeout
    const throttledResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener("resize", throttledResize, { passive: true })
    return () => {
      window.removeEventListener("resize", throttledResize)
      clearTimeout(timeoutId)
    }
  }, [handleResize])

  const toggleMobileView = useCallback(() => {
    setIsMobileView((prev) => !prev)
  }, [])

  return (
    <SidebarStateContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobile: isMobile || isMobileView,
        isMobileView,
        toggleMobileView,
      }}
    >
      {children}
    </SidebarStateContext.Provider>
  )
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext)
  if (context === undefined) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider")
  }
  return context
}
