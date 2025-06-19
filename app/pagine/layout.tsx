import type React from "react"

export default function PagineLayout({ children }: { children: React.ReactNode }) {
  // Rimuovo ProtectedRoute per permettere accesso pubblico alle pagine
  return <>{children}</>
}
