"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Calendar, User, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]

interface PageViewerProps {
  initialPage: Page
  session: any
  username?: string
}

export default function PageViewer({ initialPage, session, username }: PageViewerProps) {
  const [page] = useState(initialPage)

  const isOwner = session?.user?.id === page.id_utente
  const isAdmin = session?.user?.user_metadata?.roles?.includes("admin")
  const canEdit = isOwner || isAdmin

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header con navigazione */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/pagine">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle pagine
          </Button>
        </Link>

        {canEdit && (
          <Link href={`/pagine/${page.id}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          </Link>
        )}
      </div>

      {/* Contenuto principale */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{page.titolo}</CardTitle>
              {page.estratto && <p className="text-muted-foreground">{page.estratto}</p>}
            </div>
            <div className="flex gap-2">
              <Badge variant={page.attivo ? "default" : "secondary"}>{page.attivo ? "Attivo" : "Non attivo"}</Badge>
              <Badge variant={page.privato ? "destructive" : "outline"}>
                {page.privato ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Privato
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Pubblico
                  </>
                )}
              </Badge>
              {page.categoria && <Badge variant="outline">{page.categoria}</Badge>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Metadati */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Autore: {username || "Sconosciuto"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Pubblicato: {formatDate(page.pubblicato)}</span>
            </div>
            {page.data_creazione && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Creato: {formatDate(page.data_creazione)}</span>
              </div>
            )}
          </div>

          {/* Contenuto */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{page.contenuto}</div>
          </div>

          {/* Tags */}
          {page.tags && Array.isArray(page.tags) && page.tags.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {page.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {String(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
