'use client'

import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { isAdminEmail } from '@/lib/admin-access'

export function AuthUserSync() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { isLoading: isConvexAuthLoading, isAuthenticated } = useConvexAuth()
  const syncNewUser = useMutation(api.users.syncNewUser)
  const lastSyncedUserKey = useRef<string | null>(null)
  const userId = user?.id ?? null
  const requestedEmail = user?.primaryEmailAddress?.emailAddress ?? null
  const requestedRole = isAdminEmail(requestedEmail) || user?.publicMetadata?.role === 'admin' ? 'admin' : 'staff'
  const syncKey = userId ? `${userId}:${requestedRole}:${requestedEmail ?? ''}` : null

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || isConvexAuthLoading || !isAuthenticated || !syncKey) {
      lastSyncedUserKey.current = null
      return
    }

    if (lastSyncedUserKey.current === syncKey) return

    let cancelled = false

    ;(async () => {
      try {
        await syncNewUser({ role: requestedRole, email: requestedEmail ?? undefined })
        if (!cancelled) {
          lastSyncedUserKey.current = syncKey
        }
      } catch (error) {
        console.error('Failed to sync signed-in user:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, isConvexAuthLoading, isAuthenticated, requestedEmail, requestedRole, syncKey, syncNewUser, userId])

  return null
}
