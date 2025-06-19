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
  <Link href={`/data-explorer?table=${type}`} className="block">
    <Card
      className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${color} cursor-pointer transform hover:scale-105 transition-transform`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className={`text-xs font-medium ${textColor} truncate`}>{label}</CardTitle>
        <Icon className={`h-4 w-4 ${textColor} opacity-80 flex-shrink-0`} />
      </CardHeader>
      <CardContent className="pt-1">
        <div className={`text-xl font-bold ${textColor}`}>{count}</div>
        <p className={`text-[10px] ${textColor} opacity-70 mt-0.5`}>Elementi totali</p>
      </CardContent>
    </Card>
  </Link>
)

const UpcomingItemsList = ({
  title,
  items,
  icon: Icon,
}: { title: string; items: UpcomingItem[]; icon: LucideIcon }) => {
  if (!items.length) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Icon className="h-4 w-4 mr-2 text-gray-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-500">Nessun elemento imminente.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <Icon className="h-4 w-4 mr-2 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={`${item.tabella_origine}-${item.id_origine}`} className="text-xs border-b pb-1 last:border-b-0">
              <Link
                href={`/data-explorer/${item.tabella_origine}/${item.id_origine}`}
                className="hover:underline group"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium group-hover:text-primary truncate flex-1" title={item.title}>
                    {item.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${item.color?.replace("text-", "border-").replace("600", "400")} ${item.color?.replace("text-", "bg-").replace("600", "50")} text-white text-[10px] px-1.5 py-0.5 flex-shrink-0`}
                  >
                    {format(item.date, "dd MMM HH:mm", { locale: it })}
                  </Badge>
                </div>
                <span className={`text-[10px] ${item.color} opacity-90 capitalize`}>{item.type}</span>
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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-1">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="pt-1">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-16 mt-0.5" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center space-x-2 pb-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-destructive text-base">Errore nel caricamento del riepilogo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-destructive">{error}</p>
          <p className="text-xs text-destructive-foreground/80 mt-1">Prova a ricaricare la pagina.</p>
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return <p className="text-sm">Nessun dato disponibile per il riepilogo.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
        {dashboardData.summaryCounts.map((summary) => (
          <SummaryCard key={summary.type} {...summary} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingItemsList title="Elementi di Oggi" items={dashboardData.todaysItems} icon={CalendarClock} />
        <UpcomingItemsList title="Prossima Settimana" items={dashboardData.nextWeekItems} icon={CalendarPlus} />
      </div>
    </div>
  )
}
