'use client'

import { SignIn } from '@clerk/nextjs'
import { AuthArtwork } from '@/components/auth/auth-artwork'

export default function SignInPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef6ff_0%,#f7fbff_46%,#ffffff_100%)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.08),_transparent_24%)]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-6 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <AuthArtwork />

        <section className="flex items-start lg:pt-6">
          <div className="w-full rounded-[40px] border border-white/80 bg-white/92 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-8">
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
                  rootBox: 'w-full',
                  card:
                    'w-full border border-sky-100/80 bg-white/95 shadow-[0_24px_70px_rgba(14,165,233,0.12)] backdrop-blur-xl',
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
        </section>
      </div>
    </main>
  )
}
