import { NotesFooterWidget } from "@/components/notes-footer-widget"

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* iStudio */}
          <div className="space-y-3">
            <h4 className="font-semibold">iStudio</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/about" className="hover:text-primary transition-colors">
                  Chi siamo
                </a>
              </li>
              <li>
                <a href="/features" className="hover:text-primary transition-colors">
                  Funzionalità
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-primary transition-colors">
                  Prezzi
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Link Rapidi */}
          <div className="space-y-3">
            <h4 className="font-semibold">Link Rapidi</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/data-explorer" className="hover:text-primary transition-colors">
                  Data Explorer
                </a>
              </li>
              <li>
                <a href="/note" className="hover:text-primary transition-colors">
                  Note
                </a>
              </li>
              <li>
                <a href="/profile" className="hover:text-primary transition-colors">
                  Profilo
                </a>
              </li>
            </ul>
          </div>

          {/* Supporto */}
          <div className="space-y-3">
            <h4 className="font-semibold">Supporto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/help" className="hover:text-primary transition-colors">
                  Centro Assistenza
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-primary transition-colors">
                  Contattaci
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-primary transition-colors">
                  Termini di Servizio
                </a>
              </li>
            </ul>
          </div>

          {/* Widget Note */}
          <div>
            <NotesFooterWidget />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 iStudio. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}
