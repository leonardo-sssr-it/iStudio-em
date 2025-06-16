"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Plus, Search, Calendar, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import type { Pagina } from "@/lib/services/pagine-service"

export default function PagineListPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [pagine, setPagine] = useState<Pagina[]>([])
  const [filteredPagine, setFilteredPagine] = useState<Pagina[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categories, setCategories] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Carica le pagine
  useEffect(() => {
    async function loadPagine() {
      if (!supabase) return

      setLoading(true)
      setError(null)

      try {
        let query = supabase.from("pagine").select("*")

        // Se l'utente è loggato, mostra le sue pagine private + tutte le pubbliche attive
        // Se non è loggato, mostra solo le pagine pubbliche attive
        if (user?.id) {
          query = query.or(
            `and(attivo.eq.true,privato.is.null),and(attivo.eq.true,privato.eq.false),id_utente.eq.${user.id}`,
          )
        } else {
          query = query.eq("attivo", true).or("privato.is.null,privato.eq.false")
        }

        const { data, error: fetchError } = await query.order("pubblicato", { ascending: false })

        if (fetchError) throw fetchError

        setPagine(data || [])

        // Estrai le categorie uniche
        const uniqueCategories = Array.from(new Set(data?.map((p) => p.categoria).filter(Boolean))) as string[]
        setCategories(uniqueCategories)
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

    loadPagine()
  }, [supabase, user?.id])

  // Applica i filtri
  useEffect(() => {
    let filtered = pagine

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(
        (pagina) =>
          pagina.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pagina.estratto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pagina.contenuto.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro per categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter((pagina) => pagina.categoria === categoryFilter)
    }

    // Filtro per stato
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((pagina) => pagina.attivo)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((pagina) => !pagina.attivo)
      } else if (statusFilter === "private") {
        filtered = filtered.filter((pagina) => pagina.privato)
      } else if (statusFilter === "public") {
        filtered = filtered.filter((pagina) => !pagina.privato)
      }
    }

    setFilteredPagine(filtered)
  }, [pagine, searchTerm, categoryFilter, statusFilter])

  // Formatta la data
  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pagine</h1>
          <p className="text-gray-600 mt-1">
            {user?.id ? "Le tue pagine e quelle pubbliche" : "Pagine pubbliche disponibili"}
          </p>
        </div>

        {user?.id && (
          <Button onClick={() => router.push("/pagine/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Pagina
          </Button>
        )}
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cerca nelle pagine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tutte le categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Solo attive</SelectItem>
            <SelectItem value="inactive">Solo non attive</SelectItem>
            <SelectItem value="public">Solo pubbliche</SelectItem>
            <SelectItem value="private">Solo private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista pagine */}
      {error ? (
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Errore nel caricamento</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Riprova</Button>
          </CardContent>
        </Card>
      ) : filteredPagine.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Nessuna pagina trovata</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : user?.id
                  ? "Non hai ancora creato nessuna pagina"
                  : "Non ci sono pagine pubbliche disponibili"}
            </p>
            {user?.id && (
              <Button onClick={() => router.push("/pagine/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Crea la prima pagina
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPagine.map((pagina) => (
            <Card key={pagina.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/pagine/${pagina.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{pagina.titolo}</CardTitle>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {pagina.attivo ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Attivo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Non attivo
                          </Badge>
                        )}

                        {pagina.privato ? (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Privato
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Pubblico
                          </Badge>
                        )}

                        {pagina.categoria && <Badge variant="outline">{pagina.categoria}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(pagina.pubblicato)}
                    </div>
                  </div>
                </CardHeader>

                {pagina.estratto && (
                  <CardContent>
                    <p className="text-gray-600 line-clamp-2">{pagina.estratto}</p>
                  </CardContent>
                )}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
