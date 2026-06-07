"use client"

import * as React from "react"
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [month, setMonth] = React.useState<Date>(selected ?? new Date())

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  for (let current = gridStart; current <= gridEnd; current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)) {
    days.push(current)
  }

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div
      className={cn("rounded-2xl border border-black bg-[#FFFFFF] p-3 text-black dark:border-white dark:bg-[#000000] dark:text-white", className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMonth((current) => subMonths(current, 1))}
          className="inline-flex size-8 items-center justify-center rounded-full border border-black bg-[#FFFFFF] text-black transition hover:bg-black hover:text-white dark:border-white dark:bg-[#000000] dark:text-white dark:hover:bg-white dark:hover:text-black"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-sm font-semibold tracking-tight text-black dark:text-white">
          {format(month, "MMMM yyyy")}
        </div>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          className="inline-flex size-8 items-center justify-center rounded-full border border-black bg-[#FFFFFF] text-black transition hover:bg-black hover:text-white dark:border-white dark:bg-[#000000] dark:text-white dark:hover:bg-white dark:hover:text-black"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-black dark:text-white">
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
                outside ? "text-black dark:text-white" : "text-black dark:text-white",
                active && "bg-black text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white",
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
