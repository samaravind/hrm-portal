import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_CONVEX_URL is not configured.' },
        { status: 500 }
      )
    }

    const convex = new ConvexHttpClient(convexUrl)
    const client = await clerkClient()

    let clerkDeleted = false
    let clerkMessage = 'User not found in Clerk, skipping.'

    const lookupRes = await client.users.getUserList({ emailAddress: [email] })
    if (lookupRes.data.length > 0) {
      const userId = lookupRes.data[0].id
      await client.users.deleteUser(userId)
      clerkDeleted = true
      clerkMessage = 'User deleted from Clerk.'
    }

    const convexResult = await convex.mutation(api.employees.removeByEmail, { email })

    return NextResponse.json({
      ok: true,
      clerkDeleted,
      clerkMessage,
      employeeDeleted: convexResult.deleted,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
