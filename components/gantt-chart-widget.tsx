import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function GanttChartWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
        <CardDescription>Project timeline and tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          <p>Gantt chart component placeholder.</p>
        </div>
      </CardContent>
    </Card>
  )
}
