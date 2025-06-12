import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PageViewer from "@/components/pagine/page-viewer"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]

async function getPageData(id: string): Promise<{ page: Page | null; session: any }> {
  const supabase = createServerClient()

  console.log("Cercando pagina con ID:", id)

  // Prima verifichiamo se la pagina esiste
  const { data: page, error } = await supabase
    .from("pagine")
    .select(`
      *,
      utente:utenti!pagine_id_utente_fkey (
        username
      )
    `)
    .eq("id", id)
    .single()

  console.log("Risultato query pagina:", { page, error })

  if (error) {
    console.error("Errore caricamento pagina:", error)
    if (error.code === "PGRST116") {
      // No rows found
      return { page: null, session: null }
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Sessione utente:", session?.user?.id)

  return { page: page as Page | null, session }
}

export default async function Page({ params }: { params: { id: string } }) {
  console.log("Parametri ricevuti:", params)

  const { page, session } = await getPageData(params.id)

  if (!page) {
    console.log("Pagina non trovata, reindirizzando a notFound")
    notFound()
  }

  // Verifica se la pagina è privata e se l'utente ha i permessi
  const isOwner = session?.user?.id === page.id_utente
  const isAdmin = session?.user?.user_metadata?.roles?.includes("admin")

  console.log("Controlli permessi:", {
    isPrivate: page.privato,
    isOwner,
    isAdmin,
    userId: session?.user?.id,
    pageUserId: page.id_utente,
  })

  if (page.privato && !isOwner && !isAdmin) {
    console.log("Accesso negato per pagina privata")
    notFound()
  }

  return <PageViewer initialPage={page} session={session} />
}

// Genera i parametri statici per le pagine più comuni (opzionale)
export async function generateStaticParams() {
  const supabase = createServerClient()

  const { data: pages } = await supabase.from("pagine").select("id").eq("attivo", true).limit(10)

  return (
    pages?.map((page) => ({
      id: page.id.toString(),
    })) || []
  )
}
