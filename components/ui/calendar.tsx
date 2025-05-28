"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { it } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={it}
      classNames={{
        months: cn("flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0"),
        month: cn("space-y-4"),
        caption: cn("flex justify-center pt-1 relative items-center"),
        caption_label: cn("text-sm font-medium mx-2"),
        nav: cn("flex items-center"),
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
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
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
