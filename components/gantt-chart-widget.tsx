"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar, CheckSquare, Briefcase, ExternalLink } from "lucide-react"
import { format, addDays, differenceInDays, isSameDay, max, min } from "date-fns"
import { it } from "date-fns/locale"

// Funzione per parsing date senza timezone
function parseLocalDate(dateString: string): Date {
  // Se la stringa contiene 'T', è in formato ISO
  if (dateString.includes("T")) {
    const [datePart, timePart] = dateString.split("T")
    const [year, month, day] = datePart.split("-").map(Number)

    if (timePart) {
      const [time] = timePart.split(".") // Rimuovi millisecondi se presenti
      const [hours, minutes, seconds = 0] = time.split(":").map(Number)
      return new Date(year, month - 1, day, hours, minutes, seconds)
    } else {
      return new Date(year, month - 1, day)
    }
  } else {
    // Formato solo data
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
  }
}

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

  const [dataInizioFiltro, setDataInizioFiltro] = useState<Date>(new Date())
  const [periodoSelezionato, setPeriodoSelezionato] = useState<number>(10)
  const [dataFineFiltro, setDataFineFiltro] = useState<Date>(addDays(new Date(), periodoSelezionato - 1))

  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showDebug, setShowDebug] = useState(false)

  const totalDaysInView = useMemo(() => {
    return differenceInDays(dataFineFiltro, dataInizioFiltro) + 1
  }, [dataInizioFiltro, dataFineFiltro])

  useEffect(() => {
    if (!supabase || !user) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setDebugInfo("")
      console.log(
        "[Gantt] Inizio fetchData. Filtro date:",
        dataInizioFiltro.toISOString(),
        dataFineFiltro.toISOString(),
      )
      try {
        await fetchClienti()
        await Promise.all([
          fetchAttivita(dataInizioFiltro, dataFineFiltro),
          fetchProgetti(dataInizioFiltro, dataFineFiltro),
          fetchAppuntamenti(dataInizioFiltro, dataFineFiltro),
        ])
        console.log("[Gantt] Fine fetchData.")
      } catch (err) {
        console.error("[Gantt] Errore nel caricamento dei dati:", err)
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
  }, [supabase, user, dataInizioFiltro, dataFineFiltro])

  const setPeriodo = (giorni: number) => {
    setPeriodoSelezionato(giorni)
    setDataFineFiltro(addDays(dataInizioFiltro, giorni - 1))
  }

  const fetchClienti = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from("clienti").select("*")
      if (error) throw error
      const clientiMap: Record<string, Cliente> = {}
      if (data) {
        data.forEach((cliente: any) => {
          clientiMap[cliente.id] = cliente as Cliente
        })
      }
      setClienti(clientiMap)
    } catch (err) {
      console.error("[Gantt] Errore nel caricamento dei clienti:", err)
    }
  }

  const fetchAttivita = async (startDate: Date, endDate: Date) => {
    if (!supabase || !user) return
    try {
      const { data, error } = await supabase
        .from("attivita")
        .select("*")
        .eq("id_utente", user.id)
        .lte("data_inizio", endDate.toISOString())
        .gte("data_fine", startDate.toISOString())
      if (error) throw error
      if (data) {
        if (data.length > 0) {
          console.log(
            `[Gantt] Attività grezze da Supabase (ID: ${data[0].id}): Inizio: ${data[0].data_inizio}, Fine: ${data[0].data_fine}`,
          )
        }
        const mappedAttivita = data.map((item: any) => {
          const dataInizioParsed = parseLocalDate(item.data_inizio)
          const dataFineParsed = parseLocalDate(item.data_fine)

          console.log(
            `[Gantt] Attività mappata (ID: ${item.id}): Inizio: ${dataInizioParsed.toLocaleString()}, Fine: ${dataFineParsed.toLocaleString()}`,
          )

          return {
            id: item.id.toString(),
            tipo: "attivita" as const,
            titolo: item.titolo || "Attività senza titolo",
            descrizione: item.descrizione || "",
            dataInizio: dataInizioParsed,
            dataFine: dataFineParsed,
            colore: "#ffcdd2",
            priorita: item.priorita,
            stato: item.stato,
            id_utente: item.id_utente,
            id_cliente: item.id_cliente ? item.id_cliente.toString() : undefined,
          }
        })
        setAttivita(mappedAttivita)
      } else {
        setAttivita([])
      }
    } catch (err) {
      console.error("[Gantt] Errore nel caricamento delle attività:", err)
      setAttivita([])
    }
  }

  const fetchProgetti = async (startDate: Date, endDate: Date) => {
    if (!supabase || !user) return
    try {
      const { data, error } = await supabase
        .from("progetti")
        .select("*")
        .eq("id_utente", user.id)
        .lte("data_inizio", endDate.toISOString())
        .gte("data_fine", startDate.toISOString())
      if (error) throw error
      if (data) {
        if (data.length > 0) {
          console.log(
            `[Gantt] Progetti grezzi da Supabase (ID: ${data[0].id}): Inizio: ${data[0].data_inizio}, Fine: ${data[0].data_fine}`,
          )
        }
        const mappedProgetti = data.map((item: any) => {
          const dataInizioParsed = parseLocalDate(item.data_inizio)
          const dataFineParsed = parseLocalDate(item.data_fine)

          console.log(
            `[Gantt] Progetti mappati (ID: ${item.id}): Inizio: ${dataInizioParsed.toLocaleString()}, Fine: ${dataFineParsed.toLocaleString()}`,
          )

          return {
            id: item.id.toString(),
            tipo: "progetto" as const,
            titolo: item.titolo || "Progetto senza titolo",
            descrizione: item.descrizione || "",
            dataInizio: dataInizioParsed,
            dataFine: dataFineParsed,
            colore: "#bbdefb",
            priorita: item.priorita,
            stato: item.stato,
            id_utente: item.id_utente,
            id_cliente: item.id_cliente ? item.id_cliente.toString() : undefined,
          }
        })
        setProgetti(mappedProgetti)
      } else {
        setProgetti([])
      }
    } catch (err) {
      console.error("[Gantt] Errore nel caricamento dei progetti:", err)
      setProgetti([])
    }
  }

  const fetchAppuntamenti = async (startDate: Date, endDate: Date) => {
    if (!supabase || !user) return
    const startColumn = "data_inizio"
    const endColumn = "data_fine"
    try {
      const { data, error } = await supabase
        .from("appuntamenti")
        .select("*")
        .eq("id_utente", user.id)
        .lte(startColumn, endDate.toISOString())
        .gte(endColumn, startDate.toISOString())
      if (error) throw error
      if (data) {
        if (data.length > 0 && data[0].id.toString() === "36") {
          console.log(
            `[Gantt DEBUG ID 36] Appuntamento grezzo da Supabase: Inizio: ${data[0][startColumn]}, Fine: ${data[0][endColumn]}`,
          )
        }
        const mappedAppuntamenti = data.map((item: any) => {
          const dataInizioParsed = parseLocalDate(item[startColumn])
          const dataFineParsed = parseLocalDate(item[endColumn])

          if (item.id.toString() === "36") {
            console.log(
              `[Gantt DEBUG ID 36] Appuntamento mappato: Inizio: ${dataInizioParsed.toLocaleString()}, Fine: ${dataFineParsed.toLocaleString()}`,
            )
          }

          return {
            id: item.id.toString(),
            tipo: "appuntamento" as const,
            titolo: item.titolo || item.nome || `Appuntamento #${item.id}`,
            descrizione: item.descrizione || item.note || "",
            dataInizio: dataInizioParsed,
            dataFine: dataFineParsed,
            colore: "#c8e6c9",
            priorita: item.priorita,
            stato: item.stato,
            id_utente: item.id_utente,
            id_cliente: item.id_cliente ? item.id_cliente.toString() : undefined,
          }
        })
        setAppuntamenti(mappedAppuntamenti)
      } else {
        setAppuntamenti([])
      }
    } catch (err) {
      console.error("[Gantt] Errore nel caricamento degli appuntamenti:", err)
      setAppuntamenti([])
    }
  }

  const getPriorityColor = (priorita?: string): string => {
    switch (priorita?.toString().toLowerCase()) {
      case "alta":
      case "3":
        return "#ef4444"
      case "media":
      case "2":
        return "#f59e0b"
      case "bassa":
      case "1":
        return "#3b82f6"
      default:
        return "#6b7280"
    }
  }

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

  const getClienteName = (id_cliente?: string): string => {
    if (!id_cliente || !clienti[id_cliente]) return "Cliente non specificato"
    const cliente = clienti[id_cliente]
    return cliente.ragione_sociale || `${cliente.cognome} ${cliente.nome}`.trim()
  }

  const elementiGantt = useMemo(() => {
    let elementi: GanttItem[] = []
    if (filtroTipi.attivita) elementi = [...elementi, ...attivita]
    if (filtroTipi.progetti) elementi = [...elementi, ...progetti]
    if (filtroTipi.appuntamenti) elementi = [...elementi, ...appuntamenti]

    const filteredAndSorted = elementi
      .filter((item) => {
        const displayStart = max([item.dataInizio, dataInizioFiltro])
        const displayEnd = min([item.dataFine, dataFineFiltro])
        const isInDateRange = displayEnd >= displayStart
        if (item.id === "36") {
          console.log(
            `[Gantt DEBUG ID 36 useMemo] Item Start: ${item.dataInizio.toLocaleString()}, Item End: ${item.dataFine.toLocaleString()}`,
          )
          console.log(
            `[Gantt DEBUG ID 36 useMemo] Filtro Start: ${dataInizioFiltro.toLocaleString()}, Filtro End: ${dataFineFiltro.toLocaleString()}`,
          )
          console.log(
            `[Gantt DEBUG ID 36 useMemo] Display Start: ${displayStart.toLocaleString()}, Display End: ${displayEnd.toLocaleString()}`,
          )
          console.log(`[Gantt DEBUG ID 36 useMemo] Is In Range: ${isInDateRange}`)
        }
        return isInDateRange
      })
      .sort((a, b) => a.dataInizio.getTime() - b.dataInizio.getTime())

    if (filteredAndSorted.find((i) => i.id === "36")) {
      console.log("[Gantt DEBUG ID 36 useMemo] L'elemento 36 è presente negli elementi filtrati e ordinati.")
    } else if (elementi.find((i) => i.id === "36")) {
      console.log("[Gantt DEBUG ID 36 useMemo] L'elemento 36 è presente negli elementi PRIMA del filtro ma NON DOPO.")
    }

    return filteredAndSorted
  }, [attivita, progetti, appuntamenti, filtroTipi, dataInizioFiltro, dataFineFiltro])

  const headerDates = useMemo(() => {
    const dates = []
    const currentDate = new Date(dataInizioFiltro)
    for (let i = 0; i < totalDaysInView; i++) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }, [dataInizioFiltro, totalDaysInView])

  const calculateItemPosition = (item: GanttItem, index: number) => {
    const displayDataInizio = max([item.dataInizio, dataInizioFiltro])
    const displayDataFine = min([item.dataFine, dataFineFiltro])

    const startDayOfDisplay = new Date(
      displayDataInizio.getFullYear(),
      displayDataInizio.getMonth(),
      displayDataInizio.getDate(),
    )
    const endDayOfDisplay = new Date(
      displayDataFine.getFullYear(),
      displayDataFine.getMonth(),
      displayDataFine.getDate(),
    )
    const startDayOfFilter = new Date(
      dataInizioFiltro.getFullYear(),
      dataInizioFiltro.getMonth(),
      dataInizioFiltro.getDate(),
    )

    const startDayOffset = differenceInDays(startDayOfDisplay, startDayOfFilter)
    const endDayOffset = differenceInDays(endDayOfDisplay, startDayOfFilter)

    const durationInView = Math.max(1, endDayOffset - startDayOffset + 1)

    const leftPercentage = (startDayOffset / totalDaysInView) * 100
    const widthPercentage = (durationInView / totalDaysInView) * 100

    if (item.id === "36") {
      console.log(`[Gantt DEBUG ID 36 calculateItemPosition] Item: ${item.titolo}`)
      console.log(`  Original Dates: ${item.dataInizio.toLocaleString()} - ${item.dataFine.toLocaleString()}`)
      console.log(`  Filter Dates: ${dataInizioFiltro.toLocaleString()} - ${dataFineFiltro.toLocaleString()}`)
      console.log(
        `  Display Dates (actual portion shown): ${displayDataInizio.toLocaleString()} - ${displayDataFine.toLocaleString()}`,
      )
      console.log(
        `  StartDayOfDisplay: ${startDayOfDisplay.toLocaleString()}, EndDayOfDisplay: ${endDayOfDisplay.toLocaleString()}`,
      )
      console.log(`  StartDayOffset: ${startDayOffset}, EndDayOffset: ${endDayOffset}`)
      console.log(`  TotalDaysInView: ${totalDaysInView}, DurationInView (days): ${durationInView}`)
      console.log(`  Left: ${leftPercentage}%, Width: ${widthPercentage}%`)
    }

    const sameTypeItems = elementiGantt.filter(
      (el, i) => el.tipo === item.tipo && i < index && isSameDay(el.dataInizio, item.dataInizio),
    ).length
    const verticalOffset = sameTypeItems * 2

    return {
      left: `${leftPercentage}%`,
      width: `${widthPercentage}%`,
      marginTop: verticalOffset > 0 ? `${verticalOffset}px` : undefined,
    }
  }

  const handleCheckboxChange = (tipo: keyof typeof filtroTipi) => {
    setFiltroTipi((prev) => ({ ...prev, [tipo]: !prev[tipo] }))
  }

  const handleDateChange = (date: Date | undefined | null) => {
    if (date) {
      setDataInizioFiltro(date)
      setDataFineFiltro(addDays(date, periodoSelezionato - 1))
    }
  }

  const ganttBodyHeight = Math.max(200, elementiGantt.length * 48 + 40)

  const getTableNameFromType = (type: GanttItem["tipo"]): string => {
    switch (type) {
      case "attivita":
        return "attivita"
      case "progetto":
        return "progetti"
      case "appuntamento":
        return "appuntamenti"
      default:
        console.warn(`[Gantt] Tipo di elemento Gantt non riconosciuto per link: ${type}`)
        return type
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
        </CardContent>
      </Card>
    )
  }

  const today = new Date()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramma Gantt</CardTitle>
        <CardDescription>Visualizza attività, progetti e appuntamenti in un diagramma temporale</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label htmlFor="gantt-date-picker">Data inizio</Label>
                <EnhancedDatePicker
                  id="gantt-date-picker"
                  date={dataInizioFiltro}
                  onDateChange={handleDateChange}
                  placeholder="Seleziona data"
                  locale="it"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30].map((days) => (
                  <Button
                    key={days}
                    variant={periodoSelezionato === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriodo(days)}
                    className={periodoSelezionato === days ? "bg-green-600 text-white hover:bg-green-700" : ""}
                  >
                    {days} giorni
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 ml-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gantt-attivita"
                    checked={filtroTipi.attivita}
                    onCheckedChange={() => handleCheckboxChange("attivita")}
                  />
                  <Label htmlFor="gantt-attivita" className="flex items-center gap-1">
                    <CheckSquare className="h-4 w-4 text-red-300" />
                    Attività
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gantt-progetti"
                    checked={filtroTipi.progetti}
                    onCheckedChange={() => handleCheckboxChange("progetti")}
                  />
                  <Label htmlFor="gantt-progetti" className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-blue-300" />
                    Progetti
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gantt-appuntamenti"
                    checked={filtroTipi.appuntamenti}
                    onCheckedChange={() => handleCheckboxChange("appuntamenti")}
                  />
                  <Label htmlFor="gantt-appuntamenti" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-green-300" />
                    Appuntamenti
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Periodo: {format(dataInizioFiltro, "dd/MM/yyyy")} - {format(dataFineFiltro, "dd/MM/yyyy")} (
              {totalDaysInView} giorni)
            </p>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <div className="flex border-b min-w-[800px]">
                <div className="flex-1 flex">
                  {headerDates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-1 p-1 text-center text-xs ${isSameDay(date, today) ? "bg-blue-100 font-bold" : date.getDay() === 0 || date.getDay() === 6 ? "bg-gray-100" : ""}`}
                    >
                      {format(date, "dd/MM", { locale: it })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-w-[800px] relative" style={{ height: `${ganttBodyHeight}px` }}>
                <div className="absolute inset-0 flex pointer-events-none">
                  {headerDates.map((date, index) => (
                    <div
                      key={index}
                      className={`flex-1 border-r ${isSameDay(date, today) ? "bg-blue-100" : date.getDay() === 0 || date.getDay() === 6 ? "bg-gray-100" : ""}`}
                    ></div>
                  ))}
                </div>
                {headerDates.some((date) => isSameDay(date, today)) && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                    style={{
                      left: `${(differenceInDays(today, dataInizioFiltro) / totalDaysInView) * 100}%`,
                      display: today >= dataInizioFiltro && today <= dataFineFiltro ? "block" : "none",
                    }}
                  ></div>
                )}
                <div className="absolute inset-0 p-2">
                  {elementiGantt.length > 0 ? (
                    elementiGantt.map((item, index) => {
                      const { left, width, marginTop } = calculateItemPosition(item, index)
                      if (Number.parseFloat(width) <= 0) return null

                      return (
                        <Popover key={`${item.tipo}-${item.id}`}>
                          <PopoverTrigger asChild>
                            <div
                              className="absolute h-10 rounded cursor-pointer flex flex-col justify-center px-2 text-gray-700 text-xs"
                              style={{
                                left,
                                width,
                                top: `${index * 48 + 10}px`,
                                backgroundColor: item.colore,
                                marginTop,
                                overflow: "hidden",
                              }}
                            >
                              <div className="flex items-center font-medium">
                                <div
                                  className="w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0"
                                  style={{ backgroundColor: getPriorityColor(item.priorita) }}
                                ></div>
                                <span className="truncate">{item.titolo}</span>
                              </div>
                              <div className="text-[10px] text-gray-600 truncate pl-[14px]">
                                {format(item.dataInizio, "dd/MM")} - {format(item.dataFine, "dd/MM")}
                              </div>
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
                                  <span className="font-medium">Inizio Effettivo:</span>{" "}
                                  {format(item.dataInizio, "dd/MM/yyyy HH:mm")}
                                </div>
                                <div>
                                  <span className="font-medium">Fine Effettiva:</span>{" "}
                                  {format(item.dataFine, "dd/MM/yyyy HH:mm")}
                                </div>
                                {item.priorita && (
                                  <div>
                                    <span className="font-medium">Priorità:</span> {item.priorita}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Tipo:</span>
                                  <span>{item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</span>
                                  <Link
                                    href={`/data-explorer/${getTableNameFromType(item.tipo)}/${item.id}`}
                                    className="text-blue-500 hover:text-blue-700"
                                    title="Vedi dettagli"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
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
            <div className="p-2 text-xs text-center text-muted-foreground md:hidden">
              Scorri orizzontalmente per visualizzare l'intero diagramma
            </div>
          </div>

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
        <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="mt-2">
          {showDebug ? "Nascondi Debug" : "Mostra Debug"}
        </Button>
        {showDebug && (
          <div className="mt-4 p-2 border rounded bg-gray-50 text-xs font-mono overflow-auto max-h-60">
            <div className="flex justify-between mb-2">
              <h4 className="font-bold">Debug Panel</h4>
              <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-700">
                Chiudi
              </button>
            </div>
            <div className="space-y-1">
              <p>
                Filtro: {dataInizioFiltro?.toLocaleString()} - {dataFineFiltro?.toLocaleString()}
              </p>
              <p>Altezza Gantt Body: {ganttBodyHeight}px</p>
              <p>Elementi Gantt totali (dopo filtro visivo): {elementiGantt.length}</p>
              <p>
                Attività: {attivita.length}, Progetti: {progetti.length}, Appuntamenti: {appuntamenti.length}
              </p>
              <pre>{debugInfo}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
