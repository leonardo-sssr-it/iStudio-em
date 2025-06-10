"use client"

import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { User, Database, List, Filter, LogOut, Loader2, Save, AlertCircle } from "lucide-react"
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
      \
      set IsLoadingConfig(false)
    }
  }

  // Funzione per dedurre il tipo di un campo dal valore
  const getFieldType = (value: any): string => {
    if (value === null || value === undefined) return "text"
    if (typeof value === "boolean") return "boolean"
    if (typeof value === "number") return "number"
    if (typeof value === "object") return "json"
    return "text"
  }

  // Gestisce il cambiamento di un campo
  const handleFieldChange = (fieldName: string, value: any, fieldType: string) => {
    console.log(`Cambiamento campo ${fieldName}:`, value, `(tipo: ${fieldType})`)

    // Validazione JSON
    if (fieldType === "json") {
      const validation = validateJSON(value)
      setJsonValidation((prev) => ({
        ...prev,
        [fieldName]: validation,
      }))

      if (!validation.isValid) {
        setConfigErrors((prev) => ({
          ...prev,
          [fieldName]: validation.error || "JSON non valido",
        }))
      } else {
        setConfigErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldName]
          return newErrors
        })
      }
    }

    setConfigData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  // Salva la configurazione
  const saveConfiguration = async () => {
    if (!supabase) return

    // Verifica errori di validazione
    if (Object.keys(configErrors).length > 0) {
      toast({
        title: "Errore di validazione",
        description: "Correggi gli errori nei campi prima di salvare",
        variant: "destructive",
      })
      return
    }

    setIsSavingConfig(true)
    try {
      console.log("Salvataggio configurazione:", configData)

      // Prepara i dati per il salvataggio
      const dataToSave = { ...configData }

      // Converte i campi JSON da stringa a oggetto
      configFields.forEach((field) => {
        if (field.type === "json" && typeof dataToSave[field.name] === "string") {
          const validation = jsonValidation[field.name]
          if (validation?.isValid && validation.parsed !== undefined) {
            dataToSave[field.name] = validation.parsed
          }
        }
      })

      // Verifica se esiste già una configurazione
      const { data: existingConfig } = await supabase.from("configurazione").select("id").limit(1).maybeSingle()

      let result
      if (existingConfig) {
        // Aggiorna la configurazione esistente
        result = await supabase.from("configurazione").update(dataToSave).eq("id", existingConfig.id).select()
      } else {
        // Inserisci una nuova configurazione
        result = await supabase.from("configurazione").insert([dataToSave]).select()
      }

      if (result.error) {
        throw result.error
      }

      console.log("Configurazione salvata con successo:", result.data)
      toast({
        title: "Successo",
        description: "Configurazione salvata con successo",
      })
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione:", error)
      toast({
        title: "Errore",
        description: `Impossibile salvare la configurazione: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
        variant: "destructive",
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  // Renderizza un campo di input basato sul tipo
  const renderField = (field: { name: string; type: string; nullable: boolean }) => {
    const value = configData[field.name] || ""
    const hasError = configErrors[field.name]

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked, field.type)}
              className="admin-checkbox"
            />
            <Label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Label>
          </div>
        )

      case "json":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Label>
            <Textarea
              id={field.name}
              value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
              placeholder={`Inserisci JSON valido per ${field.name}`}
              className={`min-h-[100px] font-mono text-sm ${hasError ? "border-destructive" : ""}`}
            />
            {hasError && (
              <div className="flex items-center text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                {hasError}
              </div>
            )}
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, Number(e.target.value), field.type)}
              placeholder={`Inserisci ${field.name}`}
            />
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
              placeholder={`Inserisci ${field.name}`}
            />
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6 content-inherit">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">Benvenuto, {user?.nome || user?.username}. Gestisci il sistema.</p>
        </div>
        <Button variant="outline" onClick={() => logout()} className="flex items-center gap-2 w-full sm:w-auto">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Tabs per navigazione */}
      <div className="flex flex-wrap gap-2 border-b">
        <Button
          variant={activeTab === "database" ? "default" : "ghost"}
          onClick={() => setActiveTab("database")}
          className={activeTab === "database" ? "admin-tab-active" : ""}
        >
          <Database className="h-4 w-4 mr-2" />
          Database
        </Button>
        <Button
          variant={activeTab === "configurazione" ? "default" : "ghost"}
          onClick={() => setActiveTab("configurazione")}
          className={activeTab === "configurazione" ? "admin-tab-active" : ""}
        >
          <User className="h-4 w-4 mr-2" />
          Configurazione
        </Button>
      </div>

      {/* Contenuto Database */}
      {activeTab === "database" && (
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            href="/data-explorer"
            icon={Database}
            title="Esplora Database"
            description="Visualizza e gestisci tutte le tabelle del database"
            isVisible={card1Visible}
          />
          <AdminCard
            href="/show-list"
            icon={List}
            title="Lista Tabelle"
            description="Visualizza l'elenco completo delle tabelle disponibili"
            isVisible={card2Visible}
          />
          <AdminCard
            href="/user-filter"
            icon={Filter}
            title="Filtro Utenti"
            description="Filtra e gestisci gli utenti del sistema"
            isVisible={card3Visible}
          />
        </div>
      )}

      {/* Contenuto Configurazione */}
      {activeTab === "configurazione" && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Configurazione Sistema</CardTitle>
            <CardDescription>Modifica le impostazioni globali dell'applicazione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 dashboard-content">
            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Caricamento configurazione...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {configFields.map((field) => (
                    <div key={field.name}>{renderField(field)}</div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveConfiguration} disabled={isSavingConfig || Object.keys(configErrors).length > 0}>
                    {isSavingConfig ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salva Configurazione
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
})

AdminDashboardContent.displayName = "AdminDashboardContent"

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
