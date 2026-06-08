'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ current, total, pageSize, onChange }: {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
      <p className="text-xs">
        Showing <span className="font-medium text-zinc-900 dark:text-white">{Math.min((current - 1) * pageSize + 1, total)}</span>
        {' '}&ndash;{' '}
        <span className="font-medium text-zinc-900 dark:text-white">{Math.min(current * pageSize, total)}</span>
        {' '}of{' '}
        <span className="font-medium text-zinc-900 dark:text-white">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-black dark:text-zinc-300 dark:hover:bg-white/5 cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`e${idx}`} className="px-1 text-xs text-zinc-400 dark:text-zinc-500">...</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page)}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                page === current
                  ? 'border border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black'
                  : 'border border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(current + 1)}
          disabled={current >= totalPages}
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-black dark:text-zinc-300 dark:hover:bg-white/5 cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
