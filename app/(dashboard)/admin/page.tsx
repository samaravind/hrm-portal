"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

export default function AdminPage() {
  const { user, isLoaded } = useUser();

  const viewerIdentity = isLoaded && user
    ? {
        viewerId: user.id,
        viewerName: user.fullName ?? user.username ?? null,
        viewerEmail: user.primaryEmailAddress?.emailAddress ?? null,
      }
    : null;

  const sessions = useQuery(
    api.attendance.listAllSessions,
    viewerIdentity ?? "skip"
  );

  if (!isLoaded) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="mt-6">
        {sessions?.map((session: Doc<"attendanceSessions">) => (
          <div key={session._id} className="border p-4 mb-2">
            <p>{session.userName}</p>
            <p>{session.userEmail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
