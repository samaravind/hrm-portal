"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

export function DashboardUserSync() {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useUser();
  const viewer = useQuery(api.users.viewer)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || viewer === undefined) return

    if (viewer?.approvalStatus === 'pending' && viewer?.role !== 'admin' && pathname !== '/pending-approval') {
      router.replace('/pending-approval')
      return
    }

    if (viewer?.approvalStatus === 'declined' && viewer?.role !== 'admin' && pathname !== '/denied') {
      router.replace('/denied')
      return
    }

    if (viewer?.role === 'admin' && pathname === '/pending-approval') {
      router.replace('/')
    }
  }, [isLoaded, isSignedIn, pathname, router, viewer])

  return null;
}
