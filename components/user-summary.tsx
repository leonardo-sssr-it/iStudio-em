"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserDashboardSummary } from "@/hooks/use-user-dashboard-summary"
import { CalendarDays, FileText, Clock, AlertTriangle } from "lucide-react"

interface SummaryCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  isLoading?: boolean
}

function SummaryCard({ title, value, description, icon, isLoading }: SummaryCardProps) {
  if (isLoading) {
    return (
      <Card className="w-[70%]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-8" />
          </div>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-[70%]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export function UserSummary() {
  const { data, isLoading, error } = useUserDashboardSummary()

  if (error) {
    return <div className="text-sm text-destructive">Errore nel caricamento del riepilogo: {error.message}</div>
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Eventi Oggi"
        value={data?.eventiOggi ?? 0}
        description="Appuntamenti in agenda"
        icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Note Attive"
        value={data?.noteAttive ?? 0}
        description="Note in lavorazione"
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Scadenze Prossime"
        value={data?.scadenzeProssime ?? 0}
        description="Nei prossimi 7 giorni"
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Priorità Alta"
        value={data?.prioritaAlta ?? 0}
        description="Elementi urgenti"
        icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
    </div>
  )
}
