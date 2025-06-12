import { createContext } from "react"

export interface AuthUser {
  id: string
  username: string
  email?: string
  nome?: string
  cognome?: string
  ruolo: string
  ultimo_accesso?: string
  password: string
  created_at?: string
  updated_at?: string
}

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

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
