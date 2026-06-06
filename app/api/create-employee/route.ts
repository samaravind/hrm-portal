import { NextRequest, NextResponse } from 'next/server'
import { getPasswordStrength } from '@/lib/password'

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, dateOfBirth, role, employeeId } = await req.json()

    if (!fullName || !email) {
      return NextResponse.json({ error: 'fullName and email are required.' }, { status: 400 })
    }
    if (password) {
      const strength = getPasswordStrength(password)
      if (!strength.isStrong) {
        return NextResponse.json({ error: strength.message }, { status: 400 })
      }
    }

    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    const CLERK_API = 'https://api.clerk.com/v1'
    const headers = {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }

    // Convert date to YYYY-MM-DD if needed
    let formattedDob = dateOfBirth
    if (formattedDob && /^\d{2}-\d{2}-\d{4}$/.test(formattedDob)) {
      const [d, m, y] = formattedDob.split('-')
      formattedDob = `${y}-${m}-${d}`
    }
    // Only pass date_of_birth to Clerk if it looks like a valid date
    const clerkDob = formattedDob && /^\d{4}-\d{2}-\d{2}$/.test(formattedDob) ? formattedDob : undefined
    const lookupRes = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(email)}`, { headers })
    const lookupData = await lookupRes.json()

    if (lookupRes.ok && lookupData?.data?.length > 0) {
      // User exists — update their metadata instead
      const existingUser = lookupData.data[0]
      const nextRole = role ?? existingUser.public_metadata?.role
      const updateRes = await fetch(`${CLERK_API}/users/${existingUser.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...(employeeId ? { external_id: employeeId } : {}),
          ...(nextRole ? { public_metadata: { ...(existingUser.public_metadata ?? {}), role: nextRole } } : {}),
        }),
      })

      const updateData = await updateRes.json()
      if (!updateRes.ok) {
        const msg = updateData?.errors?.[0]?.long_message ?? updateData?.errors?.[0]?.message ?? 'Failed to update user.'
        return NextResponse.json({ error: msg }, { status: updateRes.status })
      }

      return NextResponse.json({
        clerkUserId: existingUser.id,
        tokenIdentifier: `https://touched-foxhound-58.clerk.accounts.dev|${existingUser.id}`,
      })
    }

    // User doesn't exist — create new
    const createBody: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      email_address: [email],
      ...(employeeId ? { external_id: employeeId } : {}),
      ...(role ? { public_metadata: { role } } : {}),
      skip_password_checks: true,
      skip_password_requirement: !password,
    }
    if (password) createBody.password = password
    if (clerkDob) createBody.date_of_birth = clerkDob

    const res = await fetch(`${CLERK_API}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data?.errors?.[0]?.long_message ?? data?.errors?.[0]?.message ?? 'Failed to create user in Clerk.'
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    return NextResponse.json({
      clerkUserId: data.id,
      tokenIdentifier: `https://touched-foxhound-58.clerk.accounts.dev|${data.id}`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
