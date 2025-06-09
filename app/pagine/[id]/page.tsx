import { createServerClient } from "@/lib/supabase/server" // This import should now work
import { notFound } from "next/navigation"
import PageViewer from "@/components/pagine/page-viewer"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]

async function getPageData(id: string): Promise<{ page: Page | null; session: any }> {
  const supabase = createServerClient() // Uses the newly created server client

  // Attempt to get Supabase standard session first
  const {
    data: { session: supabaseSession },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Error getting Supabase session:", sessionError)
  }

  const { data: page, error } = await supabase
    .from("pagine")
    .select("*, utente:id_utente ( username )")
    .eq("id", id)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Errore caricamento pagina:", error)
  }

  // We pass supabaseSession to the PageViewer, which might be null if user is not authenticated via Supabase standard session
  return { page: page as Page | null, session: supabaseSession }
}

export default async function Page({ params }: { params: { id: string } }) {
  const { page, session } = await getPageData(params.id)

  if (!page) {
    notFound()
  }

  // Verifica se la pagina è privata e se l'utente ha i permessi
  // This logic relies on the session object.
  // If you are using a custom auth cookie, this session might be null.
  // You might need to re-evaluate how you check permissions if custom auth is primary.
  const isOwner = session?.user?.id === page.id_utente
  const isAdmin = session?.user?.user_metadata?.roles?.includes("admin") // Ensure 'roles' exists in user_metadata

  if (page.privato && !isOwner && !isAdmin) {
    // If using custom auth, and session is null, this check might incorrectly deny access
    // or grant access if page.privato is false.
    // Consider also checking your custom session cookie here if needed for private pages.
    console.warn(
      `Access check for private page ${page.id}: Supabase session user ID: ${session?.user?.id}, Page owner: ${page.id_utente}, IsAdmin: ${isAdmin}`,
    )
    if (!session) {
      // If no Supabase session, and page is private, deny access
      console.log(`Page ${page.id} is private and no Supabase session found. Denying access.`)
      notFound() // Or redirect to login / access denied page
    } else if (page.privato && !isOwner && !isAdmin) {
      // If there is a session, but user is not owner or admin
      console.log(`Page ${page.id} is private. User ${session.user.id} is not owner or admin. Denying access.`)
      notFound()
    }
  }

  return <PageViewer initialPage={page} session={session} />
}
