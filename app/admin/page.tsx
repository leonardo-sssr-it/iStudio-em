"use client"

import { useAuth } from "@/lib/auth-provider"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { User, Database, List, Filter, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { memo, useRef, useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { JsonEditor } from "@/components/ui/json-editor"

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
          className={`h-full hover:border-primary transition-all duration-300 cursor-pointer transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-center text-center h-full">
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

// Componente principale memoizzato
const AdminDashboardContent = memo(() => {
  const { user } = useAuth()
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

  // Funzione per caricare i dati di configurazione dalla tabella "configurazione"
  const loadConfigurationData = async () => {
    if (!supabase) return

    setIsLoadingConfig(true)
    try {
      console.log("Caricamento configurazione dalla tabella 'configurazione'...")

      // Carica i dati attuali dalla tabella configurazione
      const { data: configRow, error: configError } = await supabase
        .from("configurazione")
        .select("*")
        .limit(1)
        .maybeSingle()

      if (configError && configError.code !== "PGRST116") {
        console.error("Errore nel caricamento dei dati configurazione:", configError)
        throw configError
      }

      if (!configRow) {
        console.log("Nessuna configurazione trovata, creazione campi di default...")
        // Se non ci sono dati, crea una struttura di base
        const defaultFields = [
          { name: "versione", type: "text", nullable: true },
          { name: "nome_app", type: "text", nullable: true },
          { name: "tema_default", type: "text", nullable: true },
          { name: "lingua_default", type: "text", nullable: true },
          { name: "fuso_orario", type: "text", nullable: true },
          { name: "debug", type: "boolean", nullable: true },
          { name: "priorita", type: "json", nullable: true },
          { name: "stati", type: "json", nullable: true },
          { name: "categorie", type: "json", nullable: true },
          { name: "tags_predefiniti", type: "json", nullable: true },
          { name: "impostazioni_notifiche", type: "json", nullable: true },
        ]
        setConfigFields(defaultFields)
        setConfigData({
          versione: "1.0.0",
          nome_app: "iStudio",
          tema_default: "light",
          lingua_default: "it",
          fuso_orario: "Europe/Rome",
          debug: false,
        })
      } else {
        console.log("Dati configurazione caricati:", configRow)

        // Deduce i tipi dai dati esistenti
        const fields = Object.keys(configRow)
          .filter((key) => key !== "id" && key !== "created_at" && key !== "updated_at") // Escludi campi non editabili
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
        { name: "versione", type: "text", nullable: true },
        { name: "nome_app", type: "text", nullable: true },
        { name: "tema_default", type: "text", nullable: true },
        { name: "lingua_default", type: "text", nullable: true },
        { name: "fuso_orario", type: "text", nullable: true },
        { name: "debug", type: "boolean", nullable: true },
        { name: "priorita", type: "json", nullable: true },
        { name: "stati", type: "json", nullable: true },
      ]
      setConfigFields(fallbackFields)
      setConfigData({
        versione: "1.0.0",
        nome_app: "iStudio",
        tema_default: "light",
        lingua_default: "it",
        fuso_orario: "Europe/Rome",
        debug: false,
      })
    } finally {
      setIsLoadingConfig(false)
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

    setConfigData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  // Salva la configurazione nella tabella "configurazione"
  const saveConfiguration = async () => {
    if (!supabase) return

    setIsSavingConfig(true)
    try {
      console.log("Salvataggio configurazione nella tabella 'configurazione':", configData)

      // I dati sono già nel formato corretto grazie al JsonEditor
      const dataToSave = { ...configData }

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

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked, field.type)}
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
          <JsonEditor
            key={field.name}
            label={field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            value={configData[field.name]}
            onChange={(value) => handleFieldChange(field.name, value, field.type)}
            placeholder={`Inserisci JSON valido per ${field.name}`}
            rows={8}
          />
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">Benvenuto, {user?.nome || user?.username}. Gestisci il sistema.</p>
        </div>
      </div>

      {/* Tabs per navigazione */}
      <div className="flex flex-wrap gap-2 border-b">
        <Button variant={activeTab === "database" ? "default" : "ghost"} onClick={() => setActiveTab("database")}>
          <Database className="h-4 w-4 mr-2" />
          Database
        </Button>
        <Button
          variant={activeTab === "configurazione" ? "default" : "ghost"}
          onClick={() => setActiveTab("configurazione")}
        >
          <User className="h-4 w-4 mr-2" />
          Configurazione
        </Button>
      </div>

      {/* Contenuto Database */}
      {activeTab === "database" && (
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            href="/table-explorer"
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
        <Card>
          <CardHeader>
            <CardTitle>Configurazione Sistema</CardTitle>
            <CardDescription>Modifica le impostazioni globali dell'applicazione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <Button onClick={saveConfiguration} disabled={isSavingConfig}>
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
