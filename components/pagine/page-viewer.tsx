"use client"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"] & {
  utente?: { username: string }
}

interface PageViewerProps {
  initialPage: Page
  session: any
}

export default function PageViewer({ initialPage, session }: PageViewerProps) {
  const [page] = useState(initialPage)
  const isOwner = session?.user?.id === page.id_utente
  const isAdmin = session?.user?.user_metadata?.roles?.includes("admin")
  const canEdit = isOwner || isAdmin

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/pagine">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle pagine
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${page.attivo ? "bg-green-500" : "bg-red-500"}`}
                  title={page.attivo ? "Attivo" : "Non attivo"}
                />
                <CardTitle className="text-2xl">{page.titolo}</CardTitle>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>
                  Pubblicato il{" "}
                  {format(new Date(page.pubblicato), "d MMMM yyyy 'alle' HH:mm", {
                    locale: it,
                  })}
                </span>
                {page.utente?.username && <span>da {page.utente.username}</span>}
              </div>

              <div className="flex items-center gap-2 mb-4">
                {page.categoria && <Badge variant="secondary">{page.categoria}</Badge>}
                {page.privato && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Privato
                  </Badge>
                )}
                {!page.privato && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Pubblico
                  </Badge>
                )}
              </div>

              {page.estratto && <p className="text-muted-foreground italic mb-4">{page.estratto}</p>}
            </div>

            {canEdit && (
              <Button asChild>
                <Link href={`/pagine/${page.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifica
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {page.contenuto ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: page.contenuto }}
            />
          ) : (
            <p className="text-muted-foreground italic">Nessun contenuto disponibile.</p>
          )}
        </CardContent>
      </Card>

      {page.data_creazione && (
        <div className="mt-6 text-xs text-muted-foreground text-center">
          Creato il {format(new Date(page.data_creazione), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
          {page.data_modifica && page.data_modifica !== page.data_creazione && (
            <span>
              {" • "}
              Modificato il {format(new Date(page.data_modifica), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
