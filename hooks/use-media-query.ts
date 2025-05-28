"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Verifica se window è disponibile (lato client)
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query)

      // Imposta lo stato iniziale
      setMatches(media.matches)

      // Funzione per aggiornare lo stato quando cambia il media query
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches)
      }

      // Aggiungi il listener
      media.addEventListener("change", listener)

      // Rimuovi il listener quando il componente viene smontato
      return () => {
        media.removeEventListener("change", listener)
      }
    }

    return undefined
  }, [query])

  return matches
}

// Hook specifico per rilevare dispositivi mobili
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)")
}
