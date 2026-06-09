declare module 'recharts' {
  import type { ComponentType, ReactNode } from 'react'

  export const ResponsiveContainer: ComponentType<any>
  export const AreaChart: ComponentType<any>
  export const Area: ComponentType<any>
  export const BarChart: ComponentType<any>
  export const Bar: ComponentType<any>
  export const PieChart: ComponentType<any>
  export const Pie: ComponentType<any>
  export const ComposedChart: ComponentType<any>
  export const CartesianGrid: ComponentType<any>
  export const XAxis: ComponentType<any>
  export const YAxis: ComponentType<any>
  export const Tooltip: ComponentType<any>
  export const Cell: ComponentType<any>
  export const Legend: ComponentType<any>

  export type TooltipProps<TValue = number, TName = string> = {
    active?: boolean
    payload?: Array<{ value?: TValue; name?: TName; payload?: unknown }>
    label?: ReactNode
  }
}
