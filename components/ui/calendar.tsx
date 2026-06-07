"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { cn } from "@/lib/utils"

type CalendarDropdownProps = {
  className?: string
  options?: {
    label: string
    value: string | number
    disabled?: boolean
  }[]
  value?: string | number | null
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  "aria-label"?: string
  name?: string
}

function CalendarDropdown({
  className,
  options,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  name,
}: CalendarDropdownProps) {
  const selectedValue = value == null ? "" : String(value)

  return (
    <Select
      value={selectedValue}
      onValueChange={(nextValue) => {
        const target = { value: nextValue, name } as HTMLSelectElement
        onChange?.({
          target,
          currentTarget: target,
        } as React.ChangeEvent<HTMLSelectElement>)
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn("h-8 w-fit min-w-0 border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="center" sideOffset={4}>
        {options?.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function clampMonth(date: Date, startMonth: Date, endMonth: Date) {
  const value = date.getTime()
  const start = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1).getTime()
  const end = new Date(endMonth.getFullYear(), endMonth.getMonth(), 1).getTime()
  if (value < start) return new Date(startMonth.getFullYear(), startMonth.getMonth(), 1)
  if (value > end) return new Date(endMonth.getFullYear(), endMonth.getMonth(), 1)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function CalendarMonthCaption({
  className,
  calendarMonth,
  displayIndex,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  calendarMonth: { date: Date }
  displayIndex?: number
}) {
  const { dayPickerProps, goToMonth, previousMonth, nextMonth } = useDayPicker()
  void displayIndex
  const currentMonth = calendarMonth.date
  const startMonth = dayPickerProps.startMonth ?? new Date(1900, 0, 1)
  const endMonth = dayPickerProps.endMonth ?? new Date(new Date().getFullYear(), 11, 1)

  const months = Array.from({ length: 12 }, (_, index) => ({
    label: new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(2026, index, 1)),
    value: index,
    disabled: false,
  }))

  const startYear = startMonth.getFullYear()
  const endYear = endMonth.getFullYear()
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => startYear + index,
  )
  if (dayPickerProps.reverseYears) {
    years.reverse()
  }

  const goTo = (monthIndex: number, year: number) => {
    goToMonth(clampMonth(new Date(year, monthIndex, 1), startMonth, endMonth))
  }

  const monthValue = String(currentMonth.getMonth())
  const yearValue = String(currentMonth.getFullYear())

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        aria-label="Previous month"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
        )}
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex flex-1 items-center justify-center gap-2">
        <CalendarDropdown
          aria-label="Month"
          name="month"
          value={monthValue}
          disabled={false}
          options={months}
          onChange={(event) => goTo(Number(event.target.value), currentMonth.getFullYear())}
        />
        <CalendarDropdown
          aria-label="Year"
          name="year"
          value={yearValue}
          disabled={false}
          options={years.map((year) => ({ label: String(year), value: year, disabled: false }))}
          onChange={(event) => goTo(currentMonth.getMonth(), Number(event.target.value))}
        />
      </div>

      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        aria-label="Next month"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-sm",
        month_caption: "w-full",
        caption_label: "text-sm font-semibold text-zinc-900",
        dropdowns: "flex flex-1 items-center justify-center gap-2",
        dropdown_root: "w-fit",
        dropdown: "w-fit",
        month_grid: "w-full border-collapse space-x-1",
        weekdays: "flex",
        weekday: "rounded-md w-8 font-normal text-[0.8rem] text-muted-foreground",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:rounded-md"
        ),
        day_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "active:not-aria-[haspopup]:translate-y-px",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
          "hover:bg-muted hover:text-foreground"
        ),
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground aria-selected:bg-muted/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      captionLayout="label"
      hideNavigation
      startMonth={new Date(1900, 0)}
      endMonth={new Date(new Date().getFullYear(), 11)}
      components={{
        Dropdown: CalendarDropdown,
        MonthCaption: CalendarMonthCaption,
      }}
      {...props}
    />
  )
}

export { Calendar }
