import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { email, block } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const client = await clerkClient()
    const users = await client.users.getUserList({ emailAddress: [email] })
    if (users.data.length === 0) {
      return NextResponse.json({ error: 'No Clerk user found with that email.' }, { status: 404 })
    }

    const clerkUserId = users.data[0].id

    if (block) {
      await client.users.banUser(clerkUserId)
    } else {
      await client.users.unbanUser(clerkUserId)
    }

    return NextResponse.json({ success: true, blocked: block })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
