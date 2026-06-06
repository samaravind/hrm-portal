import { NextRequest, NextResponse } from 'next/server'
import { getPasswordStrength } from '@/lib/password'

export async function POST(req: NextRequest) {
  try {
    const { employees } = await req.json()

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'No employees provided.' }, { status: 400 })
    }

    const CLERK_API = 'https://api.clerk.com/v1'
    const headers = {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }

    const results: { email: string; success: boolean; tokenIdentifier?: string; error?: string }[] = []

    for (const emp of employees) {
      const { fullName, email, password, dateOfBirth, role } = emp

      if (!fullName || !email) {
        results.push({ email: email || 'unknown', success: false, error: 'Missing fullName or email' })
        continue
      }

      try {
        if (password) {
          const strength = getPasswordStrength(password)
          if (!strength.isStrong) {
            results.push({ email, success: false, error: strength.message })
            continue
          }
        }
        const nameParts = fullName.trim().split(' ')
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || ''

        const lookupRes = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(email)}`, { headers })
        const lookupData = await lookupRes.json()

        if (lookupRes.ok && lookupData?.data?.length > 0) {
          const existingUser = lookupData.data[0]
          await fetch(`${CLERK_API}/users/${existingUser.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ public_metadata: { ...(existingUser.public_metadata ?? {}), role } }),
          })

          results.push({
            email,
            success: true,
            tokenIdentifier: `https://touched-foxhound-58.clerk.accounts.dev|${existingUser.id}`,
          })
        } else {
          const createBody: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            email_address: [email],
            public_metadata: { role },
            skip_password_checks: true,
            skip_password_requirement: !password,
          }
          if (password) createBody.password = password
          if (dateOfBirth) createBody.date_of_birth = dateOfBirth

          const createRes = await fetch(`${CLERK_API}/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify(createBody),
          })
          const createData = await createRes.json()

          if (!createRes.ok) {
            const msg = createData?.errors?.[0]?.long_message ?? createData?.errors?.[0]?.message ?? 'Clerk create failed'
            results.push({ email, success: false, error: msg })
          } else {
            results.push({
              email,
              success: true,
              tokenIdentifier: `https://touched-foxhound-58.clerk.accounts.dev|${createData.id}`,
            })
          }
        }
      } catch (err) {
        results.push({ email, success: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
