"use client"

import type React from "react"

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
      setIsLoadingConfig(false)
    }
  }

  // Funzione helper migliorata per determinare il tipo di campo
  const getFieldType = (value: any): string => {
    console.log(`Determinazione tipo per valore:`, value, `(tipo: ${typeof value})`)

    if (value === null || value === undefined) {
      return "text" // Default per valori null
    }

    if (typeof value === "boolean") {
      return "boolean"
    }

    if (typeof value === "number") {
      return Number.isInteger(value) ? "integer" : "numeric"
    }

    if (typeof value === "object") {
      return "json"
    }

    if (typeof value === "string") {
      // Controlla se è una data ISO
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return "timestamp with time zone"
      }
      // Controlla se è una data semplice
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return "date"
      }
      // Controlla se sembra JSON
      if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
        try {
          JSON.parse(value)
          return "json"
        } catch {
          // Non è JSON valido, tratta come testo
        }
      }
    }

    return "text"
  }

  const handleConfigChange = (fieldName: string, value: any) => {
    setConfigData((prev) => ({ ...prev, [fieldName]: value }))

    // Rimuovi errori per questo campo
    if (configErrors[fieldName]) {
      setConfigErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }

    // Validazione JSON in tempo reale
    const field = configFields.find((f) => f.name === fieldName)
    if (field && (field.type === "json" || field.type === "jsonb")) {
      const validation = validateJSON(value)
      setJsonValidation((prev) => ({
        ...prev,
        [fieldName]: validation,
      }))
    }
  }

  const validateConfigField = (field: { name: string; type: string; nullable: boolean }, value: any): string | null => {
    if (!field.nullable && (value === null || value === undefined || value === "")) {
      return "Campo obbligatorio"
    }

    if (value === null || value === undefined || value === "") {
      return null // Campo opzionale vuoto
    }

    switch (field.type) {
      case "integer":
      case "bigint":
        if (isNaN(Number(value))) {
          return "Deve essere un numero intero"
        }
        break
      case "numeric":
      case "real":
      case "double precision":
        if (isNaN(Number(value))) {
          return "Deve essere un numero"
        }
        break
      case "boolean":
        // I boolean sono gestiti da checkbox, sempre validi
        break
      case "date":
        if (value && isNaN(Date.parse(value))) {
          return "Data non valida"
        }
        break
      case "timestamp with time zone":
      case "timestamp without time zone":
        if (value && isNaN(Date.parse(value))) {
          return "Data e ora non valide"
        }
        break
      case "json":
      case "jsonb":
        const validation = jsonValidation[field.name]
        if (validation && !validation.isValid) {
          return validation.error || "JSON non valido"
        }
        break
    }

    return null
  }

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    // Validazione
    const errors: Record<string, string> = {}
    configFields.forEach((field) => {
      const error = validateConfigField(field, configData[field.name])
      if (error) {
        errors[field.name] = error
      }
    })

    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors)
      toast({
        title: "Errori di validazione",
        description: "Correggi gli errori evidenziati prima di salvare",
        variant: "destructive",
      })
      return
    }

    setIsSavingConfig(true)
    try {
      // Prepara i dati per il salvataggio
      const saveData: Record<string, any> = {}
      configFields.forEach((field) => {
        let value = configData[field.name]

        // Converti i tipi appropriati
        if (field.type === "integer" || field.type === "bigint") {
          value = value ? Number.parseInt(value) : null
        } else if (field.type === "numeric" || field.type === "real" || field.type === "double precision") {
          value = value ? Number.parseFloat(value) : null
        } else if (field.type === "boolean") {
          value = Boolean(value)
        } else if (field.type === "json" || field.type === "jsonb") {
          if (typeof value === "string" && value.trim()) {
            const validation = validateJSON(value)
            if (validation.isValid) {
              value = validation.parsed
            }
          }
        }

        saveData[field.name] = value
      })

      // Aggiungi automaticamente il campo modifica
      saveData.modifica = new Date().toISOString()

      console.log("Dati da salvare:", saveData)

      // Verifica se esiste già una riga
      const { data: existingRow } = await supabase.from("configurazione").select("id").limit(1).maybeSingle()

      let result
      if (existingRow) {
        console.log("Aggiornamento riga esistente con ID:", existingRow.id)
        // Aggiorna la riga esistente
        result = await supabase.from("configurazione").update(saveData).eq("id", existingRow.id)
      } else {
        console.log("Inserimento nuova riga")
        // Inserisci una nuova riga
        result = await supabase.from("configurazione").insert(saveData)
      }

      if (result.error) {
        console.error("Errore nel salvataggio:", result.error)
        throw result.error
      }

      console.log("Salvataggio completato con successo")

      // Ricarica i dati
      await loadConfigurationData()

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

  const renderConfigField = (field: { name: string; type: string; nullable: boolean }) => {
    const value = configData[field.name] || ""
    const error = configErrors[field.name]
    const jsonError = jsonValidation[field.name]

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleConfigChange(field.name, checked)}
              className="checkbox-outline"
            />
            <Label htmlFor={field.name} className="text-sm font-medium text-foreground">
              {field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Label>
          </div>
        )

      case "integer":
      case "bigint":
        return (
          <Input
            type="number"
            step="1"
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={`Inserisci ${field.name}`}
            className={error ? "border-red-500" : ""}
          />
        )

      case "numeric":
      case "real":
      case "double precision":
        return (
          <Input
            type="number"
            step="any"
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={`Inserisci ${field.name}`}
            className={error ? "border-red-500" : ""}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            id={field.name}
            name={field.name}
            value={value ? new Date(value).toISOString().split("T")[0] : ""}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        )

      case "timestamp with time zone":
      case "timestamp without time zone":
        return (
          <Input
            type="datetime-local"
            id={field.name}
            name={field.name}
            value={value ? new Date(value).toISOString().slice(0, 16) : ""}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        )

      case "json":
      case "jsonb":
        return (
          <div className="space-y-2">
            <Textarea
              id={field.name}
              name={field.name}
              value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              placeholder={`Inserisci JSON per ${field.name}`}
              className={`min-h-[120px] font-mono text-sm ${
                error || (jsonError && !jsonError.isValid) ? "border-red-500" : ""
              }`}
            />
            {jsonError && !jsonError.isValid && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{jsonError.error}</span>
              </div>
            )}
            {jsonError && jsonError.isValid && <div className="text-sm text-green-600">✓ JSON valido</div>}
          </div>
        )

      case "text":
      case "character varying":
      default:
        if (field.name.toLowerCase().includes("descrizione") || field.name.toLowerCase().includes("note")) {
          return (
            <Textarea
              id={field.name}
              name={field.name}
              value={value}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              placeholder={`Inserisci ${field.name}`}
              className={`min-h-[80px] ${error ? "border-red-500" : ""}`}
            />
          )
        }
        return (
          <Input
            type="text"
            id={field.name}
            name={field.name}
            value={value}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={`Inserisci ${field.name}`}
            className={error ? "border-red-500" : ""}
          />
        )
    }
  }

  const adminCards = [
    {
      href: "/table-explorer",
      icon: Database,
      title: "Esploratore Tabelle",
      description: "Esplora tabelle, colonne e dati. Crea backup del database.",
      isVisible: card1Visible,
    },
    {
      href: "/user-filter",
      icon: Filter,
      title: "Filtro Dati Utente",
      description: "Filtra i dati delle tabelle in base all'utente selezionato.",
      isVisible: card2Visible,
    },
    {
      href: "/show-list",
      icon: List,
      title: "Visualizza Liste",
      description: "Visualizza liste di dati con campi predefiniti per ogni tabella.",
      isVisible: card3Visible,
    },
  ]

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header con responsive spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">Dashboard Amministratore</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Link href="/dashboard" prefetch={true}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center gap-2">
              <User className="h-4 w-4" />
              Dashboard utente
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Card di benvenuto */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Benvenuto, {user?.nome || user?.username}!</CardTitle>
          <CardDescription>
            Accesso effettuato come amministratore. Hai accesso completo a tutte le funzionalità del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs per Database e Configurazione */}
          <div className="w-full">
            <div className="flex space-x-1 mb-6 border-b">
              <button
                onClick={() => setActiveTab("database")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "database"
                    ? "bg-primary text-primary-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Database className="h-4 w-4 inline mr-2" />
                Database
              </button>
              <button
                onClick={() => setActiveTab("configurazione")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "configurazione"
                    ? "bg-primary text-primary-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Configurazione
              </button>
            </div>

            {/* Contenuto del tab Database */}
            {activeTab === "database" && (
              <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {adminCards.map((card, index) => (
                  <AdminCard
                    key={card.href}
                    href={card.href}
                    icon={card.icon}
                    title={card.title}
                    description={card.description}
                    isVisible={card.isVisible}
                  />
                ))}
              </div>
            )}

            {/* Contenuto del tab Configurazione */}
            {activeTab === "configurazione" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Configurazione Sistema</h3>
                  <Button onClick={loadConfigurationData} variant="outline" size="sm" disabled={isLoadingConfig}>
                    {isLoadingConfig ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Ricarica
                  </Button>
                </div>

                {isLoadingConfig ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <form onSubmit={handleConfigSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {configFields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          {field.type !== "boolean" && (
                            <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                              {field.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {!field.nullable && <span className="text-red-500">*</span>}
                              <span className="text-xs text-muted-foreground">({field.type})</span>
                            </Label>
                          )}
                          {renderConfigField(field)}
                          {configErrors[field.name] && (
                            <p className="text-sm text-red-500 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {configErrors[field.name]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                      <Button type="submit" disabled={isSavingConfig} className="flex items-center gap-2 min-w-[150px]">
                        {isSavingConfig ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salva Configurazione
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

AdminDashboardContent.displayName = "AdminDashboardContent"

// Componente principale esportato
export default function AdminDashboardPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
