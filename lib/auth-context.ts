import { createContext } from "react"

// Define AuthUser interface here or import from a shared types file
export interface AuthUser {
  id: string
  email: string
  username: string
  nome?: string
  cognome?: string
  ruolo?: string
  ultimo_accesso?: string
  [key: string]: any
}

// Define AuthContextType interface
export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  login: (usernameOrEmail: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  checkSession: () => Promise<boolean>
  hashPassword: (password: string) => Promise<string>
  verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>
}

// Create and export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)
