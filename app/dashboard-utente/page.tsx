"use client"
import { ProtectedRoute } from "@/components/protected-route" // Corrected import
import { UserSummary } from "./_components/user-summary"
import { AgendaWidget } from "@/components/agenda-widget"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-provider" // Import useAuth to get user's name

export default function UserDashboardPage() {
  const { user } = useAuth() // Get user for personalization

  return (
    <ProtectedRoute>
      <ScrollArea className="h-[calc(100vh-var(--header-height,4rem))]">
        {" "}
        {/* Adjust header height variable if needed */}
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
              Ciao, {user?.nome || user?.username || "Utente"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Ecco una panoramica delle tue attività e impegni.</p>
          </div>

          <UserSummary />

          <Separator className="my-6" />

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 mb-4">
              La Tua Agenda Dettagliata
            </h2>
            <AgendaWidget />
          </div>
        </div>
      </ScrollArea>
    </ProtectedRoute>
  )
}
