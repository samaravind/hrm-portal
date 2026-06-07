declare module "react-day-picker" {
  import type * as React from "react"

  export type DropdownProps = {
    className?: string
    options?: Array<{
      value: string | number
      label: string
      disabled?: boolean
    }>
    value?: string | number | null
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
    disabled?: boolean
    "aria-label"?: string
    name?: string
  }

  export const DayPicker: React.ComponentType<any>
  export function useDayPicker(): {
    dayPickerProps: {
      startMonth?: Date
      endMonth?: Date
      reverseYears?: boolean
    }
    goToMonth: (month: Date) => void
    previousMonth?: Date | null
    nextMonth?: Date | null
  }
}
