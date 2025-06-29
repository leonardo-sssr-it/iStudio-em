"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { NotesFooterWidget } from "@/components/notes-footer-widget"

export function Footer() {
  const { user } = useAuth()

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* iStudio */}
          <div className="space-y-3">
            <h4 className="font-semibold">iStudio</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Chi siamo
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-primary transition-colors">
                  Funzionalità
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Prezzi
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Link Rapidi */}
          <div className="space-y-3">
            <h4 className="font-semibold">Link Rapidi</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/data-explorer" className="hover:text-primary transition-colors">
                  Data Explorer
                </Link>
              </li>
              <li>
                <Link href="/note" className="hover:text-primary transition-colors">
                  Note
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Profilo
                </Link>
              </li>
            </ul>
          </div>

          {/* Supporto */}
          <div className="space-y-3">
            <h4 className="font-semibold">Supporto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">
                  Centro Assistenza
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contattaci
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Termini di Servizio
                </Link>
              </li>
            </ul>
          </div>

          {/* Widget Note - Solo per utenti autenticati */}
          {user && (
            <div>
              <NotesFooterWidget />
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 iStudio. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}
