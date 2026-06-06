'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <SignUp />
    </main>
  )
}
