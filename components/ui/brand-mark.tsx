"use client"

import { cn } from '@/lib/utils'

function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-950 text-white",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[62%]"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 3.5L21 19H3L12 3.5Z" />
      </svg>
    </div>
  )
}

export { BrandMark }
