import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PageViewer from "@/components/pagine/page-viewer"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]

async function getPageData(id: string): Promise<{ page: Page | null; session: any; username?: string }> {
  const supabase = createServerClient()

  console.log("Cercando pagina con ID:", id)

  // Query semplice senza join per evitare problemi di relazione
  const { data: page, error } = await supabase.from("pagine").select("*").eq("id", id).single()

  console.log("Risultato query pagina:", { page, error })

  if (error) {
    console.error("Errore caricamento pagina:", error)
    if (error.code === "PGRST116") {
      // No rows found
      return { page: null, session: null }
    }
  }

  // Se abbiamo trovato la pagina, recuperiamo anche i dati dell'utente
  let username = undefined
  if (page && page.id_utente) {
    const { data: userData } = await supabase.from("utenti").select("username").eq("id", page.id_utente).single()

    username = userData?.username
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Sessione utente:", session?.user?.id)

  return { page: page as Page | null, session, username }
}

export default async function Page({ params }: { params: { id: string } }) {
  console.log("Parametri ricevuti:", params)

  const { page, session, username } = await getPageData(params.id)

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

  return <PageViewer initialPage={page} session={session} username={username} />
}

// Genera i parametri statici per le pagine più comuni (opzionale)
export async function generateStaticParams() {
  try {
    const supabase = createServerClient()

    const { data: pages } = await supabase.from("pagine").select("id").eq("attivo", true).limit(10)

    return (
      pages?.map((page) => ({
        id: page.id.toString(),
      })) || []
    )
  } catch (error) {
    console.error("Errore in generateStaticParams:", error)
    return []
  }
}
