import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const CLERK_API = 'https://api.clerk.com/v1'
const CLERK_HEADERS = {
  Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
  'Content-Type': 'application/json',
}
const CLERK_INSTANCE = 'https://touched-foxhound-58.clerk.accounts.dev'

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not set.')
  }
  return new ConvexHttpClient(convexUrl)
}

export async function POST(req: NextRequest) {
  try {
    const { employees } = await req.json() as { employees: { fullName: string; email: string; role: 'admin' | 'staff' }[] }
    const convex = getConvexClient()

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ ok: 0, fail: 0, results: [] })
    }

    const results: { email: string; ok: boolean; error?: string }[] = []

    for (const emp of employees) {
      try {
        const lookupRes = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(emp.email)}`, {
          headers: CLERK_HEADERS,
        })
        const lookupData = await lookupRes.json()
        let clerkUserId: string

        if (lookupRes.ok && lookupData?.data?.length > 0) {
          clerkUserId = lookupData.data[0].id
          await fetch(`${CLERK_API}/users/${clerkUserId}`, {
            method: 'PATCH',
            headers: CLERK_HEADERS,
            body: JSON.stringify({
              public_metadata: { ...(lookupData.data[0].public_metadata ?? {}), role: emp.role },
            }),
          })
        } else {
          const nameParts = emp.fullName.trim().split(' ')
          const createRes = await fetch(`${CLERK_API}/users`, {
            method: 'POST',
            headers: CLERK_HEADERS,
            body: JSON.stringify({
              first_name: nameParts[0],
              last_name: nameParts.slice(1).join(' ') || '',
              email_address: [emp.email],
              password: 'Employee@123',
              public_metadata: { role: emp.role },
              skip_password_checks: true,
            }),
          })
          const createData = await createRes.json()
          if (!createRes.ok) {
            results.push({
              email: emp.email,
              ok: false,
              error: createData?.errors?.[0]?.long_message ?? createData?.errors?.[0]?.message ?? 'Clerk create failed',
            })
            continue
          }
          clerkUserId = createData.id
        }

        const tokenIdentifier = `${CLERK_INSTANCE}|${clerkUserId}`

        try {
          await convex.mutation(api.users.registerEmployee, {
            tokenIdentifier,
            userName: emp.fullName,
            userEmail: emp.email,
            role: emp.role,
          })
        } catch {
          // user record may already exist
        }

        results.push({ email: emp.email, ok: true })
      } catch (err) {
        results.push({ email: emp.email, ok: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    const ok = results.filter((r) => r.ok).length
    const fail = results.filter((r) => !r.ok).length
    return NextResponse.json({ ok, fail, results })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
