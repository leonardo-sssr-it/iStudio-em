"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { NotesFooterWidget } from "@/components/notes-footer-widget"

export function Footer() {
  const { user } = useAuth()

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* iStudio */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">iStudio</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900">
                  Chi siamo
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-gray-900">
                  Funzionalità
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-gray-900">
                  Prezzi
                </Link>
              </li>
            </ul>
          </div>

          {/* Link Rapidi */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Link Rapidi</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/dashboard" className="hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/data-explorer" className="hover:text-gray-900">
                  Data Explorer
                </Link>
              </li>
              <li>
                <Link href="/note" className="hover:text-gray-900">
                  Note
                </Link>
              </li>
              <li>
                <Link href="/pagine" className="hover:text-gray-900">
                  Pagine
                </Link>
              </li>
            </ul>
          </div>

          {/* Supporto */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Supporto</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-gray-900">
                  Centro Assistenza
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-900">
                  Contattaci
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-gray-900">
                  Documentazione
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Note Widget - Solo per utenti autenticati */}
          {user && (
            <div>
              <NotesFooterWidget />
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">© 2024 iStudio. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}
