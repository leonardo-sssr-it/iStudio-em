"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import Link from "next/link"
import type { AuthUser } from "@/lib/auth-provider"

interface UserProfileTabProps {
  user: AuthUser | null
}

export function UserProfileTab({ user }: UserProfileTabProps) {
  if (!user) return null

  // Formatta la data di ultimo accesso
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Mai"
    try {
      return new Date(dateString).toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return dateString
    }
  }

  // Filtra i campi che non vogliamo mostrare
  const filteredUserData = Object.entries(user).filter(([key]) => !["password", "session", "immagine"].includes(key))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Personali</CardTitle>
          <CardDescription>Visualizza i tuoi dati personali</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUserData.map(([key, value]) => {
              // Formatta il valore se è una data
              let displayValue = value
              if (
                typeof value === "string" &&
                (key.includes("data") || key.includes("date") || key === "ultimo_accesso")
              ) {
                displayValue = formatDate(value)
              } else if (value === null || value === undefined) {
                displayValue = "Non specificato"
              }

              return (
                <div className="space-y-2" key={key}>
                  <Label>{key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}</Label>
                  <div className="p-2 bg-muted rounded-md">{String(displayValue)}</div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end mt-4">
            <Link href="/profile">
              <Button className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Modifica Profilo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
