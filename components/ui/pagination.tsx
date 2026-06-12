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
    <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-zinc-600 dark:border-white/10 dark:text-zinc-300">
      <p className="text-xs">
        Showing <span className="font-medium text-zinc-900 dark:text-white">{Math.min((current - 1) * pageSize + 1, total)}</span>
        {' '}&ndash;{' '}
        <span className="font-medium text-zinc-900 dark:text-white">{Math.min(current * pageSize, total)}</span>
        {' '}of{' '}
        <span className="font-medium text-zinc-900 dark:text-white">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-sky-400/50 dark:hover:bg-sky-400/10 dark:hover:text-white dark:focus-visible:ring-sky-500/60"
          aria-label="Previous page"
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
              className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500/60 ${
                page === current
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-sky-400/70 dark:bg-sky-400/20 dark:text-sky-100 dark:shadow-[0_0_0_1px_rgba(56,189,248,0.18)]'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-sky-400/50 dark:hover:bg-sky-400/10 dark:hover:text-white'
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === current ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(current + 1)}
          disabled={current >= totalPages}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-sky-400/50 dark:hover:bg-sky-400/10 dark:hover:text-white dark:focus-visible:ring-sky-500/60"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
