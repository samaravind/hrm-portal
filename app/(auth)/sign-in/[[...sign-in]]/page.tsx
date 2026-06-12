'use client'

import { SignIn } from '@clerk/nextjs'
import { AuthArtwork } from '@/components/auth/auth-artwork'
import { Sparkles } from 'lucide-react'

export default function SignInPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(180deg,#eef6ff_0%,#f7fbff_46%,#ffffff_100%)] px-4 py-4 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.08),_transparent_24%)]" />

      <div className="relative mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-[minmax(20rem,0.95fr)_minmax(24rem,1.05fr)] md:gap-7 xl:grid-cols-[minmax(24rem,1fr)_minmax(30rem,1fr)] xl:gap-10">
        <div className="hidden min-w-0 md:block">
          <AuthArtwork />
        </div>

        <div className="flex min-w-0 items-center justify-center py-1 sm:py-3 md:py-6">
          <div className="w-full min-w-0 max-w-[32rem] space-y-4 sm:space-y-6">
            <div className="mx-auto max-w-[28rem] text-center md:max-w-none">
              <div className="mx-auto mb-2.5 flex size-9 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/80 text-[10px] font-bold text-sky-700 shadow-sm sm:mb-3 sm:size-11 sm:text-sm">
                HR
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-700 sm:text-[11px] sm:tracking-[0.2em]">
                <Sparkles className="size-3.5" />
                SAM MARKET
              </div>
              <h1 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">
                Sign in to continue
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 sm:text-[0.98rem]">
                Use your Clerk account to access the dashboard, then we will route you based on approval status.
              </p>
            </div>

            <div className="flex w-full justify-center">
              <SignIn
                signUpUrl="/sign-up"
                signUpFallbackRedirectUrl="/pending-approval"
                fallbackRedirectUrl="/"
                appearance={{
                  variables: {
                    colorPrimary: '#0284c7',
                    colorBackground: '#ffffff',
                    colorText: '#0f172a',
                    colorInputBackground: '#f8fafc',
                    colorInputText: '#0f172a',
                    borderRadius: '1rem',
                  },
                  elements: {
                    rootBox: 'flex w-full min-w-0 justify-center [&>*]:min-w-0 [&>*]:w-full',
                    card:
                      'mx-auto !w-full !min-w-0 !max-w-full border border-sky-100/80 bg-white/95 shadow-[0_24px_70px_rgba(14,165,233,0.12)] backdrop-blur-xl sm:!max-w-[31.5rem] [&_*]:min-w-0 [&_*]:max-w-full',
                    header: 'hidden',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    formRoot: 'p-0',
                    formFieldLabel: 'text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1.5',
                    formFieldInput:
                      'w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100',
                    formFieldInputShowPasswordButton: 'text-slate-400 hover:text-slate-600',
                    socialButtonsBlockButton:
                      'rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50',
                    socialButtonsBlockButtonText: 'text-slate-700',
                    socialButtonsBlockButtonArrow: 'hidden',
                    dividerRow: 'text-slate-400',
                    formButtonPrimary:
                      'w-full rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(2,132,199,0.25)] transition hover:-translate-y-0.5 hover:from-sky-500 hover:via-cyan-500 hover:to-sky-600',
                    formFieldAction: 'text-xs text-sky-600 hover:text-sky-500',
                    backLink: 'text-sm font-medium text-sky-700 hover:text-sky-600',
                    formResendCodeLink: 'text-sky-600 hover:text-sky-500',
                    identityPreview: 'rounded-2xl border border-slate-200 bg-slate-50 p-3',
                    identityPreviewText: 'text-slate-800',
                    identityPreviewEditButton: 'text-sky-600 hover:text-sky-500',
                    alert: 'rounded-2xl border border-rose-200 bg-rose-50 text-rose-700',
                    alertText: 'text-rose-700',
                    alertIcon: 'text-rose-500',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
