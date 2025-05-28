"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-media-query"

type SidebarContextType = {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile)

  // Aggiorna lo stato della sidebar quando cambia la dimensione dello schermo
  useEffect(() => {
    setIsSidebarOpen(!isMobile)
  }, [isMobile])

  // Carica lo stato salvato dal localStorage all'avvio
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("sidebarOpen")
      if (savedState !== null) {
        setIsSidebarOpen(savedState === "true")
      }
    } catch (error) {
      // Ignora errori di localStorage (modalità privata, ecc.)
    }
  }, [])

  // Salva lo stato nel localStorage quando cambia
  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", String(isSidebarOpen))
    } catch (error) {
      // Ignora errori di localStorage
    }
  }, [isSidebarOpen])

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)
  const openSidebar = () => setIsSidebarOpen(true)

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
