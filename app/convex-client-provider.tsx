"use client";

import { ReactNode, useMemo } from "react";

import { ConvexReactClient } from "convex/react";

import {
  ConvexProviderWithClerk,
} from "convex/react-clerk";

import { useAuth } from "@clerk/nextjs";

function createConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) return null
  return new ConvexReactClient(convexUrl)
}

export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convex = useMemo(() => createConvexClient(), [])

  if (!convex) {
    return <>{children}</>
  }

  return (
    <ConvexProviderWithClerk
      client={convex}
      useAuth={useAuth}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}
