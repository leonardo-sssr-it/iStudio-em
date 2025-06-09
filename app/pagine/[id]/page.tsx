import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PageViewer from "@/components/pagine/page-viewer"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]

async function getPageData(id: string): Promise<{ page: Page | null; session: any }> {
  const supabase = createServerClient()
  const { data: page, error } = await supabase
    .from("pagine")
    .select("*, utente:id_utente ( username )") // Join implicito
    .eq("id", id)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    console.error("Errore caricamento pagina:", error)
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { page: page as Page | null, session }
}

export default async function Page({ params }: { params: { id: string } }) {
  const { page, session } = await getPageData(params.id)

  if (!page) {
    notFound()
  }

  // Verifica se la pagina è privata e se l'utente ha i permessi
  const isOwner = session?.user?.id === page.id_utente
  const isAdmin = session?.user?.user_metadata?.roles?.includes("admin")

  if (page.privato && !isOwner && !isAdmin) {
    notFound() // O mostra una pagina di "accesso negato"
  }

  return <PageViewer initialPage={page} session={session} />
}
