"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, UserCircle, Calendar, ListTodo, LayoutGrid } from "lucide-react"
import { UserProfileTab } from "@/components/user-profile-tab"
import { UserTablesTab } from "@/components/user-tables-tab"
import { GanttChartWidget } from "@/components/gantt-chart-widget"
import { AgendaWidget } from "@/components/agenda-widget"
import { KanbanWidget } from "@/components/kanban-widget"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("agenda")
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <ProtectedRoute>
      <div className="w-full min-h-full content-inherit">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        <Card className="mb-4 sm:mb-6 overflow-hidden dashboard-card">
          <CardHeader className="p-3 sm:p-6 flex flex-row justify-between items-start">
            <div>
              <CardTitle>Benvenuto, {user?.nome || user?.username}!</CardTitle>
              <CardDescription className="line-clamp-2 sm:line-clamp-none">
                Accesso effettuato. Puoi esplorare le tue tabelle e visualizzare i tuoi dati.
              </CardDescription>
            </div>
            <div className="text-right">
              <CardTitle className="text-sm sm:text-base flex flex-col items-end">
                <span>{currentDateTime.toLocaleDateString("it-IT", { weekday: "long" })}</span>
                <span>
                  {currentDateTime.getDate()} {currentDateTime.toLocaleDateString("it-IT", { month: "long" })}{" "}
                  {currentDateTime.getFullYear()}
                </span>
                <span>
                  {currentDateTime.getHours().toString().padStart(2, "0")}:
                  {currentDateTime.getMinutes().toString().padStart(2, "0")}:
                  {currentDateTime.getSeconds().toString().padStart(2, "0")}
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 dashboard-content">
            <Tabs defaultValue="agenda" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4 sm:mb-6 w-full">
                <TabsTrigger value="agenda" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <ListTodo className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Agenda</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="gantt" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Gantt</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Profilo</span>
                </TabsTrigger>
                <TabsTrigger value="tables" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Tabelle</span>
                </TabsTrigger>
              </TabsList>

              <div className="overflow-x-auto">
                <TabsContent value="profile" className="space-y-4 min-w-full">
                  <UserProfileTab user={user} />
                </TabsContent>

                <TabsContent value="tables" className="space-y-4 min-w-full">
                  <UserTablesTab />
                </TabsContent>

                <TabsContent value="gantt" className="space-y-4 min-w-full">
                  <GanttChartWidget />
                </TabsContent>

                <TabsContent value="agenda" className="space-y-4 min-w-full">
                  <AgendaWidget />
                </TabsContent>

                <TabsContent value="kanban" className="space-y-4 min-w-full">
                  <KanbanWidget />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
