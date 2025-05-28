"use client"
import { useDebugDeadlines } from "@/hooks/use-debug-deadlines"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebugConfig } from "@/hooks/use-debug-config"

export function DebugDeadlines() {
  const { isDebugEnabled, isAdmin } = useDebugConfig()
  const { userDeadlines, generalDeadlines, combinedItems, isLoading, error } = useDebugDeadlines()

  if (!isDebugEnabled || !isAdmin) {
    return null
  }

  if (isLoading) {
    return <div>Caricamento dati di debug...</div>
  }

  if (error) {
    return <div>Errore: {error.message}</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Debug Scadenze</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="user">
          <TabsList>
            <TabsTrigger value="user">Scadenze Utente ({userDeadlines.length})</TabsTrigger>
            <TabsTrigger value="general">Scadenze Generali ({generalDeadlines.length})</TabsTrigger>
            <TabsTrigger value="combined">Items Combinati ({combinedItems.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="user">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(userDeadlines, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="general">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(generalDeadlines, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="combined">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(combinedItems, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
