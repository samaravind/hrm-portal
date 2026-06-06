"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const date = value ? new Date(value + "T00:00:00") : undefined
  const [month, setMonth] = React.useState<Date>(date ?? new Date())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className={cn(
            "w-full justify-between gap-3 rounded-xl border-zinc-200 bg-white px-3 py-2.5 text-left font-normal text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
            "data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
            <span>{date ? format(date, "PPP") : "dd-mm-yyyy"}</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          key={value || "empty"}
          mode="single"
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={(d) => {
            if (d) {
              setMonth(d)
              onChange(format(d, "yyyy-MM-dd"))
              return
            }

            onChange("")
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
