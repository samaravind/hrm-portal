'use client'

import { useState } from 'react'
import { SignIn } from '@clerk/nextjs'
import { BrandMark } from '@/components/ui/brand-mark'

function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function generateSparkles() {
  const rng = createSeededRandom(42)
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${rng() * 100}%`,
    top: `${rng() * 100}%`,
    animationDelay: `${rng() * 5}s`,
    animationDuration: `${3 + rng() * 4}s`,
  }))
}

export default function SignInPage() {
  const [sparkles] = useState(generateSparkles)
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-950 px-6 py-16 overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="pointer-events-none absolute inset-0 animate-pulse opacity-30" style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.3) 0%, transparent 50%)',
        animation: 'pulse 8s ease-in-out infinite',
      }} />

      {/* Floating colored orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-transparent blur-3xl animate-[float_12s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-pink-500/20 via-rose-500/10 to-transparent blur-3xl animate-[float_15s_ease-in-out_infinite_reverse]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl animate-[float_10s_ease-in-out_infinite]" />

      {/* Sparkle dots */}
      <div className="pointer-events-none absolute inset-0">
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute h-1 w-1 rounded-full bg-white/30 animate-ping"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              animationDelay: sparkle.animationDelay,
              animationDuration: sparkle.animationDuration,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm animate-in fade-in duration-500">
        {/* Brand */}
        <div className="mb-8 text-center">
          <BrandMark className="mx-auto mb-4 size-16 shadow-lg shadow-black/30 animate-[float_6s_ease-in-out_infinite]" />
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
            SAM MARKET
          </h1>
          <p className="mt-1.5 text-sm text-violet-300/80">Sign in to your account</p>
        </div>

        <SignIn
          appearance={{
            baseTheme: undefined,
            elements: {
              rootBox: 'w-full',
              card: 'rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-2xl shadow-black/30 backdrop-blur-xl p-0',
              header: 'hidden',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              formRoot: 'p-0',
              formFieldLabel: 'text-xs font-semibold uppercase tracking-widest text-violet-300 mb-1.5',
              formFieldInput: 'w-full rounded-xl border border-white/10 bg-white/5 py-3 px-3.5 text-sm text-white placeholder:text-violet-300/40 transition-all focus:border-violet-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/30',
              formFieldInputShowPasswordButton: 'text-violet-300 hover:text-white',
              dividerRow: 'hidden',
              socialButtonsBlockButton: 'rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-violet-200 hover:bg-white/10 hover:text-white transition-all',
              socialButtonsBlockButtonText: 'text-violet-200',
              socialButtonsBlockButtonArrow: 'hidden',
              formButtonPrimary: 'w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 py-3 text-sm font-bold text-white transition-all hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 shadow-lg shadow-violet-600/30 hover:shadow-violet-500/40',
              footer: 'hidden',
              footerAction: 'hidden',
              formFieldAction: 'text-xs text-violet-400 hover:text-violet-200 transition',
              identityPreviewEditButton: 'text-violet-400 hover:text-white',
              identityPreviewText: 'text-violet-200',
              identityPreview: 'rounded-xl border border-white/10 bg-white/5 p-3',
              backLink: 'text-violet-400 hover:text-violet-200 text-sm',
              formResendCodeLink: 'text-violet-400 hover:text-violet-200 text-sm',
              formHeaderTitle: 'text-white text-lg font-semibold',
              formHeaderSubtitle: 'text-violet-300 text-sm',
              alert: 'rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm',
              alertText: 'text-rose-300',
              alertIcon: 'text-rose-300',
            },
          }}
        />
      </div>
    </main>
  )
}
