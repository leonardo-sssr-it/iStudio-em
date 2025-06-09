"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calendar, CheckSquare, Clock, ListTodo } from "lucide-react"
import { useDailySummary } from "@/hooks/use-daily-summary"

export function DailySummaryCard() {
  const { appuntamentiCount, attivitaCount, scadenzeCount, todolistCount, isLoading, error } = useDailySummary()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Giornaliero</CardTitle>
          <CardDescription>Attività di oggi</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Giornaliero</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const summaryItems = [
    { label: "Appuntamenti", count: appuntamentiCount, icon: Calendar, color: "text-blue-500" },
    { label: "Attività", count: attivitaCount, icon: CheckSquare, color: "text-green-500" },
    { label: "Scadenze", count: scadenzeCount, icon: Clock, color: "text-yellow-500" },
    { label: "To-do", count: todolistCount, icon: ListTodo, color: "text-purple-500" },
  ]

  const totalItems = appuntamentiCount + attivitaCount + scadenzeCount + todolistCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riepilogo di Oggi</CardTitle>
        <CardDescription>Una panoramica delle tue attività odierne.</CardDescription>
      </CardHeader>
      <CardContent>
        {totalItems === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna attività programmata per oggi.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {summaryItems
              .filter((item) => item.count > 0)
              .map((item) => (
                <div key={item.label} className="flex items-start p-3 bg-muted/50 rounded-lg">
                  <item.icon className={`h-6 w-6 mr-3 flex-shrink-0 ${item.color}`} />
                  <div>
                    <p className="text-xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
