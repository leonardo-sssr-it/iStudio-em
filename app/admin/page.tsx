"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { memo, useRef, useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"

// Componente card memoizzato per evitare re-render inutili
const AdminCard = memo(
  ({
    href,
    icon: Icon,
    title,
    description,
    isVisible,
  }: {
    href: string
    icon: any
    title: string
    description: string
    isVisible: boolean
  }) => {
    return (
      <Link href={href} prefetch={true}>
        <Card
          className={`h-full hover:border-primary transition-all duration-300 cursor-pointer transform dashboard-card ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-center text-center h-full dashboard-content">
            <Icon className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground flex-grow">{description}</p>
          </CardContent>
        </Card>
      </Link>
    )
  },
)

AdminCard.displayName = "AdminCard"

// Hook personalizzato per Intersection Observer
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Disconnetti l'observer dopo la prima visualizzazione
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return [ref, isVisible] as const
}

// Validatore JSON
const validateJSON = (value: string): { isValid: boolean; error?: string; parsed?: any } => {
  if (!value || value.trim() === "") {
    return { isValid: true, parsed: null }
  }

  try {
    const parsed = JSON.parse(value)
    return { isValid: true, parsed }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "JSON non valido",
    }
  }
}

// Componente principale memoizzato
const AdminDashboardContent = memo(() => {
  const { user, logout } = useAuth()
  const { supabase } = useSupabase()
  const [cardsRef, cardsVisible] = useIntersectionObserver()
  const [card1Visible, setCard1Visible] = useState(false)
  const [card2Visible, setCard2Visible] = useState(false)
  const [card3Visible, setCard3Visible] = useState(false)
  const [activeTab, setActiveTab] = useState("database")

  // Stati per la configurazione
  const [configData, setConfigData] = useState<Record<string, any>>({})
  const [configFields, setConfigFields] = useState<Array<{ name: string; type: string; nullable: boolean }>>([])
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({})
  const [jsonValidation, setJsonValidation] = useState<Record<string, { isValid: boolean; error?: string }>>({})

  // Animazione sequenziale delle card
  useEffect(() => {
    if (cardsVisible) {
      const timer1 = setTimeout(() => setCard1Visible(true), 100)
      const timer2 = setTimeout(() => setCard2Visible(true), 200)
      const timer3 = setTimeout(() => setCard3Visible(true), 300)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [cardsVisible])

  // Carica la struttura e i dati della tabella configurazione
  useEffect(() => {
    if (activeTab === "configurazione" && supabase) {
      loadConfigurationData()
    }
  }, [activeTab, supabase])

  // Funzione semplificata che usa solo la deduzione dai dati esistenti
  const loadConfigurationData = async () => {
    if (!supabase) return

    setIsLoadingConfig(true)
    try {
      console.log("Caricamento configurazione...")

      // Carica i dati attuali dalla tabella configurazione
      const { data: configRow, error: configError } = await supabase
        .from("configurazione")
        .select("*")
        .limit(1)
        .maybeSingle()

      if (configError) {
        console.error("Errore nel caricamento dei dati configurazione:", configError)
        throw configError
      }

      if (!configRow) {
        console.log("Nessuna configurazione trovata, creazione campi di default...")
        // Se non ci sono dati, crea una struttura di base
        const defaultFields = [
          { name: "nome_app", type: "text", nullable: true },
          { name: "versione", type: "text", nullable: true },
          { name: "debug", type: "boolean", nullable: true },
          { name: "priorita", type: "json", nullable: true },
          { name: "feed1", type: "text", nullable: true },
          { name: "tema_default", type: "text", nullable: true },
        ]
        setConfigFields(defaultFields)
        setConfigData({})
      } else {
        console.log("Dati configurazione caricati:", configRow)

        // Deduce i tipi dai dati esistenti
        const fields = Object.keys(configRow)
          .filter((key) => key !== "id" && key !== "modifica") // Escludi campi non editabili
          .map((key) => ({
            name: key,
            type: getFieldType(configRow[key]),
            nullable: true, // Assumiamo che tutti i campi siano nullable per sicurezza
          }))

        console.log("Campi dedotti:", fields)
        setConfigFields(fields)
        setConfigData(configRow)
      }
    } catch (error) {
      console.error("Errore nel caricamento della configurazione:", error)
      toast({
        title: "Errore",
        description: `Impossibile caricare la configurazione: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
        variant: "destructive",
      })

      // Fallback con campi di base
      const fallbackFields = [
        { name: "nome_app", type: "text", nullable: true },
        { name: "versione", type: "text", nullable: true },
        { name: "debug", type: "boolean", nullable: true },
        { name: "priorita", type: "json", nullable: true },
        { name: "feed1", type: "text", nullable: true },
        { name: "tema_default", type: "text", nullable: true },
      ]
      setConfigFields(fallbackFields)
      setConfigData({})
    } finally {
      set
