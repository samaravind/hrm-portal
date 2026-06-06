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
    <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
      <p className="text-xs text-zinc-500">
        Showing <span className="font-medium text-zinc-700">{Math.min((current - 1) * pageSize + 1, total)}</span>
        {' '}&ndash;{' '}
        <span className="font-medium text-zinc-700">{Math.min(current * pageSize, total)}</span>
        {' '}of{' '}
        <span className="font-medium text-zinc-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`e${idx}`} className="px-1 text-xs text-zinc-400">...</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page)}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                page === current
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
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
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
