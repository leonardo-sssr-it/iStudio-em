import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { PlusCircle, FileText } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/supabase"

const AUTH_COOKIE_NAME = "auth_session" // Deve corrispondere a quello in AuthProvider

// Helper function to get and validate the custom session from cookie
async function getCustomSessionData(cookieStore: ReturnType<typeof cookies>) {
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)

  if (!sessionCookie || !sessionCookie.value) {
    console.log("[PaginePage] Custom session cookie not found.")
    return null
  }

  try {
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value))
    // Basic validation: check for user_id and expiration
    if (!sessionData.user_id || new Date(sessionData.expires_at) <= new Date()) {
      console.log("[PaginePage] Custom session invalid or expired.")
      // Optionally, you could clear the invalid cookie here, but it's complex in Server Components
      return null
    }
    // You might want to add a check here to ensure the user_id still exists in your 'utenti' table
    // For example:
    // const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    // const { data: user, error } = await supabase.from('utenti').select('id').eq('id', sessionData.user_id).single();
    // if (error || !user) {
    //   console.log("[PaginePage] User from custom session not found in DB.");
    //   return null;
    // }
    console.log("[PaginePage] Custom session valid for user_id:", sessionData.user_id)
    return sessionData // Contains user_id, expires_at, token
  } catch (error) {
    console.error("[PaginePage] Error parsing custom session cookie:", error)
    return null
  }
}

// Helper function to format date strings safely
const formatDate = (dateString: string | null) => {
  if (!dateString) return "Data non disponibile"
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm")
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Data non valida"
  }
}

export default async function PagineListPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

  const customSession = await getCustomSessionData(cookieStore)

  if (!customSession) {
    console.log("[PaginePage] No valid custom session. Redirecting to /.")
    redirect("/") // Redirect to login if not authenticated by custom session
  }

  // User is authenticated via custom session, proceed to fetch pages
  // You can use customSession.user_id if you need to filter pages by user,
  // but the current query fetches all pages.
  const { data: pagine, error } = await supabase
    .from("pagine")
    .select("id, titolo, pubblicato")
    .order("pubblicato", { ascending: false })

  if (error) {
    console.error("Error fetching pages:", error)
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md m-4">
          <CardHeader>
            <CardTitle className="text-destructive">Errore</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Si è verificato un errore nel caricamento delle pagine.</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Le Tue Pagine</CardTitle>
            <CardDescription>Visualizza, modifica e crea nuove pagine di contenuto.</CardDescription>
          </div>
          <Link href="/pagine/new" passHref>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crea Nuova Pagina
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead className="text-right">Data Creazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagine && pagine.length > 0 ? (
                  pagine.map((pagina) => (
                    <TableRow key={pagina.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{pagina.id}</TableCell>
                      <TableCell>
                        <Link href={`/pagine/${pagina.id}`} className="font-semibold text-primary hover:underline">
                          {pagina.titolo}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(pagina.pubblicato)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Nessuna pagina trovata.</p>
                        <p className="text-sm text-muted-foreground">Inizia creando la tua prima pagina.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
