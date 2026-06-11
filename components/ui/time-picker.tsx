"use client"

import * as React from "react"
import { Clock3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hour = Number(value.split(":")[0])
  const period = value && !Number.isNaN(hour) ? (hour >= 12 ? "PM" : "AM") : "AM"

  const openPicker = () => {
    inputRef.current?.showPicker?.()
    inputRef.current?.focus()
  }

  const handlePeriodChange = (nextPeriod: "AM" | "PM") => {
    const [hourPart = "09", minutePart = "00"] = value.split(":")
    let nextHour = Number(hourPart)

    if (Number.isNaN(nextHour)) {
      nextHour = nextPeriod === "AM" ? 9 : 13
    } else if (nextPeriod === "AM" && nextHour >= 12) {
      nextHour -= 12
    } else if (nextPeriod === "PM" && nextHour < 12) {
      nextHour += 12
    }

    onChange(`${String(nextHour).padStart(2, "0")}:${minutePart}`)
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "[color-scheme:light] h-16 rounded-3xl border-zinc-200 bg-white px-5 pr-32 text-base font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-50 focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-300/60 dark:[color-scheme:dark] dark:border-zinc-900 dark:bg-black dark:text-zinc-100 dark:shadow-none dark:hover:bg-zinc-950 dark:focus-visible:border-zinc-700 dark:focus-visible:ring-zinc-700/60 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
          className,
        )}
      />
      <Select value={period} onValueChange={(nextPeriod) => handlePeriodChange(nextPeriod as "AM" | "PM")}>
        <SelectTrigger
          aria-label="Select AM or PM"
          className="absolute right-11 top-1/2 h-8 w-[72px] -translate-y-1/2 border-0 bg-transparent px-1 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 shadow-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-300 dark:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-700"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-[80px]">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700"
        aria-label="Open time picker"
      >
        <Clock3 className="size-4" />
      </button>
    </div>
  )
}

export { TimePicker }
