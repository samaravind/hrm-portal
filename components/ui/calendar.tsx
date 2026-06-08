"use client"

import * as React from "react"
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type CalendarProps = {
  className?: string
  mode?: "single"
  selected?: Date
  onSelect?: (date?: Date) => void
  showOutsideDays?: boolean
  initialFocus?: boolean
}

export function Calendar({
  className,
  selected,
  onSelect,
  initialFocus,
}: CalendarProps) {
  void initialFocus
  const [month, setMonth] = React.useState<Date>(() =>
    selected ? startOfMonth(selected) : new Date()
  )

  const displayMonth = selected ? startOfMonth(selected) : month

  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  for (let current = gridStart; current <= gridEnd; current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)) {
    days.push(current)
  }

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 11 }, (_, index) => 1900 + index)
  const months = Array.from({ length: 12 }, (_, index) => {
    const d = new Date(2024, index, 1)
    return {
      label: format(d, "MMMM"),
      value: index,
    }
  })

  return (
    <div
      className={cn("rounded-2xl border border-black bg-[#FFFFFF] p-3 text-black dark:border-zinc-800 dark:bg-[#050505] dark:text-white", className)}
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMonth((current) => subMonths(current, 1))}
          className="inline-flex size-8 items-center justify-center rounded-full border border-black bg-[#FFFFFF] text-black transition hover:bg-black hover:text-white dark:border-zinc-800 dark:bg-[#050505] dark:text-white dark:hover:bg-[#111111] dark:hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <Select
            value={String(displayMonth.getMonth())}
            onValueChange={(value) => {
              setMonth(new Date(displayMonth.getFullYear(), Number(value), 1))
            }}
          >
            <SelectTrigger className="h-8 flex-1 border-black bg-[#FFFFFF] text-black dark:border-zinc-800 dark:bg-[#050505] dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-black bg-[#FFFFFF] text-black dark:border-zinc-800 dark:bg-[#050505] dark:text-white">
              {months.map((item) => (
                <SelectItem key={item.value} value={String(item.value)}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(displayMonth.getFullYear())}
            onValueChange={(value) => {
              setMonth(new Date(Number(value), displayMonth.getMonth(), 1))
            }}
          >
            <SelectTrigger className="h-8 w-24 border-black bg-[#FFFFFF] text-black dark:border-zinc-800 dark:bg-[#050505] dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-black bg-[#FFFFFF] text-black dark:border-zinc-800 dark:bg-[#050505] dark:text-white">
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          className="inline-flex size-8 items-center justify-center rounded-full border border-black bg-[#FFFFFF] text-black transition hover:bg-black hover:text-white dark:border-zinc-800 dark:bg-[#050505] dark:text-white dark:hover:bg-[#111111] dark:hover:text-white"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-black dark:text-zinc-500">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const outside = !isSameMonth(day, month)
          const active = selected ? isSameDay(day, selected) : false
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "h-9 rounded-full text-sm font-medium transition",
                outside ? "text-black/35 dark:text-zinc-700" : "text-black dark:text-zinc-200",
                active && "bg-black text-white hover:bg-black dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-900",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
