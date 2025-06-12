import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]

async function getUserPages(): Promise<{ pages: Page[]; session: any }> {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const { data: pages, error } = await supabase
    .from("pagine")
    .select("*")
    .eq("id_utente", session.user.id)
    .order("pubblicato", { ascending: false })

  if (error) {
    console.error("Errore caricamento pagine:", error)
    return { pages: [], session }
  }

  return { pages: pages || [], session }
}

export default async function PagineListPage() {
  const { pages, session } = await getUserPages()

  return (
    <div className="container mx-auto py-8 px-4">
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
