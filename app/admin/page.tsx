"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Save, RefreshCw, Database, Users, Shield, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { JsonEditor } from "@/components/ui/json-editor"

interface AppConfig {
  id?: string
  priorita?: Array<{ value: string; label: string; color?: string }>
  stati?: Array<{ value: string; label: string; color?: string }>
  categorie?: Array<{ value: string; label: string }>
  tags_predefiniti?: string[]
  impostazioni_notifiche?: {
    email_enabled?: boolean
    push_enabled?: boolean
    default_reminder_minutes?: number
  }
  tema_default?: string
  lingua_default?: string
  fuso_orario?: string
  [key: string]: any
}

export default function AdminPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<AppConfig>({})
  const [originalConfig, setOriginalConfig] = useState<AppConfig>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Carica la configurazione
  useEffect(() => {
    async function loadConfig() {
      if (!supabase || !user?.id) return

      setLoading(true)
      try {
        const { data, error } = await supabase.from("app_config").select("*").single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        const configData = data || {}
        setConfig(configData)
        setOriginalConfig(configData)
      } catch (err: any) {
        console.error("Errore nel caricamento della configurazione:", err)
        toast({
          title: "Errore",
          description: `Impossibile caricare la configurazione: ${err.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [supabase, user?.id])

  // Controlla se ci sono modifiche
  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig))
  }, [config, originalConfig])

  // Salva la configurazione
  const handleSave = async () => {
    if (!supabase || !user?.id) return

    setSaving(true)
    try {
      const { error } = await supabase.from("app_config").upsert(config)

      if (error) throw error

      setOriginalConfig(config)
      toast({
        title: "Successo",
        description: "Configurazione salvata con successo",
      })
    } catch (err: any) {
      console.error("Errore nel salvataggio:", err)
      toast({
        title: "Errore",
        description: `Impossibile salvare la configurazione: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset delle modifiche
  const handleReset = () => {
    setConfig(originalConfig)
    toast({
      title: "Reset completato",
      description: "Modifiche annullate",
    })
  }

  // Aggiorna un campo della configurazione
  const updateConfig = (field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Amministrazione
          </h1>
          <p className="text-gray-600 mt-1">Gestisci la configurazione dell'applicazione</p>
        </div>

        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}

          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      {/* Indicatore modifiche */}
      {hasChanges && (
        <div className="mb-4">
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            Modifiche non salvate
          </Badge>
        </div>
      )}

      {/* Configurazione */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Generale
          </TabsTrigger>
          <TabsTrigger value="priorities">
            <Shield className="h-4 w-4 mr-2" />
            Priorità
          </TabsTrigger>
          <TabsTrigger value="states">
            <Database className="h-4 w-4 mr-2" />
            Stati
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Users className="h-4 w-4 mr-2" />
            Avanzate
          </TabsTrigger>
        </TabsList>

        {/* Tab Generale */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Impostazioni Generali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tema_default">Tema Predefinito</Label>
                  <Input
                    id="tema_default"
                    value={config.tema_default || ""}
                    onChange={(e) => updateConfig("tema_default", e.target.value)}
                    placeholder="light, dark, auto"
                  />
                </div>

                <div>
                  <Label htmlFor="lingua_default">Lingua Predefinita</Label>
                  <Input
                    id="lingua_default"
                    value={config.lingua_default || ""}
                    onChange={(e) => updateConfig("lingua_default", e.target.value)}
                    placeholder="it, en, es"
                  />
                </div>

                <div>
                  <Label htmlFor="fuso_orario">Fuso Orario</Label>
                  <Input
                    id="fuso_orario"
                    value={config.fuso_orario || ""}
                    onChange={(e) => updateConfig("fuso_orario", e.target.value)}
                    placeholder="Europe/Rome"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Priorità */}
        <TabsContent value="priorities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurazione Priorità
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JsonEditor
                label="Priorità"
                value={config.priorita}
                onChange={(value) => updateConfig("priorita", value)}
                placeholder={`[
  {"value": "alta", "label": "Alta", "color": "red"},
  {"value": "media", "label": "Media", "color": "yellow"},
  {"value": "bassa", "label": "Bassa", "color": "green"}
]`}
                rows={8}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Stati */}
        <TabsContent value="states" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configurazione Stati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JsonEditor
                label="Stati"
                value={config.stati}
                onChange={(value) => updateConfig("stati", value)}
                placeholder={`[
  {"value": "nuovo", "label": "Nuovo", "color": "blue"},
  {"value": "in_corso", "label": "In Corso", "color": "yellow"},
  {"value": "completato", "label": "Completato", "color": "green"}
]`}
                rows={8}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Avanzate */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Configurazioni Avanzate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <JsonEditor
                  label="Categorie"
                  value={config.categorie}
                  onChange={(value) => updateConfig("categorie", value)}
                  placeholder={`[
  {"value": "lavoro", "label": "Lavoro"},
  {"value": "personale", "label": "Personale"}
]`}
                  rows={6}
                />
              </div>

              <div>
                <JsonEditor
                  label="Tags Predefiniti"
                  value={config.tags_predefiniti}
                  onChange={(value) => updateConfig("tags_predefiniti", value)}
                  placeholder={`["importante", "urgente", "meeting", "progetto"]`}
                  rows={4}
                />
              </div>

              <div>
                <JsonEditor
                  label="Impostazioni Notifiche"
                  value={config.impostazioni_notifiche}
                  onChange={(value) => updateConfig("impostazioni_notifiche", value)}
                  placeholder={`{
  "email_enabled": true,
  "push_enabled": false,
  "default_reminder_minutes": 15
}`}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer con informazioni */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tutte le modifiche vengono validate automaticamente prima del salvataggio</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
