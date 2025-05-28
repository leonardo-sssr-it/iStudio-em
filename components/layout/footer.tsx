"use client"

import Link from "next/link"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"
import { useCustomTheme } from "@/contexts/theme-context"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { layout } = useCustomTheme()

  // Determiniamo la classe del container in base al layout
  const containerClass =
    layout === "fullWidth"
      ? "w-full px-4"
      : layout === "sidebar"
        ? "container mx-auto px-4 lg:pl-72"
        : "container mx-auto px-4"

  return (
    <footer className="w-full border-t bg-background">
      <div className={containerClass}>
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">iStudio</h3>
              <p className="text-sm text-muted-foreground">Sistema di gestione integrato per la tua azienda.</p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="font-semibold">Link Rapidi</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                    Profilo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h4 className="font-semibold">Supporto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Documentazione
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Contatti
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="font-semibold">Seguici</h4>
              <div className="flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <p className="text-sm text-muted-foreground">© {currentYear} iStudio. Tutti i diritti riservati.</p>
              <div className="flex space-x-4 text-sm">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Termini di Servizio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
