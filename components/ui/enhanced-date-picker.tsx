"use client"

import * as React from "react"
import { Calendar } from "./calendar"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"

export interface EnhancedDatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  showTimeSelect?: boolean
  dateFormat?: string
}

const EnhancedDatePicker = React.forwardRef<HTMLDivElement, EnhancedDatePickerProps>(
  ({ className, date, onChange, placeholder, showTimeSelect = false, dateFormat = "dd/MM/yyyy", ...props }, ref) => {
    const [selected, setSelected] = React.useState<Date | undefined>(date)

    React.useEffect(() => {
      setSelected(date)
    }, [date])

    const handleSelect = (newDate: Date | undefined) => {
      setSelected(newDate)
      onChange?.(newDate)
    }

    return (
      <div className={cn("grid gap-2", className)} ref={ref}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-[280px] justify-start text-left font-normal", !selected && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selected ? formatDateDisplay(selected) : <span>{placeholder ? placeholder : "Pick a date"}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              showTimeSelect={showTimeSelect}
              date={selected}
              onSelect={handleSelect}
              dateFormat={dateFormat}
              className="rounded-md border shadow-sm"
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)
EnhancedDatePicker.displayName = "EnhancedDatePicker"

export { EnhancedDatePicker }

function formatDateDisplay(date: Date | undefined): string {
  if (!date) return "Seleziona una data"
  return date.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}
