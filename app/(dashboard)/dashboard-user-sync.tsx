"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";

export function DashboardUserSync() {
  const { isLoaded, isSignedIn } = useUser();
  const syncNewUser = useMutation(api.users.syncNewUser);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncNewUser();
    }
  }, [isLoaded, isSignedIn, syncNewUser]);

  return null;
}
