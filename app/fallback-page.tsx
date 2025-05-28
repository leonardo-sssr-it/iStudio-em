"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"
import Link from "next/link"

export default function FallbackPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">iStudio Explorer</h1>

      <Card>
        <CardHeader>
          <CardTitle>Accedi al Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground mb-6">
            Benvenuto in iStudio Explorer. Accedi per esplorare le tabelle e gestire i dati.
          </p>

          <Link href="/login">
            <Button className="w-full">
              <Database className="mr-2 h-4 w-4" />
              Accedi
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
