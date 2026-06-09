'use client'

import { KeyRound, LockKeyhole, Sparkles, UserRound } from 'lucide-react'

export function AuthArtwork() {
  return (
    <section className="relative min-h-[28rem] overflow-hidden rounded-[40px] border border-white/70 bg-[linear-gradient(180deg,#59dfdf_0%,#54cdf0_38%,#6ca8ee_62%,#d86cf0_86%,#ff5cd8_100%)] shadow-[0_32px_110px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:min-h-[34rem] lg:min-h-full">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.20)_18%,transparent_36%,rgba(255,255,255,0.12)_54%,transparent_72%)] opacity-60" />
      <div className="absolute left-8 top-7 size-16 rounded-full bg-white/35 blur-[0.5px]" />
      <div className="absolute left-14 top-11 size-12 rounded-full bg-white/25 blur-[0.5px]" />
      <div className="absolute right-0 top-14 size-20 rounded-full bg-white/28 blur-[0.5px]" />
      <div className="absolute right-7 bottom-10 size-24 rounded-full bg-white/26 blur-[0.5px]" />
      <div className="absolute left-6 bottom-4 size-20 rounded-full bg-white/24 blur-[0.5px]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.25),_transparent_70%)] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,0.18),transparent_18%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.12),transparent_14%),radial-gradient(circle_at_18%_84%,rgba(255,255,255,0.14),transparent_16%),radial-gradient(circle_at_86%_82%,rgba(255,255,255,0.12),transparent_16%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_52%,rgba(255,255,255,0.04)_100%)]" />

      <div className="relative flex min-h-[28rem] items-center justify-center px-6 py-10 sm:min-h-[34rem] sm:px-10 lg:min-h-full lg:px-12">
        <div className="w-full max-w-md rounded-[34px] border border-white/45 bg-white/26 p-6 shadow-[0_26px_80px_rgba(14,165,233,0.18)] backdrop-blur-2xl sm:p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/92 text-sky-600 shadow-[0_14px_40px_rgba(7,89,133,0.18)]">
            <UserRound className="size-8" />
          </div>

          <div className="mt-5 text-center">
            <p className="text-lg font-semibold text-slate-900 sm:text-xl">User Login</p>
            <p className="mt-1 text-sm text-slate-700/80">Secure access to your account</p>
          </div>

          <div className="mt-7 space-y-3">
            <div className="flex items-center gap-3 rounded-full border border-white/75 bg-white/95 px-4 py-3 shadow-sm">
              <KeyRound className="size-4 text-sky-600" />
              <span className="text-sm text-slate-400">Username</span>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/75 bg-white/95 px-4 py-3 shadow-sm">
              <LockKeyhole className="size-4 text-sky-600" />
              <span className="text-sm text-slate-400">Password</span>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-700/80">Forgot Password?</p>

          <button
            type="button"
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#0f6fb9_0%,#0a5da8_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(8,47,73,0.25)] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Login
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-700/85">
            <Sparkles className="size-3.5" />
            Premium Access
            <Sparkles className="size-3.5" />
          </div>
        </div>
      </div>
    </section>
  )
}
