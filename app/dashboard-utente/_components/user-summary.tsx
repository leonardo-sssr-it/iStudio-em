"use client"
import { useAuth } from "@/lib/auth-provider"
import { useUserDashboardSummary } from "@/hooks/use-user-dashboard-summary"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarDays, Clock } from "lucide-react"

export function UserSummary() {
  const { user } = useAuth()
  const { summary, isLoading, error } = useUserDashboardSummary(user?.id)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-full mb-2" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-red-500">Errore nel caricamento del riepilogo: {error}</CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-4 text-gray-500">Nessun dato disponibile per il riepilogo.</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summary.summaryCounts.map((item) => (
        <Card key={item.type} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${item.color}`}>
                <item.icon className={`h-5 w-5 ${item.textColor}`} />
              </div>
              <div className="font-medium text-sm">{item.label}</div>
            </div>
            <div className="mt-2 text-2xl font-bold">{item.count}</div>
          </CardContent>
        </Card>
      ))}

      {summary.todaysItems.length > 0 && (
        <Card className="col-span-full mt-4">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Eventi di oggi
            </h3>
            <div className="space-y-2">
              {summary.todaysItems.map((item) => (
                <div key={`${item.tabella_origine}-${item.id}`} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.color || "bg-gray-400"}`}></div>
                  <div className="text-sm flex-1">{item.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(item.date, "HH:mm", { locale: it })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary.nextWeekItems.length > 0 && (
        <Card className="col-span-full mt-2">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Prossimi eventi
            </h3>
            <div className="space-y-2">
              {summary.nextWeekItems.map((item) => (
                <div key={`${item.tabella_origine}-${item.id}`} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${item.color || "bg-gray-400"}`}></div>
                  <div className="text-sm flex-1">{item.title}</div>
                  <div className="text-xs text-gray-500">{format(item.date, "dd/MM", { locale: it })}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
