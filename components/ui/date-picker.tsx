"use client"

import { format, parseISO } from "date-fns"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function DatePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => {
    if (!value) return undefined
    const parsed = parseISO(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const displayValue = selectedDate ? format(selectedDate, "dd-MM-yyyy") : "dd-mm-yyyy"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-2xl border border-black bg-[#FFFFFF] px-3.5 text-sm font-medium text-black transition hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 dark:border-white dark:bg-[#000000] dark:text-white dark:hover:bg-white dark:hover:text-black dark:focus-visible:ring-white",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarIcon className="size-4 shrink-0 text-black dark:text-white" />
            <span className={cn("truncate", !selectedDate && "text-black dark:text-white")}>
              {displayValue}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-black dark:text-white" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto rounded-2xl border border-black bg-[#FFFFFF] p-0 text-black dark:border-white dark:bg-[#000000] dark:text-white"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const day = String(date.getDate()).padStart(2, "0")
            onChange(`${year}-${month}-${day}`)
            setOpen(false)
          }}
          initialFocus
          className="bg-transparent p-3"
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
