import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export function createClient() {
  // Controlla che le variabili d'ambiente siano definite
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL o Anon Key non sono definite nelle variabili d'ambiente.")
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
