"use client"

import { useState, useEffect, useMemo } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker" // Aggiornato all'EnhancedDatePicker
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar, CheckSquare, Briefcase } from "lucide-react"
import { format, addDays, parseISO, differenceInDays, isSameDay } from "date-fns"
import { it } from "date-fns/locale"

// Tipi per gli elementi del Gantt
interface GanttItem {
  id: string
  tipo: "attivita" | "progetto" | "appuntamento"
  titolo: string
  descrizione?: string
  cliente?: string
  dataInizio: Date
  dataFine: Date
  colore: string
  priorita?: string
  stato?: string
  id_utente: string
  id_cliente?: string
}

// Tipo per i clienti
interface Cliente {
  id: string
  nome: string
  cognome: string
  ragione_sociale?: string
}

export function GanttChartWidget() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [attivita, setAttivita] = useState<GanttItem[]>([])
  const [progetti, setProgetti] = useState<GanttItem[]>([])
  const [appuntamenti, setAppuntamenti] = useState<GanttItem[]>([])
  const [clienti, setClienti] = useState<Record<string, Cliente>>({})
  const [filtroTipi, setFiltroTipi] = useState({
    attivita: true,
    progetti: true,
    appuntamenti: true,
  })
  const [dataInizio, setDataInizio] = useState<Date>(new Date())
  const [dataFine, setDataFine] = useState<Date>(addDays(new Date(), 10)) // Default a 10 giorni
  const [periodoSelezionato, setPeriodoSelezionato] = useState<number>(10) // Default a 10 giorni
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showDebug, setShowDebug] = useState(false)

  // Calcola il numero totale di giorni nel periodo selezionato
  const totalDays = useMemo(() => {
    return differenceInDays(dataFine, dataInizio) + 1
  }, [dataInizio, dataFine])

  // Carica i dati dal database
  useEffect(() => {
    if (!supabase || !user) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setDebugInfo("")

      try {
        // Carica i clienti per riferimento
        await fetchClienti()

        // Carica i dati delle attività, progetti e appuntamenti
        await Promise.all([fetchAttivita(), fetchProgetti(), fetchAppuntamenti()])
      } catch (err) {
        console.error("Errore nel caricamento dei dati:", err)
        setError("Si è verificato un errore nel caricamento dei dati")
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati del diagramma Gantt",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, user, dataInizio, dataFine])

  // Funzione per impostare il periodo di visualizzazione
  const setPeriodo = (giorni: number) => {
    setPeriodoSelezionato(giorni)
    setDataFine(addDays(dataInizio, giorni))
  }

  // Funzione per caricare i clienti
  const fetchClienti = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase.from("clienti").select("*")

      if (error) {
        console.error("Error fetching clienti:", error)
        setDebugInfo((prev) => prev + `\nErrore clienti: ${error.message}`)
        throw error
      }

      const clientiMap: Record<string, Cliente> = {}
      if (data) {
        data.forEach((cliente: Cliente) => {
          clientiMap[cliente.id] = cliente
        })
      }

      setClienti(clientiMap)
      console.log("Clienti caricati:", Object.keys(clientiMap).length)
    } catch (err) {
      console.error("Errore nel caricamento dei clienti:", err)
    }
  }

  // Funzione per caricare le attività
  const fetchAttivita = async () => {
    if (!supabase || !user) return

    // Aggiungi questo all'inizio della funzione fetchAttivita
    console.log("DEBUG GANTT: Inizio fetchAttivita con date:", {
      dataInizio: dataInizio?.toISOString(),
      dataFine: dataFine?.toISOString(),
      userId: user?.id,
    })

    try {
      console.log("Fetching attività for period:", dataInizio.toISOString(), "to", dataFine.toISOString())

      // Modifica la funzione fetchAttivita per gestire meglio le date
      // Sostituisci la parte di costruzione della query con questo:
      const { data, error } = await supabase
        .from("attivita")
        .select("*")
        .eq("id_utente", user.id)
        .or(`data_inizio.gte.${dataInizio.toISOString()},data_fine.gte.${dataInizio.toISOString()}`)

      console.log("DEBUG GANTT: Query attività costruita:", {
        userId: user.id,
        dataInizioFilter: dataInizio.toISOString(),
        queryString: `data_inizio.gte.${dataInizio.toISOString()},data_fine.gte.${dataInizio.toISOString()}`,
      })

      if (error) {
        console.error("Error fetching attività:", error)
        setDebugInfo((prev) => prev + `\nErrore attività: ${error.message}`)
        throw error
      }

      console.log("Raw attività data:", data)

      // Aggiungi questo dopo aver eseguito la query per le attività
      console.log("DEBUG GANTT: Risultati query attività:", {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
        firstItem: data?.[0]
          ? {
              id: data[0].id,
              titolo: data[0].titolo,
              dataInizio: data[0].data_inizio,
              dataFine: data[0].data_fine,
            }
          : null,
      })

      if (data && Array.isArray(data)) {
        const attivitaItems: GanttItem[] = data.map((item: any) => {
          // Ensure dates are valid
          let dataInizio, dataFine
          try {
            dataInizio = parseISO(item.data_inizio)
            dataFine = parseISO(item.data_fine)

            // Fallback if dates are invalid
            if (isNaN(dataInizio.getTime())) dataInizio = new Date()
            if (isNaN(dataFine.getTime())) dataFine = new Date()

            // Ensure dataFine is not before dataInizio
            if (dataFine < dataInizio) dataFine = dataInizio
          } catch (e) {
            console.error("Date parsing error for attività:", item.id, e)
            dataInizio = new Date()
            dataFine = new Date()
          }

          return {
            id: item.id,
            tipo: "attivita",
            titolo: item.titolo || "Attività senza titolo",
            descrizione: item.descrizione || "",
            dataInizio,
            dataFine,
            colore: "#ffcdd2", // Rosso pastello per le attività
            priorita: item.priorita,
            stato: item.stato,
            id_utente: item.id_utente,
            id_cliente: item.id_cliente,
          }
        })

        setAttivita(attivitaItems)
        console.log("Attività processate:", attivitaItems.length, attivitaItems)
      } else {
        console.warn("No attività data returned or data is not an array")
        setAttivita([])
      }
    } catch (err) {
      console.error("Errore nel caricamento delle attività:", err)
    }
  }

  // Funzione per caricare i progetti
  const fetchProgetti = async () => {
    if (!supabase || !user) return

    // Aggiungi questo all'inizio della funzione fetchProgetti
    console.log("DEBUG GANTT: Inizio fetchProgetti con date:", {
      dataInizio: dataInizio?.toISOString(),
      dataFine: dataFine?.toISOString(),
      userId: user?.id,
    })

    try {
      console.log("Fetching progetti for period:", dataInizio.toISOString(), "to", dataFine.toISOString())

      // Modifica la funzione fetchProgetti per gestire meglio le date
      // Sostituisci la parte di costruzione della query con questo:
      const { data, error } = await supabase
        .from("progetti")
        .select("*")
        .eq("id_utente", user.id)
        .or(`data_inizio.gte.${dataInizio.toISOString()},data_fine.gte.${dataInizio.toISOString()}`)

      console.log("DEBUG GANTT: Query progetti costruita:", {
        userId: user.id,
        dataInizioFilter: dataInizio.toISOString(),
        queryString: `data_inizio.gte.${dataInizio.toISOString()},data_fine.gte.${dataInizio.toISOString()}`,
      })

      if (error) {
        console.error("Error fetching progetti:", error)
        setDebugInfo((prev) => prev + `\nErrore progetti: ${error.message}`)
        throw error
      }

      console.log("Raw progetti data:", data)

      // Aggiungi questo dopo aver eseguito la query per le progetti
      console.log("DEBUG GANTT: Risultati query progetti:", {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
        firstItem: data?.[0]
          ? {
              id: data[0].id,
              titolo: data[0].titolo,
              dataInizio: data[0].data_inizio,
              dataFine: data[0].data_fine,
            }
          : null,
      })

      if (data && Array.isArray(data)) {
        const progettiItems: GanttItem[] = data.map((item: any) => {
          // Ensure dates are valid
          let dataInizio, dataFine
          try {
            dataInizio = parseISO(item.data_inizio)
            dataFine = parseISO(item.data_fine)

            // Fallback if dates are invalid
            if (isNaN(dataInizio.getTime())) dataInizio = new Date()
            if (isNaN(dataFine.getTime())) dataFine = new Date()

            // Ensure dataFine is not before dataInizio
            if (dataFine < dataInizio) dataFine = dataInizio
          } catch (e) {
            console.error("Date parsing error for progetto:", item.id, e)
            dataInizio = new Date()
            dataFine = new Date()
          }

          return {
            id: item.id,
            tipo: "progetto",
            titolo: item.titolo || "Progetto senza titolo",
            descrizione: item.descrizione || "",
            dataInizio,
            dataFine,
            colore: "#bbdefb", // Blu pastello per i progetti
            priorita: item.priorita,
            stato: item.stato,
            id_utente: item.id_utente,
            id_cliente: item.id_cliente,
          }
        })

        setProgetti(progettiItems)
        console.log("Progetti processati:", progettiItems.length, progettiItems)
      } else {
        console.warn("No progetti data returned or data is not an array")
        setProgetti([])
      }
    } catch (err) {
      console.error("Errore nel caricamento dei progetti:", err)
    }
  }

  // Funzione per caricare gli appuntamenti
  const fetchAppuntamenti = async () => {
    if (!supabase || !user) return

    // Aggiungi questo all'inizio della funzione fetchAppuntamenti
    console.log("DEBUG GANTT: Inizio fetchAppuntamenti con date:", {
      dataInizio: dataInizio?.toISOString(),
      dataFine: dataFine?.toISOString(),
      userId: user?.id,
    })

    try {
      console.log("Fetching appuntamenti for period:", dataInizio.toISOString(), "to", dataFine.toISOString())

      // Prima verifichiamo la struttura della tabella
      const { data: sampleData, error: sampleError } = await supabase.from("appuntamenti").select("*").limit(1)

      if (sampleError) {
        console.error("Error checking appuntamenti table:", sampleError)
        setDebugInfo((prev) => prev + `\nErrore verifica appuntamenti: ${sampleError.message}`)
        return
      }

      // Determina i nomi delle colonne per le date
      const columnNames = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : []
      console.log("Appuntamenti column names:", columnNames)

      // Possibili nomi per le colonne di data
      const possibleStartColumns = ["data_inizio", "data", "inizio", "start_date", "start"]
      const possibleEndColumns = ["data_fine", "fine", "scadenza", "end_date", "end"]

      // Trova i nomi effettivi delle colonne
      const startColumn = possibleStartColumns.find((col) => columnNames.includes(col)) || "data_inizio"
      const endColumn = possibleEndColumns.find((col) => columnNames.includes(col)) || "data_fine"

      console.log(`Using columns: ${startColumn} and ${endColumn} for appuntamenti`)

      // Costruisci la query con i nomi delle colonne corretti
      let query = supabase.from("appuntamenti").select("*").eq("id_utente", user.id)

      // Aggiungi filtri per le date se le colonne esistono
      if (columnNames.includes(startColumn)) {
        query = query.gte(startColumn, dataInizio.toISOString())
      }
      if (columnNames.includes(endColumn)) {
        query = query.lte(endColumn, dataFine.toISOString())
      }

      // Modifica la funzione fetchAppuntamenti per gestire meglio le date
      // Sostituisci la parte di costruzione della query con questo:
      const { data, error } = await query

      console.log("DEBUG GANTT: Query appuntamenti costruita:", {
        userId: user.id,
        dataInizioFilter: dataInizio.toISOString(),
        dataFineFilter: dataFine.toISOString(),
        queryString: `data_inizio.gte.${dataInizio.toISOString()},data_fine.lte.${dataFine.toISOString()}`,
      })

      if (error) {
        console.error("Error fetching appuntamenti:", error)
        setDebugInfo((prev) => prev + `\nErrore appuntamenti: ${error.message}`)
        throw error
      }

      console.log("Raw appuntamenti data:", data)

      // Aggiungi questo dopo aver eseguito la query per le appuntamenti
      console.log("DEBUG GANTT: Risultati query appuntamenti:", {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
        firstItem: data?.[0]
          ? {
              id: data[0].id,
              titolo: data[0].titolo,
              dataInizio: data[0].data_inizio,
              dataFine: data[0].data_fine,
            }
          : null,
      })

      if (data && Array.isArray(data)) {
        const appuntamentiItems: GanttItem[] = data.map((item: any) => {
          // Determine which date fields to use
          const startDateField = possibleStartColumns.find((col) => item[col] !== undefined) || "data_inizio"
          const endDateField = possibleEndColumns.find((col) => item[col] !== undefined) || "data_fine"

          // Ensure dates are valid
          let dataInizio, dataFine
          try {
            dataInizio = item[startDateField] ? parseISO(item[startDateField]) : new Date()
            dataFine = item[endDateField] ? parseISO(item[endDateField]) : new Date(dataInizio)

            // Fallback if dates are invalid
            if (isNaN(dataInizio.getTime())) dataInizio = new Date()
            if (isNaN(dataFine.getTime())) dataFine = new Date()

            // Ensure dataFine is not before dataInizio
            if (dataFine < dataInizio) dataFine = dataInizio
          } catch (e) {
            console.error("Date parsing error for appuntamento:", item.id, e)
            dataInizio = new Date()
            dataFine = new Date()
          }

          return {
            id: item.id,
            tipo: "appuntamento",
            titolo: item.titolo || item.nome || item.descrizione || `Appuntamento #${item.id}`,
            descrizione: item.descrizione || item.note || "",
            dataInizio,
            dataFine,
            colore: "#c8e6c9", // Verde pastello per gli appuntamenti
            priorita: item.priorita,
            stato: item.stato,
            id_utente: item.id_utente,
            id_cliente: item.id_cliente,
          }
        })

        setAppuntamenti(appuntamentiItems)
        console.log("Appuntamenti processati:", appuntamentiItems.length, appuntamentiItems)
      } else {
        console.warn("No appuntamenti data returned or data is not an array")
        setAppuntamenti([])
      }
    } catch (err) {
      console.error("Errore nel caricamento degli appuntamenti:", err)
    }
  }

  // Funzione per ottenere il colore in base alla priorità
  const getPriorityColor = (priorita?: string): string => {
    switch (priorita?.toLowerCase()) {
      case "alta":
        return "#ef4444" // Rosso
      case "media":
        return "#f59e0b" // Arancione
      case "bassa":
        return "#3b82f6" // Blu
      default:
        return "#6b7280" // Grigio
    }
  }

  // Funzione per ottenere l'icona in base al tipo
  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case "attivita":
        return <CheckSquare className="h-4 w-4" />
      case "progetto":
        return <Briefcase className="h-4 w-4" />
      case "appuntamento":
        return <Calendar className="h-4 w-4" />
      default:
        return null
    }
  }

  // Funzione per ottenere il nome del cliente
  const getClienteName = (id_cliente?: string): string => {
    if (!id_cliente || !clienti[id_cliente]) return "Cliente non specificato"

    const cliente = clienti[id_cliente]
    if (cliente.ragione_sociale) return cliente.ragione_sociale
    return `${cliente.cognome} ${cliente.nome}`.trim()
  }

  // Combina tutti gli elementi filtrati
  const elementiGantt = useMemo(() => {
    let elementi: GanttItem[] = []

    if (filtroTipi.attivita) elementi = [...elementi, ...attivita]
    if (filtroTipi.progetti) elementi = [...elementi, ...progetti]
    if (filtroTipi.appuntamenti) elementi = [...elementi, ...appuntamenti]

    return elementi.sort((a, b) => a.dataInizio.getTime() - b.dataInizio.getTime())
  }, [attivita, progetti, appuntamenti, filtroTipi])

  // Aggiungi questo dopo la definizione di elementiGantt
  useEffect(() => {
    console.log("DEBUG GANTT: Elementi filtrati per visualizzazione:", {
      totale: elementiGantt.length,
      perTipo: {
        attivita: elementiGantt.filter((item) => item.tipo === "attivita").length,
        progetti: elementiGantt.filter((item) => item.tipo === "progetto").length,
        appuntamenti: elementiGantt.filter((item) => item.tipo === "appuntamento").length,
      },
      filtriAttivi: filtroTipi,
      periodoVisualizzato: {
        inizio: dataInizio?.toISOString(),
        fine: dataFine?.toISOString(),
        giorni: totalDays,
      },
    })

    // Mostra i primi 3 elementi di ogni tipo per debug
    const primiElementi = {
      attivita: elementiGantt.filter((item) => item.tipo === "attivita").slice(0, 3),
      progetti: elementiGantt.filter((item) => item.tipo === "progetto").slice(0, 3),
      appuntamenti: elementiGantt.filter((item) => item.tipo === "appuntamento").slice(0, 3),
    }

    console.log("DEBUG GANTT: Primi elementi per tipo:", primiElementi)
  }, [elementiGantt, filtroTipi, dataInizio, dataFine, totalDays])

  // Genera le date per l'intestazione
  const headerDates = useMemo(() => {
    const dates = []
    const currentDate = new Date(dataInizio)

    while (currentDate <= dataFine) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }, [dataInizio, dataFine])

  // Calcola la posizione e la larghezza di un elemento nel Gantt
  const calculateItemPosition = (item: GanttItem, index: number) => {
    const startDay = Math.max(0, differenceInDays(item.dataInizio, dataInizio))
    const endDay = Math.min(totalDays - 1, differenceInDays(item.dataFine, dataInizio))
    const duration = Math.max(1, endDay - startDay + 1)

    const left = (startDay / totalDays) * 100
    const width = (duration / totalDays) * 100

    // Aggiungi un piccolo offset verticale per elementi dello stesso tipo che iniziano lo stesso giorno
    // per evitare sovrapposizioni complete
    const sameTypeItems = elementiGantt.filter(
      (el, i) => el.tipo === item.tipo && i < index && isSameDay(el.dataInizio, item.dataInizio),
    ).length

    const verticalOffset = sameTypeItems * 2 // 2px di offset per ogni elemento dello stesso tipo

    return {
      left: `${left}%`,
      width: `${width}%`,
      marginTop: verticalOffset > 0 ? `${verticalOffset}px` : undefined,
    }
  }

  // Gestisce il cambio di stato dei checkbox
  const handleCheckboxChange = (tipo: keyof typeof filtroTipi) => {
    setFiltroTipi((prev) => ({
      ...prev,
      [tipo]: !prev[tipo],
    }))
  }

  // Gestisce il cambio della data di inizio
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDataInizio(date)
      setDataFine(addDays(date, periodoSelezionato))
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagramma Gantt</CardTitle>
          <CardDescription>Caricamento in corso...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagramma Gantt</CardTitle>
          <CardDescription>Si è verificato un errore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-red-500">{error}</div>
          {debugInfo && (
            <div className="p-4 text-xs font-mono whitespace-pre-wrap bg-gray-100 rounded mt-2">{debugInfo}</div>
          )}
        </CardContent>
      </Card>
    )
  }

  const today = new Date()

  // Aggiungi questo prima del return finale

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramma Gantt</CardTitle>
        <CardDescription>Visualizza attività, progetti e appuntamenti in un diagramma temporale</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filtri e selezione date - Layout riorganizzato */}
          <div className="flex flex-col space-y-4">
            {/* Prima riga: Data inizio e pulsanti periodo */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-end gap-2">
                <div>
                  <Label>Data inizio</Label>
                  {/* Utilizzo del nuovo EnhancedDatePicker */}
                  <EnhancedDatePicker
                    date={dataInizio}
                    onDateChange={handleDateChange}
                    placeholder="Seleziona data"
                    locale="it"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={periodoSelezionato === 10 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodo(10)}
                  className={periodoSelezionato === 10 ? "bg-primary text-primary-foreground" : ""}
                >
                  10 giorni
                </Button>
                <Button
                  variant={periodoSelezionato === 20 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodo(20)}
                  className={periodoSelezionato === 20 ? "bg-primary text-primary-foreground" : ""}
                >
                  20 giorni
                </Button>
                <Button
                  variant={periodoSelezionato === 30 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodo(30)}
                  className={periodoSelezionato === 30 ? "bg-primary text-primary-foreground" : ""}
                >
                  30 giorni
                </Button>
              </div>

              {/* Checkbox spostati sulla stessa riga */}
              <div className="flex flex-wrap gap-4 ml-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attivita"
                    checked={filtroTipi.attivita}
                    onCheckedChange={() => handleCheckboxChange("attivita")}
                  />
                  <Label htmlFor="attivita" className="flex items-center gap-1">
                    <CheckSquare className="h-4 w-4 text-red-300" />
                    Attività
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="progetti"
                    checked={filtroTipi.progetti}
                    onCheckedChange={() => handleCheckboxChange("progetti")}
                  />
                  <Label htmlFor="progetti" className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-blue-300" />
                    Progetti
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appuntamenti"
                    checked={filtroTipi.appuntamenti}
                    onCheckedChange={() => handleCheckboxChange("appuntamenti")}
                  />
                  <Label htmlFor="appuntamenti" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-green-300" />
                    Appuntamenti
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Debug info - will help troubleshoot data issues */}
          <div className="text-xs text-muted-foreground">
            <p>
              Elementi caricati: Attività ({attivita.length}), Progetti ({progetti.length}), Appuntamenti (
              {appuntamenti.length})
            </p>
            <p>
              Periodo: {format(dataInizio, "dd/MM/yyyy")} - {format(dataFine, "dd/MM/yyyy")} ({totalDays} giorni)
            </p>
          </div>

          {/* Diagramma Gantt - Improved mobile view */}
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              {/* Intestazione con le date */}
              <div className="flex border-b min-w-[800px]">
                <div className="flex-1 flex">
                  {headerDates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-1 p-1 text-center text-xs ${
                        isSameDay(date, today)
                          ? "bg-blue-100 font-bold"
                          : date.getDay() === 0 || date.getDay() === 6
                            ? "bg-gray-100"
                            : ""
                      }`}
                    >
                      {format(date, "dd/MM", { locale: it })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenuto del Gantt */}
              <div className="min-w-[800px] relative">
                {/* Linee di griglia per i giorni */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {headerDates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-1 border-r ${
                        isSameDay(date, today)
                          ? "bg-blue-100"
                          : date.getDay() === 0 || date.getDay() === 6
                            ? "bg-gray-100"
                            : ""
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Linea verticale per il giorno corrente */}
                {headerDates.some((date) => isSameDay(date, today)) && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                    style={{
                      left: `${(differenceInDays(today, dataInizio) / totalDays) * 100}%`,
                    }}
                  ></div>
                )}

                {/* Elementi del Gantt */}
                <div className="relative min-h-[300px] p-2">
                  {elementiGantt.length > 0 ? (
                    elementiGantt.map((item, index) => {
                      const { left, width, marginTop } = calculateItemPosition(item, index)
                      return (
                        <Popover key={`${item.tipo}-${item.id}`}>
                          <PopoverTrigger asChild>
                            <div
                              className="absolute h-8 rounded cursor-pointer flex items-center px-2 text-gray-700 text-xs font-medium"
                              style={{
                                left,
                                width,
                                top: `${index * 40 + 10}px`,
                                backgroundColor: item.colore,
                                marginTop,
                              }}
                            >
                              {/* Pallino per la priorità */}
                              <div
                                className="w-3 h-3 rounded-full mr-1 flex-shrink-0"
                                style={{ backgroundColor: getPriorityColor(item.priorita) }}
                              ></div>
                              <span className="truncate">{item.titolo}</span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] sm:w-[350px]">
                            <div className="space-y-2">
                              <div className="font-medium flex items-center gap-2">
                                {getIconByType(item.tipo)}
                                {item.titolo}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.descrizione || "Nessuna descrizione disponibile"}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Cliente:</span> {getClienteName(item.id_cliente)}
                                </div>
                                <div>
                                  <span className="font-medium">Stato:</span> {item.stato || "Non specificato"}
                                </div>
                                <div>
                                  <span className="font-medium">Inizio:</span> {format(item.dataInizio, "dd/MM/yyyy")}
                                </div>
                                <div>
                                  <span className="font-medium">Fine:</span> {format(item.dataFine, "dd/MM/yyyy")}
                                </div>
                                {item.priorita && (
                                  <div>
                                    <span className="font-medium">Priorità:</span> {item.priorita}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Tipo:</span>{" "}
                                  {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Nessun elemento trovato nel periodo selezionato
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile instructions */}
            <div className="p-2 text-xs text-center text-muted-foreground md:hidden">
              Scorri orizzontalmente per visualizzare l'intero diagramma
            </div>
          </div>

          {/* Legenda - Improved for mobile */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-200"></div>
              <span>Attività</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-200"></div>
              <span>Progetti</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-200"></div>
              <span>Appuntamenti</span>
            </div>
            <div className="w-full my-1 md:w-auto md:my-0 md:border-l md:pl-2 md:ml-2">
              <span className="font-medium">Priorità:</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Alta</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Media</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Bassa</span>
            </div>
          </div>
        </div>
        {showDebug && (
          <div className="mt-4 p-2 border rounded bg-gray-50 text-xs font-mono">
            <div className="flex justify-between mb-2">
              <h4 className="font-bold">Debug Panel</h4>
              <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-700">
                Chiudi
              </button>
            </div>
            <div className="space-y-1">
              <p>
                Periodo: {dataInizio?.toISOString()} - {dataFine?.toISOString()}
              </p>
              <p>Elementi totali: {elementiGantt.length}</p>
              <p>Attività: {attivita.length}</p>
              <p>Progetti: {progetti.length}</p>
              <p>Appuntamenti: {appuntamenti.length}</p>
              <p>Filtri: {JSON.stringify(filtroTipi)}</p>
            </div>
          </div>
        )}
        {/* Aggiungi questo pulsante sotto la legenda */}
        <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="mt-2">
          {showDebug ? "Nascondi Debug" : "Mostra Debug"}
        </Button>
      </CardContent>
    </Card>
  )
}
