import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PageViewer from "@/components/pagine/page-viewer"
import type { Database } from "@/types/supabase"

type Page = Database["public"]["Tables"]["pagine"]["Row"]
const AUTH_COOKIE_NAME = "auth_session" // Must match AuthProvider

// Helper function to get and validate the custom session from cookie
async function getCustomSessionData(cookieStore: ReturnType<typeof cookies>) {
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)
  if (!sessionCookie || !sessionCookie.value) {
    console.log("[PageId] Custom session cookie not found.")
    return null
  }
  try {
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value))
    if (!sessionData.user_id || new Date(sessionData.expires_at) <= new Date()) {
      console.log("[PageId] Custom session invalid or expired.")
      return null
    }
    console.log("[PageId] Custom session valid for user_id:", sessionData.user_id)
    return sessionData
  } catch (error) {
    console.error("[PageId] Error parsing custom session cookie:", error)
    return null
  }
}

async function getPageData(
  id: string,
  cookieStore: ReturnType<typeof cookies>,
): Promise<{
  page: Page | null
  activeSession: { userId: string | null; roles: string[]; source: string } | null
}> {
  const supabase = createServerClient()

  // 1. Fetch page data - senza join
  const { data: page, error: pageError } = await supabase
    .from("pagine")
    .select("*") // Rimuoviamo il join che causava l'errore
    .eq("id", id)
    .single()

  if (pageError) {
    console.error(`[PageId] Errore caricamento pagina ${id}:`, pageError)
    return { page: null, activeSession: null }
  }
  if (!page) {
    console.log(`[PageId] Pagina ${id} non trovata nel DB.`)
    return { page: null, activeSession: null }
  }

  // 2. Attempt to get Supabase standard session
  const {
    data: { session: supabaseSession },
    error: supabaseSessionError,
  } = await supabase.auth.getSession()
  if (supabaseSessionError) {
    console.error("[PageId] Error getting Supabase session:", supabaseSessionError)
  }

  // 3. Attempt to get custom session
  const customSession = await getCustomSessionData(cookieStore)

  // 4. Determine active session and user details for permission checks
  let activeSession: { userId: string | null; roles: string[]; source: string } | null = null

  if (supabaseSession?.user) {
    console.log("[PageId] Using Supabase standard session for user:", supabaseSession.user.id)
    activeSession = {
      userId: supabaseSession.user.id,
      roles: (supabaseSession.user.user_metadata?.roles as string[]) || [],
      source: "supabase",
    }
  } else if (customSession?.user_id) {
    console.log("[PageId] Using custom session for user:", customSession.user_id)
    activeSession = {
      userId: customSession.user_id,
      roles: (customSession.roles as string[]) || [],
      source: "custom",
    }
  } else {
    console.log("[PageId] No active session found (neither Supabase nor custom).")
  }

  // Se necessario, possiamo recuperare i dati dell'utente separatamente
  if (page.id_utente) {
    try {
      const { data: userData } = await supabase.from("utenti").select("username").eq("id", page.id_utente).single()

      if (userData) {
        // Aggiungiamo manualmente i dati dell'utente alla pagina
        ;(page as any).utente = userData
      }
    } catch (error) {
      console.error(`[PageId] Errore nel recupero dei dati utente:`, error)
    }
  }

  return { page, activeSession }
}

export default async function Page({ params }: { params: { id: string } }) {
  // Validazione dell'ID
  const pageId = Number.parseInt(params.id, 10)
  if (isNaN(pageId)) {
    console.log(`[PageId] ID non valido: ${params.id}`)
    notFound()
    return
  }

  const cookieStore = cookies()
  console.log(`[PageId] Fetching page with ID: ${pageId}`)

  const { page, activeSession } = await getPageData(params.id, cookieStore)

  if (!page) {
    console.log(`[PageId] Pagina ${pageId} non trovata`)
    notFound()
    return
  }

  // Permission checks
  if (page.privato) {
    console.log(`[PageId] Page ${page.id} is private. Checking permissions.`)
    if (!activeSession || !activeSession.userId) {
      console.log(`[PageId] Page ${page.id} is private and no active session. Denying access.`)
      notFound()
      return
    }

    // Convertiamo id_utente a stringa per il confronto
    const pageUserId = String(page.id_utente)
    const isOwner = activeSession.userId === pageUserId
    const isAdmin = Array.isArray(activeSession.roles) && activeSession.roles.includes("admin")

    console.log(
      `[PageId] Page ${page.id} private access check: User ${activeSession.userId}, Owner ${pageUserId} (isOwner: ${isOwner}), Roles ${activeSession.roles} (isAdmin: ${isAdmin})`,
    )

    if (!isOwner && !isAdmin) {
      console.log(
        `[PageId] Page ${page.id} is private. User ${activeSession.userId} is not owner or admin. Denying access.`,
      )
      notFound()
      return
    }
    console.log(`[PageId] Page ${page.id} is private. Access GRANTED to user ${activeSession.userId}.`)
  } else {
    console.log(`[PageId] Page ${page.id} is public. Allowing access.`)
  }

  // Prepare session for PageViewer
  let pageViewerSession = null
  if (activeSession?.source === "supabase") {
    const {
      data: { session },
    } = await createServerClient().auth.getSession()
    pageViewerSession = session
  } else if (activeSession?.source === "custom" && activeSession.userId) {
    pageViewerSession = {
      user: { id: activeSession.userId, user_metadata: { roles: activeSession.roles } },
    } as any
  }

  return <PageViewer initialPage={page} session={pageViewerSession} />
}
