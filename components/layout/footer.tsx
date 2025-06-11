"use client"

import Link from "next/link"
import { Github, Twitter, Linkedin, Mail, ExternalLink, Info, AlertCircle } from "lucide-react"
import { useAppVersion } from "@/hooks/use-app-config"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { version, isLoading, error } = useAppVersion()

  const getVersionDisplay = () => {
    if (isLoading) {
      return (
        <div className="text-xs flex items-center gap-1 text-muted-foreground">
          <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
          <span>Caricamento...</span>
        </div>
      )
    }

    const icon = error ? <AlertCircle className="h-3 w-3 text-yellow-500" /> : <Info className="h-3 w-3" />

    return (
      <div className="text-xs flex items-center gap-1 text-muted-foreground">
        {icon}
        <span>Versione {version}</span>
      </div>
    )
  }

  const getTooltipContent = () => {
    if (isLoading) return "Caricamento versione in corso..."

    if (error) {
      return (
        <div className="text-sm">
          <div className="font-medium text-yellow-400">Attenzione</div>
          <div>{error}</div>
          <div className="mt-1 text-xs opacity-75">Usando versione di default: {version}</div>
        </div>
      )
    }

    return (
      <div className="text-sm">
        <div className="font-medium">Versione applicazione</div>
        <div>Caricata dal database</div>
        <div className="mt-1 text-xs opacity-75">Tabella: configurazione.versione</div>
      </div>
    )
  }

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">iStudio</h3>
              <p className="text-sm text-muted-foreground">Sistema di gestione integrato per la tua azienda.</p>
              {/* Versione dal database con tooltip per debug */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">{getVersionDisplay()}</div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    {getTooltipContent()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                <p className="text-sm text-muted-foreground">© {currentYear} iStudio. Tutti i diritti riservati.</p>
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
