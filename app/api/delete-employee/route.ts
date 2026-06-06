import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const CLERK_API = 'https://api.clerk.com/v1'
    const headers = {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }

    // Look up user by email
    const lookupRes = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(email)}`, { headers })
    const lookupData = await lookupRes.json()

    if (!lookupRes.ok) {
      return NextResponse.json({ error: 'Failed to look up user in Clerk.' }, { status: lookupRes.status })
    }

    if (!lookupData?.data?.length) {
      return NextResponse.json({ message: 'User not found in Clerk, skipping.' })
    }

    // Delete the user
    const userId = lookupData.data[0].id
    const deleteRes = await fetch(`${CLERK_API}/users/${userId}`, {
      method: 'DELETE',
      headers,
    })

    if (!deleteRes.ok) {
      const errData = await deleteRes.json()
      const msg = errData?.errors?.[0]?.long_message ?? errData?.errors?.[0]?.message ?? 'Failed to delete user.'
      return NextResponse.json({ error: msg }, { status: deleteRes.status })
    }

    return NextResponse.json({ message: 'User deleted from Clerk.' })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
