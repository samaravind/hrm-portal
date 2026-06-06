import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { getPasswordStrength } from '@/lib/password'

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

type EmployeeInput = {
  fullName: string
  email: string
  password: string
  dateOfBirth?: string
  role: 'admin' | 'staff'
  phone: string
  department: string
  position: string
  employeeType: string
  salary?: number
  address?: string
}

export async function POST(req: NextRequest) {
  try {
    const { employees } = await req.json() as { employees: EmployeeInput[] }
    const appUrl = req.nextUrl.origin
    const convex = getConvexClient()

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'No employees provided.' }, { status: 400 })
    }

    const results: { email: string; clerkCreated: boolean; convexRegistered: boolean; convexRecordCreated: boolean; error?: string }[] = []

    for (const emp of employees) {
      const r: typeof results[number] = { email: emp.email, clerkCreated: false, convexRegistered: false, convexRecordCreated: false }

      try {
        // ── Step 1: Create Clerk user ──────────────────────────────
        if (emp.password) {
          const strength = getPasswordStrength(emp.password)
          if (!strength.isStrong) {
            r.error = strength.message
            results.push(r)
            continue
          }
        }
        const lookupRes = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(emp.email)}`, { headers: CLERK_HEADERS })
        const lookupData = await lookupRes.json()

        let clerkUserId: string

        if (lookupRes.ok && lookupData?.data?.length > 0) {
          const existing = lookupData.data[0]
          clerkUserId = existing.id
          await fetch(`${CLERK_API}/users/${clerkUserId}`, {
            method: 'PATCH',
            headers: CLERK_HEADERS,
            body: JSON.stringify({ public_metadata: { ...(existing.public_metadata ?? {}), role: emp.role } }),
          })
        } else {
          const nameParts = emp.fullName.trim().split(' ')
          const createBody: Record<string, unknown> = {
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' ') || '',
            email_address: [emp.email],
            public_metadata: { role: emp.role },
            skip_password_checks: true,
            skip_password_requirement: !emp.password,
          }
          if (emp.password) createBody.password = emp.password
          if (emp.dateOfBirth) createBody.date_of_birth = emp.dateOfBirth

          const createRes = await fetch(`${CLERK_API}/users`, {
            method: 'POST',
            headers: CLERK_HEADERS,
            body: JSON.stringify(createBody),
          })
          const createData = await createRes.json()
          if (!createRes.ok) {
            const msg = createData?.errors?.[0]?.long_message ?? createData?.errors?.[0]?.message ?? 'Clerk create failed'
            r.error = msg
            results.push(r)
            continue
          }
          clerkUserId = createData.id
        }

        r.clerkCreated = true
        const tokenIdentifier = `${CLERK_INSTANCE}|${clerkUserId}`

        // ── Step 2: Register user in Convex ────────────────────────
        try {
          await convex.mutation(api.users.registerEmployee, {
            tokenIdentifier,
            userName: emp.fullName,
            userEmail: emp.email,
            role: emp.role,
          })
          r.convexRegistered = true
        } catch {
          r.error = 'Convex user registration failed'
          results.push(r)
          continue
        }

        // ── Step 3: Create employee record in Convex ───────────────
        try {
          await convex.mutation(api.employees.create, {
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            department: emp.department,
            position: emp.position,
            employeeId: `EMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            joiningDate: new Date().toISOString().split('T')[0],
            employeeType: emp.employeeType,
            salary: emp.salary,
            dateOfBirth: emp.dateOfBirth,
            address: emp.address,
            password: emp.password,
            appUrl,
          })
          r.convexRecordCreated = true
        } catch {
          r.error = 'Employee record creation failed'
        }

        results.push(r)
      } catch (err) {
        r.error = err instanceof Error ? err.message : 'Unknown error'
        results.push(r)
      }
    }

    const clerkOk = results.filter((r) => r.clerkCreated).length
    const clerkFail = results.filter((r) => !r.clerkCreated).length

    return NextResponse.json({ results, clerkOk, clerkFail })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
