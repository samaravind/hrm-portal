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
            "w-full justify-start font-normal",
            "data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
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
