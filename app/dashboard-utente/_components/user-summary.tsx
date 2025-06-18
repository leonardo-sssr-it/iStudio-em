"use client"

import { useUserDashboardSummary, type UpcomingItem, type SummaryCount } from "@/hooks/use-user-dashboard-summary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CalendarClock, CalendarPlus, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import { memo, useCallback, useMemo } from "react"

// Memoized SummaryCard - SEMPRE mostrata anche con count 0
const SummaryCard = memo(({ type, label, count, icon: Icon, color, textColor }: SummaryCount) => {
  const href = useMemo(() => `/data-explorer?table=${encodeURIComponent(type)}`, [type])

  return (
    <Link href={href} className="block">
      <Card
        className={`shadow-lg hover:shadow-xl transition-all duration-300 ${color} cursor-pointer transform hover:scale-105`}
        role="button"
        tabIndex={0}
        aria-label={`Visualizza ${label}: ${count} elementi`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${textColor}`}>{label}</CardTitle>
          <Icon className={`h-5 w-5 ${textColor} opacity-80`} aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${textColor}`} aria-label={`${count} elementi`}>
            {count.toLocaleString("it-IT")}
          </div>
          <p className={`text-xs ${textColor} opacity-70 mt-1`}>
            {count === 0 ? "Nessun elemento" : "Elementi totali"}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
})

SummaryCard.displayName = "SummaryCard"

// Memoized UpcomingItem per performance
const UpcomingItemComponent = memo(({ item }: { item: UpcomingItem }) => {
  const href = useMemo(
    () => `/data-explorer/${encodeURIComponent(item.tabella_origine)}/${encodeURIComponent(item.id_origine)}`,
    [item.tabella_origine, item.id_origine],
  )

  const formattedDate = useMemo(() => {
    try {
      return format(item.date, "dd MMM HH:mm", { locale: it })
    } catch (error) {
      console.warn("Errore nel formato data:", error)
      return "Data non valida"
    }
  }, [item.date])

  return (
    <li className="text-sm border-b pb-1 last:border-b-0">
      <Link
        href={href}
        className="hover:underline group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        aria-label={`${item.title} - ${formattedDate}`}
      >
        <div className="flex justify-between items-center gap-2">
          <span className="font-medium group-hover:text-primary truncate flex-1" title={item.title}>
            {item.title}
          </span>
          <Badge
            variant="outline"
            className={`${item.color?.replace("text-", "border-").replace("600", "400")} ${item.color?.replace("text-", "bg-").replace("600", "50")} text-white font-bold shrink-0`}
          >
            {formattedDate}
          </Badge>
        </div>
        <span className={`text-xs ${item.color} opacity-90 capitalize`}>{item.type}</span>
      </Link>
    </li>
  )
})

UpcomingItemComponent.displayName = "UpcomingItemComponent"

// Memoized UpcomingItemsList per evitare re-render
const UpcomingItemsList = memo(
  ({ title, items, icon: Icon }: { title: string; items: UpcomingItem[]; icon: LucideIcon }) => {
    const hasItems = items.length > 0

    if (!hasItems) {
      return (
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Icon className="h-5 w-5 mr-2 text-gray-500" aria-hidden="true" />
              {title}
              <Badge variant="secondary" className="ml-2">
                0
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Nessun elemento imminente.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="col-span-1 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Icon className="h-5 w-5 mr-2 text-primary" aria-hidden="true" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2" role="list">
            {items.map((item) => (
              <UpcomingItemComponent key={`${item.tabella_origine}-${item.id_origine}`} item={item} />
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  },
)

UpcomingItemsList.displayName = "UpcomingItemsList"

// Componente principale con ottimizzazioni
export function UserSummary() {
  const { dashboardData, isLoading, error, refetch } = useUserDashboardSummary()

  const handleRefresh = useCallback(() => {
    if (refetch) {
      refetch()
    }
  }, [refetch])

  // Memoized loading skeleton per tutte le 8 tabelle
  const loadingSkeleton = useMemo(
    () => (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
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
    ),
    [],
  )

  if (isLoading) {
    return loadingSkeleton
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle className="text-destructive">Errore nel caricamento del riepilogo</CardTitle>
          </div>
          {refetch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-sm text-destructive-foreground/80 mt-1">
            Prova a ricaricare la pagina o contatta il supporto se il problema persiste.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Nessun dato disponibile per il riepilogo.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sezione contatori - SEMPRE tutte le 8 tabelle anche con count 0 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
        {dashboardData.summaryCounts.map((summary) => (
          <SummaryCard key={summary.type} {...summary} />
        ))}
      </div>

      {/* Sezione elementi imminenti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingItemsList title="Elementi di Oggi" items={dashboardData.todaysItems} icon={CalendarClock} />
        <UpcomingItemsList title="Prossima Settimana" items={dashboardData.nextWeekItems} icon={CalendarPlus} />
      </div>
    </div>
  )
}
