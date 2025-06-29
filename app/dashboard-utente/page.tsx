"use client"
import { useState } from "react"
import React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgendaWidget } from "@/components/agenda-widget"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { KanbanWidget } from "@/components/kanban-widget"
import { GalleryManagerWidget } from "@/components/gallery-manager-widget"
import { FeedReaderWidget } from "@/components/feed-reader-widget"
import { TodoKanbanWidget } from "@/components/todo-kanban-widget"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle } from "lucide-react"
import { UserSummary } from "@/components/user-summary"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Widget wrapper component for error handling
const WidgetWrapper = ({
  children,
  widgetName,
  onRetry,
}: {
  children: React.ReactNode
  widgetName: string
  onRetry: () => void
}) => {
  return (
    <div className="w-full">
      <React.Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Caricamento {widgetName}...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <ErrorBoundary widgetName={widgetName} onRetry={onRetry}>
          {children}
        </ErrorBoundary>
      </React.Suspense>
    </div>
  )
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetName: string; onRetry: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; widgetName: string; onRetry: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in widget ${this.props.widgetName}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Errore nel widget {this.props.widgetName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Si è verificato un errore nel caricamento del widget.
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Dettagli errore</summary>
                    <pre className="mt-2 text-xs overflow-auto">{this.state.error.message}</pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                this.props.onRetry()
              }}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

const AVAILABLE_WIDGETS = [
  {
    id: "agenda",
    name: "Agenda",
    component: () => <AgendaWidget />,
  },
  {
    id: "gantt",
    name: "Diagramma Gantt",
    component: () => <GanttChartWidget />,
  },
  {
    id: "kanban",
    name: "Priorità",
    component: () => <KanbanWidget />,
  },
  {
    id: "todo_kanban",
    name: "Scadenze Todolist",
    component: () => <TodoKanbanWidget />,
  },
  {
    id: "gallery",
    name: "Gestione Galleria",
    component: () => <GalleryManagerWidget />,
  },
  {
    id: "feed1",
    name: "Feed Notizie 1",
    component: () => <FeedReaderWidget configKey="feed1" title="Feed Notizie Principale" />,
  },
  {
    id: "feed2",
    name: "Feed Notizie 2",
    component: () => <FeedReaderWidget configKey="feed2" title="Feed Secondario" numberOfItems={3} />,
  },
]

export default function UserDashboardPage() {
  const { user } = useAuth()
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("todo_kanban")
  const [key, setKey] = useState(0)

  const selectedWidget = AVAILABLE_WIDGETS.find((widget) => widget.id === selectedWidgetId)

  const reloadWidget = () => {
    setKey((prev) => prev + 1)
  }

  const renderSelectedWidget = () => {
    if (!selectedWidget) {
      return (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Nessun widget selezionato</CardTitle>
            <CardDescription>Seleziona un widget dal menu a tendina</CardDescription>
          </CardHeader>
          <CardContent className="dashboard-content">
            <p>Usa il selettore qui sopra per visualizzare e testare i widget disponibili.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <WidgetWrapper widgetName={selectedWidget.name} onRetry={reloadWidget}>
        {selectedWidget.component()}
      </WidgetWrapper>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-full w-full">
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ciao, {user?.nome || user?.username || "Utente"}!</h1>
            <p className="text-muted-foreground">Ecco una panoramica delle tue attività e impegni.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Riepilogo Attività</h2>
            <UserSummary />
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">Widget Disponibili</h2>
              <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleziona widget" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_WIDGETS.map((widget) => (
                    <SelectItem key={widget.id} value={widget.id}>
                      {widget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reloadWidget}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Ricarica Widget
            </Button>
          </div>

          <div className="widget-container mt-4" key={`widget-container-${key}`}>
            {renderSelectedWidget()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
