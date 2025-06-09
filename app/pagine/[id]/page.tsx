import { cookies } from "next/headers" // Ensure cookies is imported
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
    // Optional: Fetch user from DB to confirm existence based on sessionData.user_id
    // const supabase = createServerClient(); // careful with multiple client creations if not needed
    // const { data: userDb } = await supabase.from('utenti').select('id, roles').eq('id', sessionData.user_id).single();
    // if (!userDb) return null;
    // sessionData.roles = userDb.roles; // Augment sessionData with roles from DB if needed

    console.log("[PageId] Custom session valid for user_id:", sessionData.user_id)
    return sessionData // Contains user_id, expires_at, token, potentially roles
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

  // 1. Fetch page data
  const { data: page, error: pageError } = await supabase
    .from("pagine")
    .select("*, utente:id_utente ( username )") // Assuming 'username' is what you want
    .eq("id", id)
    .single()

  if (pageError && pageError.code !== "PGRST116") {
    console.error(`[PageId] Errore caricamento pagina ${id}:`, pageError)
    return { page: null, activeSession: null } // Return early if page fetch fails critically
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
      // Ensure 'roles' is part of user_metadata and is an array
      roles: (supabaseSession.user.user_metadata?.roles as string[]) || [],
      source: "supabase",
    }
  } else if (customSession?.user_id) {
    console.log("[PageId] Using custom session for user:", customSession.user_id)
    activeSession = {
      userId: customSession.user_id,
      // Assuming customSession might have roles, or you fetch them based on user_id
      // For now, defaulting to empty array if not directly in customSession.
      // You might need to adjust this if your custom session stores roles differently.
      roles: (customSession.roles as string[]) || [],
      source: "custom",
    }
  } else {
    console.log("[PageId] No active session found (neither Supabase nor custom).")
  }

  // Pass the Supabase session to PageViewer for its own logic, but use activeSession for permissions here
  return { page: page as Page | null, activeSession }
}

export default async function Page({ params }: { params: { id: string } }) {
  // Add this validation at the beginning of the Page component
  const pageId = Number.parseInt(params.id, 10)
  if (isNaN(pageId)) {
    notFound()
    return
  }

  const cookieStore = cookies()
  console.log(`[PageId] Fetching page with ID: ${pageId}`)
  const supabase = createServerClient()
  const { data: page, error: pageError } = await supabase
    .from("pagine")
    .select("*, utente:id_utente ( username )")
    .eq("id", pageId) // Use pageId instead of id
    .single()

  if (pageError) {
    console.error(`[PageId] Database error for page ${pageId}:`, pageError)
  }
  if (!page) {
    console.log(`[PageId] No page found with ID: ${pageId}`)
    notFound() // Page itself not found
    return
  }

  const { activeSession } = await getPageData(params.id, cookieStore)

  // Permission checks
  if (page.privato) {
    console.log(`[PageId] Page ${page.id} is private. Checking permissions.`)
    if (!activeSession || !activeSession.userId) {
      console.log(`[PageId] Page ${page.id} is private and no active session. Denying access.`)
      notFound()
      return
    }

    const isOwner = activeSession.userId === page.id_utente
    // Ensure roles is an array before calling includes
    const isAdmin = Array.isArray(activeSession.roles) && activeSession.roles.includes("admin")

    console.log(
      `[PageId] Page ${page.id} private access check: User ${activeSession.userId}, Owner ${page.id_utente} (isOwner: ${isOwner}), Roles ${activeSession.roles} (isAdmin: ${isAdmin})`,
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

  // Determine which session object to pass to PageViewer.
  // PageViewer expects a Supabase Session object or null.
  // If our active session was from custom, we might not have a full Supabase Session object.
  // For now, we'll try to reconstruct a minimal session-like object if custom session was used,
  // or pass null. This depends on what PageViewer strictly needs.
  // The original code passed the result of supabase.auth.getSession() to PageViewer.
  // Let's try to get the supabase session again just for PageViewer if it wasn't the active one.
  // This is a bit convoluted and suggests PageViewer might need to be more flexible
  // or the session management needs to be more unified.

  let pageViewerSession = null
  if (activeSession?.source === "supabase") {
    const supabase = createServerClient() // Re-create to get fresh session if needed
    const {
      data: { session },
    } = await supabase.auth.getSession()
    pageViewerSession = session
  } else if (activeSession?.source === "custom" && activeSession.userId) {
    // If PageViewer needs a user object, construct a minimal one.
    // This is a placeholder. PageViewer might need more.
    pageViewerSession = {
      user: { id: activeSession.userId, user_metadata: { roles: activeSession.roles } /* other needed fields */ },
      // ... other session properties PageViewer might expect
    } as any // Cast to 'any' or a more specific type if PageViewer's prop type is known
    console.log("[PageId] Passing a constructed session-like object to PageViewer based on custom session.")
  }

  return <PageViewer initialPage={page} session={pageViewerSession} />
}
