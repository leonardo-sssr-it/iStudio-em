"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { createClient } from "@/lib/supabase/client"

interface GanttTask {
  id: string
  title: string
  start_date: string
  end_date: string
  progress: number
  priority: "low" | "medium" | "high"
  assigned_to?: string
  description?: string
}

export function GanttChartWidget() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const supabase = createClient()

  // Generate sample tasks if no data is available
  const generateSampleTasks = (): GanttTask[] => {
    const today = new Date()
    return [
      {
        id: "1",
        title: "Progettazione UI/UX",
        start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 75,
        priority: "high",
        assigned_to: user?.username || "Utente",
        description: "Creazione mockup e wireframe",
      },
      {
        id: "2",
        title: "Sviluppo Backend",
        start_date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 30,
        priority: "medium",
        assigned_to: user?.username || "Utente",
        description: "API e database setup",
      },
      {
        id: "3",
        title: "Testing e QA",
        start_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        priority: "low",
        assigned_to: user?.username || "Utente",
        description: "Test funzionali e correzione bug",
      },
    ]
  }

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // Try to load tasks from database (you can customize this query)
        const { data, error } = await supabase.from("tasks").select("*").limit(10)

        if (error) {
          console.log("No tasks table found, using sample data")
          setTasks(generateSampleTasks())
        } else {
          // Map database data to GanttTask format if needed
          setTasks(data || generateSampleTasks())
        }
      } catch (error) {
        console.log("Error loading tasks, using sample data:", error)
        setTasks(generateSampleTasks())
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [user])

  const getWeekDays = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay() + 1) // Start from Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const isTaskInDay = (task: GanttTask, day: Date) => {
    const taskStart = new Date(task.start_date)
    const taskEnd = new Date(task.end_date)
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    return taskStart <= dayEnd && taskEnd >= dayStart
  }

  const getTaskPosition = (task: GanttTask, weekDays: Date[]) => {
    const taskStart = new Date(task.start_date)
    const taskEnd = new Date(task.end_date)
    const weekStart = weekDays[0]
    const weekEnd = new Date(weekDays[6])
    weekEnd.setHours(23, 59, 59, 999)

    if (taskEnd < weekStart || taskStart > weekEnd) return null

    const startDay = Math.max(0, Math.floor((taskStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)))
    const endDay = Math.min(6, Math.floor((taskEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)))

    return {
      left: `${(startDay / 7) * 100}%`,
      width: `${((endDay - startDay + 1) / 7) * 100}%`,
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const weekDays = getWeekDays(currentWeek)

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gantt Chart
          </CardTitle>
          <CardDescription>Caricamento timeline progetti...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gantt Chart
        </CardTitle>
        <CardDescription>Timeline progetti e attività</CardDescription>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {weekDays[0].toLocaleDateString("it-IT", { day: "numeric", month: "short" })} -{" "}
            {weekDays[6].toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Header with days */}
          <div className="grid grid-cols-8 gap-2 text-sm font-medium">
            <div className="text-left">Attività</div>
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div>{day.toLocaleDateString("it-IT", { weekday: "short" })}</div>
                <div className="text-xs text-muted-foreground">{day.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const position = getTaskPosition(task, weekDays)

              return (
                <div key={task.id} className="grid grid-cols-8 gap-2 items-center min-h-[60px]">
                  {/* Task Info */}
                  <div className="space-y-1">
                    <div className="font-medium text-sm truncate" title={task.title}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)} text-white`}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                    {task.assigned_to && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {task.assigned_to}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="col-span-7 relative h-8">
                    {position && (
                      <div
                        className={`absolute h-6 rounded ${getPriorityColor(task.priority)} opacity-80 flex items-center px-2`}
                        style={{ left: position.left, width: position.width }}
                        title={`${task.title} (${task.progress}%)`}
                      >
                        <div className="text-xs text-white font-medium truncate">{task.progress}%</div>
                        {/* Progress bar */}
                        <div
                          className="absolute bottom-0 left-0 h-1 bg-white opacity-50 rounded-b"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna attività trovata</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Attività
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
