"use client"

import { CalendarIcon } from "lucide-react"
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
  return (
    <label
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-white transition focus-within:border-white/25",
        className,
      )}
    >
      <CalendarIcon className="size-4 shrink-0 text-white/45" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
      />
    </label>
  )
}

export { DatePicker }
