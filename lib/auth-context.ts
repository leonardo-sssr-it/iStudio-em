import type { User, Session } from "@supabase/supabase-js"

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
}

// This file should only define the context type and the context itself.
// The actual context creation and hook will be in the provider.
// We export this to avoid circular dependencies if other files need the type.
