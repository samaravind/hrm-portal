import { NextRequest, NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    const sanitizedPhone = typeof phone === 'string' ? phone.replace(/\D/g, '').slice(0, 10) : ''

    if (!sanitizedPhone) {
      return NextResponse.json({ error: 'Phone is required.' }, { status: 400 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const client = await clerkClient()
    await client.users.updateUserMetadata(user.id, {
      unsafeMetadata: {
        ...(user.unsafeMetadata ?? {}),
        phone: sanitizedPhone,
      },
    })

    return NextResponse.json({ ok: true, phone: sanitizedPhone })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
