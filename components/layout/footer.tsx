"use client"

import Link from "next/link"
import { Github, Twitter, Linkedin, Mail, ExternalLink } from "lucide-react"
import { useAppConfig } from "@/hooks/use-app-config"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { config, isLoading } = useAppConfig()

  // Funzione per determinare se un URL è esterno
  const isExternalUrl = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://")
  }

  // Configurazione dei link legali
  const legalLinks = [
    {
      key: "URLprivacy",
      label: "Privacy Policy",
      url: config?.URLprivacy,
    },
    {
      key: "URLtermini",
      label: "Termini di Servizio",
      url: config?.URLtermini,
    },
    {
      key: "URLcookies",
      label: "Informativa Cookie",
      url: config?.URLcookies,
    },
    {
      key: "URLlicenza",
      label: "Licenza",
      url: config?.URLlicenza,
    },
  ].filter((link) => link.url && link.url.trim() !== "") // Mostra solo i link configurati

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">iStudio</h3>
              <p className="text-sm text-muted-foreground">Sistema di gestione integrato per la tua azienda.</p>
              {/* Versione dal database */}
              <div className="text-xs text-muted-foreground">
                {isLoading ? (
                  <span className="animate-pulse">Caricamento versione...</span>
                ) : (
                  <span>Versione {config?.versione || "N/A"}</span>
                )}
              </div>
            </div>
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
                <li>
                  <Link href="/pagine" className="text-muted-foreground hover:text-primary transition-colors">
                    Pagine
                  </Link>
                </li>
              </ul>
            </div>
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
          <div className="mt-8 pt-8 border-t">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                <p className="text-sm text-muted-foreground">
                  © {currentYear} iStudio{" "}
                  {isLoading ? (
                    <span className="animate-pulse">Caricamento versione...</span>
                  ) : (
                    <span>Versione {config?.versione || "N/A"}</span>
                  )}
                  . Tutti i diritti riservati.
                </p>
                {/* Link al sito Leonardo */}
                <Link
                  href="https://leonardo.sssr.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Sviluppato da Leonardo SSSR
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Link legali dinamici */}
              {legalLinks.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-1 text-sm">
                  {legalLinks.map((link, index) => {
                    const isExternal = isExternalUrl(link.url!)
                    return (
                      <Link
                        key={link.key}
                        href={link.url!}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {link.label}
                        {isExternal && <ExternalLink className="h-3 w-3" />}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
