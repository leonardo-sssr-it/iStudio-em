"use client"
import { AgendaWidget } from "@/components/agenda-widget"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { KanbanWidget } from "@/components/kanban-widget"
import { GalleryManagerWidget } from "@/components/gallery-manager-widget"
import { FeedReaderWidget } from "@/components/feed-reader-widget"
import { TodoKanbanWidget } from "@/components/todo-kanban-widget"
import { UserSummary } from "./_components/user-summary"

const AVAILABLE_WIDGETS = [
  { id: "agenda", name: "Agenda", component: AgendaWidget },
  { id: "gantt", name: "Diagramma Gantt", component: GanttChartWidget },
  { id: "kanban", name: "Priorità", component: KanbanWidget },
  { id: "todo_kanban", name: "Scadenze Todolist", component: TodoKanbanWidget },
  { id: "gallery", name: "Gestione Galleria", component: GalleryManagerWidget },
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

export default function DashboardUtentePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Dashboard Utente</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Ecco una panoramica delle tue attività e impegni.
        </p>
      </div>

      {/* Riepilogo attività spostato qui sotto il testo introduttivo */}
      <UserSummary />
    </div>
  )
}
