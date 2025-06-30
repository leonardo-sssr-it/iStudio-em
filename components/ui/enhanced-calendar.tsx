"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerRangeProps, type DayPickerSingleProps } from "react-day-picker"
import { it, enUS, type Locale } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Tipo unione per supportare sia selezione singola che range
export type EnhancedCalendarProps =
  | (Omit<DayPickerSingleProps, "mode"> & { mode: "single"; onSelect?: (date: Date | undefined) => void })
  | (Omit<DayPickerRangeProps, "mode"> & {
      mode: "range"
      onSelect?: (range: { from: Date; to?: Date } | undefined) => void
    })

// Mappa delle localizzazioni supportate
const localeMap: Record<string, Locale> = {
  it,
  en: enUS,
}

// Componente principale
export function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  locale: localeProp = "it",
  onSelect,
  mode = "single",
  selected,
  disabled,
  ...props
}: EnhancedCalendarProps) {
  // Memo per la localizzazione
  const locale = React.useMemo(() => {
    return localeMap[localeProp] || localeMap.it
  }, [localeProp])

  // Memo per le classi CSS
  const calendarClassNames = React.useMemo(
    () => ({
      months: cn("flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0"),
      month: cn("space-y-4"),
      caption: cn("flex justify-center pt-1 relative items-center"),
      caption_label: cn("text-sm font-medium mx-2"),
      nav: cn("flex items-center"),
      nav_button: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
      nav_button_previous: cn("absolute left-1"),
      nav_button_next: cn("absolute right-1"),
      table: cn("w-full border-collapse space-y-1"),
      head_row: cn("flex"),
      head_cell: cn("text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center"),
      row: cn("flex w-full mt-2"),
      cell: cn(
        "h-9 w-9 text-center text-sm relative p-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      ),
      day: cn(
        buttonVariants({ variant: "ghost" }),
        "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
      ),
      day_selected: cn(
        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
      ),
      day_today: cn("bg-accent text-accent-foreground font-bold"),
      day_outside: cn("text-muted-foreground opacity-50"),
      day_disabled: cn("text-muted-foreground opacity-50"),
      day_range_middle: cn("aria-selected:bg-accent aria-selected:text-accent-foreground"),
      day_hidden: cn("invisible"),
      ...classNames,
    }),
    [classNames],
  )

  // Gestione della selezione con callback memoizzato
  const handleSelect = React.useCallback(
    (value: unknown) => {
      if (onSelect) {
        if (mode === "single" && (value === undefined || value instanceof Date)) {
          onSelect(value as Date | undefined)
        } else if (mode === "range" && (value === undefined || (typeof value === "object" && "from" in value))) {
          onSelect(value as { from: Date; to?: Date } | undefined)
        }
      }
    },
    [onSelect, mode],
  )

  // Componenti icona memoizzati
  const IconLeft = React.useCallback(() => <ChevronLeft className="h-4 w-4" />, [])
  const IconRight = React.useCallback(() => <ChevronRight className="h-4 w-4" />, [])

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={locale}
      mode={mode}
      selected={selected}
      onSelect={handleSelect}
      disabled={disabled}
      classNames={calendarClassNames}
      components={{
        IconLeft,
        IconRight,
      }}
      {...props}
    />
  )
}

EnhancedCalendar.displayName = "EnhancedCalendar"
