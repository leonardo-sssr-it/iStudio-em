"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"

type SidebarStateContextType = {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
  isMobile: boolean
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined)

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Evita hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Carica lo stato salvato dal localStorage all'avvio
  useEffect(() => {
    if (!isMounted) return

    try {
      const savedState = localStorage.getItem("sidebarCollapsed")
      if (savedState !== null) {
        setIsCollapsed(savedState === "true")
      } else {
        // Default: collassata su mobile, espansa su desktop
        setIsCollapsed(isMobile)
      }
    } catch (error) {
      // Ignora errori di localStorage (modalità privata, ecc.)
      setIsCollapsed(isMobile)
    }
  }, [isMobile, isMounted])

  // Salva lo stato nel localStorage quando cambia
  useEffect(() => {
    if (!isMounted) return

    try {
      localStorage.setItem("sidebarCollapsed", String(isCollapsed))
    } catch (error) {
      // Ignora errori di localStorage
    }
  }, [isCollapsed, isMounted])

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev)

  return (
    <SidebarStateContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        isMobile,
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
