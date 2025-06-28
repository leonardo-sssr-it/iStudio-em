import Link from "next/link"
import NotesFooterWidget from "@/components/notes-footer-widget"

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* iStudio */}
          <div>
            <h3 className="font-semibold text-lg mb-4">iStudio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Piattaforma completa per la gestione dei dati e la produttività.
            </p>
            <p className="text-xs text-muted-foreground">© 2024 iStudio. Tutti i diritti riservati.</p>
          </div>

          {/* Link Rapidi */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Link Rapidi</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/data-explorer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Data Explorer
                </Link>
              </li>
              <li>
                <Link href="/note" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Note
                </Link>
              </li>
              <li>
                <Link href="/pagine" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pagine
                </Link>
              </li>
            </ul>
          </div>

          {/* Supporto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Supporto</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Centro Assistenza
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentazione
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contattaci
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Note Widget */}
          <div>
            <NotesFooterWidget />
          </div>
        </div>
      </div>
    </footer>
  )
}
