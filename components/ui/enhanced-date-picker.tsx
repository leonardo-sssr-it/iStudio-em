"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface DatePickerProps {
  /** Data selezionata */
  date?: Date
  /** Callback chiamato quando la data cambia */
  onDateChange: (date: Date | undefined) => void
  /** Formato della data (default: 'dd/MM/yyyy') */
  dateFormat?: string
  /** Localizzazione (default: 'it') */
  locale?: "it" | "en"
  /** Placeholder per l'input */
  placeholder?: string
  /** Classi CSS aggiuntive */
  className?: string
  /** Disabilita il componente */
  disabled?: boolean
  /** Date disabilitate */
  disabledDates?: Date[] | ((date: Date) => boolean)
  /** Data minima selezionabile */
  minDate?: Date
  /** Data massima selezionabile */
  maxDate?: Date
  /** Mostra l'input di testo per inserimento manuale */
  showInput?: boolean
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  dateFormat = "dd/MM/yyyy",
  locale = "it",
  placeholder = "Seleziona data",
  className,
  disabled = false,
  disabledDates,
  minDate,
  maxDate,
  showInput = false,
}: DatePickerProps) {
  // Stato locale per l'input di testo
  const [inputValue, setInputValue] = React.useState<string>(
    date ? format(date, dateFormat, { locale: locale === "it" ? it : undefined }) : "",
  )

  // Aggiorna l'input quando cambia la data
  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, dateFormat, { locale: locale === "it" ? it : undefined }))
    } else if (!date) {
      setInputValue("")
    }
  }, [date, dateFormat, locale])

  // Gestisce il cambio dell'input di testo
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)

      // Prova a parsare la data
      try {
        const parsedDate = parse(value, dateFormat, new Date(), { locale: locale === "it" ? it : undefined })
        if (isValid(parsedDate)) {
          onDateChange(parsedDate)
        }
      } catch (error) {
        // Ignora errori di parsing
      }
    },
    [dateFormat, locale, onDateChange],
  )

  // Gestisce la selezione dal calendario
  const handleCalendarSelect = React.useCallback(
    (selectedDate: Date | undefined) => {
      onDateChange(selectedDate)
      if (selectedDate && isValid(selectedDate)) {
        setInputValue(format(selectedDate, dateFormat, { locale: locale === "it" ? it : undefined }))
      } else {
        setInputValue("")
      }
    },
    [onDateChange, dateFormat, locale],
  )

  // Contenuto del pulsante
  const buttonContent = React.useMemo(
    () => (
      <>
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date && isValid(date) ? (
          format(date, dateFormat, { locale: locale === "it" ? it : undefined })
        ) : (
          <span>{placeholder}</span>
        )}
      </>
    ),
    [date, dateFormat, locale, placeholder],
  )

  return (
    <Popover>
      <div className={cn("flex flex-col space-y-2", className)}>
        {showInput && (
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full"
          />
        )}
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            {buttonContent}
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <EnhancedCalendar
          mode="single"
          selected={date}
          onSelect={handleCalendarSelect}
          disabled={disabledDates}
          defaultMonth={date}
          fromDate={minDate}
          toDate={maxDate}
          locale={locale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

EnhancedDatePicker.displayName = "EnhancedDatePicker"
