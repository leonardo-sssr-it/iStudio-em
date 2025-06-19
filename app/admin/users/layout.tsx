import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute adminOnly={true}>{children}</ProtectedRoute>
}
