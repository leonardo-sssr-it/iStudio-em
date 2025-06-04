"use client"

import { useUserDashboardSummary, type UpcomingItem, type SummaryCount } from "@/hooks/use-user-dashboard-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CalendarClock, CalendarPlus } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

const SummaryCard = ({ type, label, count, icon: Icon, color, textColor }: SummaryCount) => (
  <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${color}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className={`text-sm font-medium ${textColor}`}>{label}</CardTitle>
      <Icon className={`h-5 w-5 ${textColor} opacity-80`} />
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${textColor}`}>{count}</div>
      <p className={`text-xs ${textColor} opacity-70 mt-1`}>Elementi totali</p>
    </CardContent>
  </Card>
)

const UpcomingItemsList = ({
  title,
  items,
  icon: Icon,
}: { title: string; items: UpcomingItem[]; icon: LucideIcon }) => {
  if (!items.length) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Icon className="h-5 w-5 mr-2 text-gray-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nessun elemento imminente.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 md:col-span-2 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Icon className="h-5 w-5 mr-2 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.tabella_origine}-${item.id_origine}`} className="text-sm border-b pb-1 last:border-b-0">
              <Link
                href={`/data-explorer?table=${item.tabella_origine}&id=${item.id_origine}`}
                className="hover:underline group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium group-hover:text-primary truncate" title={item.title}>
                    {item.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${item.color?.replace("text-", "border-").replace("600", "400")} ${item.color?.replace("text-", "bg-").replace("600", "50")} ${item.color}`}
                  >
                    {format(item.date, "dd MMM HH:mm", { locale: it })}
                  </Badge>
                </div>
                <span className={`text-xs ${item.color} opacity-90 capitalize`}>{item.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function UserSummary() {
  const { dashboardData, isLoading, error } = useUserDashboardSummary()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Errore nel caricamento del riepilogo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-sm text-destructive-foreground/80 mt-1">Prova a ricaricare la pagina.</p>
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return <p>Nessun dato disponibile per il riepilogo.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dashboardData.summaryCounts.map((summary) => (
          <SummaryCard key={summary.type} {...summary} />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingItemsList title="Elementi di Oggi" items={dashboardData.todaysItems} icon={CalendarClock} />
        <UpcomingItemsList title="Prossima Settimana" items={dashboardData.nextWeekItems} icon={CalendarPlus} />
      </div>
    </div>
  )
}
