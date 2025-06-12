import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function PagineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute requiredPermission="read">{children}</ProtectedRoute>
}
