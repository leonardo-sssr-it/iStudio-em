"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useSupabase } from "@/lib/supabase-provider"
import { useRouter } from "next/navigation"

type Page = {
  id: string
  titolo: string
  estratto?: string
  pubblicato: string
  categoria?: string
  privato: boolean
  attivo: boolean
  id_utente: string
}

export default function PagineListPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { supabase } = useSupabase()
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/")
      return
    }

    async function fetchPages() {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("pagine")
          .select("*")
          .eq("id_utente", user.id)
          .order("pubblicato", { ascending: false })

        if (error) throw error

        setPages(data || [])
      } catch (err: any) {
        console.error("Errore caricamento pagine:", err)
        setError(err.message || "Errore durante il caricamento delle pagine")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPages()
  }, [user, authLoading, supabase, router])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-6xl mx-auto my-8">
        <CardHeader>
          <CardTitle className="text-red-500">Errore</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Riprova
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Le mie Pagine</h1>
          <p className="text-muted-foreground">Gestisci le tue pagine pubblicate</p>
        </div>
        <Button asChild>
          <Link href="/pagine/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Pagina
          </Link>
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna pagina trovata</h3>
            <p className="text-muted-foreground text-center mb-4">
              Non hai ancora creato nessuna pagina. Inizia creando la tua prima pagina.
            </p>
            <Button asChild>
              <Link href="/pagine/new">
                <Plus className="mr-2 h-4 w-4" />
                Crea la prima pagina
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pagine ({pages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pagine/${page.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${page.attivo ? "bg-green-500" : "bg-red-500"}`}
                          title={page.attivo ? "Attivo" : "Non attivo"}
                        />
                        <h3 className="text-lg font-semibold truncate">{page.titolo}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Pubblicato il{" "}
                          {format(new Date(page.pubblicato), "d MMMM yyyy", {
                            locale: it,
                          })}
                        </span>
                        {page.categoria && <Badge variant="secondary">{page.categoria}</Badge>}
                        {page.privato && <Badge variant="outline">Privato</Badge>}
                      </div>
                      {page.estratto && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{page.estratto}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
