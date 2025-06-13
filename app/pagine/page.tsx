"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Search, Plus, RefreshCw, FileText, Calendar, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import type { Pagina } from "@/lib/services/pagine-service"

export default function PaginePage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [pagine, setPagine] = useState<Pagina[]>([])
  const [categorie, setCategorie] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Carica le pagine
  const loadPagine = async () => {
    if (!supabase || !user?.id) return

    setLoading(true)
    setError(null)

    try {
      // Costruisci la query
      let query = supabase.from("pagine").select("*").eq("id_utente", user.id).order("pubblicato", { ascending: false })

      // Applica filtri
      if (categoriaFilter) {
        query = query.eq("categoria", categoriaFilter)
      }

      if (searchTerm) {
        query = query.ilike("titolo", `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setPagine(data || [])
    } catch (err: any) {
      console.error("Errore nel caricamento delle pagine:", err)
      setError(err.message)
      toast({
        title: "Errore",
        description: `Impossibile caricare le pagine: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carica le categorie
  const loadCategorie = async () => {
    if (!supabase || !user?.id) return

    try {
      const { data, error } = await supabase
        .from("pagine")
        .select("categoria")
        .eq("id_utente", user.id)
        .not("categoria", "is", null)

      if (error) throw error

      // Estrai categorie uniche
      const uniqueCategorie = [...new Set(data.map((item) => item.categoria))].filter(Boolean) as string[]
      setCategorie(uniqueCategorie)
    } catch (err) {
      console.error("Errore nel caricamento delle categorie:", err)
    }
  }

  // Carica dati all'inizializzazione
  useEffect(() => {
    if (supabase && user?.id) {
      loadPagine()
      loadCategorie()
    }
  }, [supabase, user?.id])

  // Ricarica quando cambiano i filtri
  useEffect(() => {
    if (supabase && user?.id) {
      loadPagine()
    }
  }, [searchTerm, categoriaFilter])

  // Formatta la data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  // Gestisce il click sulla riga
  const handleRowClick = (id: number) => {
    router.push(`/pagine/${id}`)
  }

  // Renderizza lo stato attivo
  const renderActiveStatus = (attivo: boolean) => {
    return attivo ? (
      <span className="flex items-center text-green-600">
        <CheckCircle className="h-4 w-4 mr-1" />
      </span>
    ) : (
      <span className="flex items-center text-red-600">
        <XCircle className="h-4 w-4 mr-1" />
      </span>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Gestione Pagine
              </CardTitle>
              <CardDescription>Visualizza e gestisci le tue pagine</CardDescription>
            </div>
            <Button onClick={() => router.push("/pagine/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Pagina
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtri */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per titolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full sm:w-64">
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categorie.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={loadPagine} className="shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Stato di errore */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <p className="font-medium">Si è verificato un errore</p>
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={loadPagine} className="mt-2">
                Riprova
              </Button>
            </div>
          )}

          {/* Stato di caricamento */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-1/2 mt-2" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lista pagine */}
          {!loading && pagine.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Nessuna pagina trovata</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm || categoriaFilter
                  ? "Nessuna pagina corrisponde ai filtri selezionati"
                  : "Inizia creando la tua prima pagina"}
              </p>
              <Button onClick={() => router.push("/pagine/new")} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crea pagina
              </Button>
            </div>
          )}

          {!loading && pagine.length > 0 && (
            <div className="space-y-4">
              {pagine.map((pagina) => (
                <div
                  key={pagina.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(pagina.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {renderActiveStatus(pagina.attivo)}
                      <h3 className="font-medium ml-2">{pagina.titolo}</h3>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(pagina.pubblicato)}
                    </div>
                  </div>

                  {pagina.estratto && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{pagina.estratto}</p>}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {pagina.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {pagina.categoria}
                      </Badge>
                    )}

                    {pagina.privato && (
                      <Badge variant="secondary" className="text-xs">
                        Privato
                      </Badge>
                    )}

                    {!pagina.attivo && (
                      <Badge variant="destructive" className="text-xs">
                        Non attivo
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginazione o conteggio */}
          {!loading && pagine.length > 0 && (
            <div className="mt-6 text-sm text-gray-500 flex justify-between items-center">
              <span>
                Visualizzazione di {pagine.length} pagine
                {(searchTerm || categoriaFilter) && " (filtrate)"}
              </span>

              <Link href="/pagine/new" className="text-blue-600 hover:underline">
                + Aggiungi nuova pagina
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
