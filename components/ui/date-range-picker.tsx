"use client"

import * as React from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRangePickerProps {
  /** Range di date selezionato */
  dateRange: DateRange | undefined
  /** Callback chiamato quando il range cambia */
  onRangeChange: (range: DateRange | undefined) => void
  /** Numero di mesi da mostrare */
  numberOfMonths?: number
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
}

export function DateRangePicker({
  dateRange,
  onRangeChange,
  numberOfMonths = 2,
  dateFormat = "dd/MM/yyyy",
  locale = "it",
  placeholder = "Seleziona intervallo",
  className,
  disabled = false,
  disabledDates,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  // Gestisce la selezione dal calendario
  const handleRangeSelect = React.useCallback(
    (range: DateRange | undefined) => {
      onRangeChange(range)
    },
    [onRangeChange],
  )

  // Formatta il range di date per la visualizzazione
  const formattedDateRange = React.useMemo(() => {
    if (!dateRange?.from) {
      return placeholder
    }

    const localeObj = locale === "it" ? it : undefined

    if (dateRange.to) {
      return `${format(dateRange.from, dateFormat, { locale: localeObj })} - ${format(dateRange.to, dateFormat, { locale: localeObj })}`
    }

    return format(dateRange.from, dateFormat, { locale: localeObj })
  }, [dateRange, dateFormat, locale, placeholder])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedDateRange}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <EnhancedCalendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleRangeSelect}
            numberOfMonths={numberOfMonths}
            disabled={disabledDates}
            fromDate={minDate}
            toDate={maxDate}
            locale={locale}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

DateRangePicker.displayName = "DateRangePicker"
