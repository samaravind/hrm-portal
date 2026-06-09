import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

type ViewerFallback = {
  viewerId?: string | null
  viewerName?: string | null
  viewerEmail?: string | null
}

async function getAttendanceIdentity(
  ctx: {
    auth: {
      getUserIdentity: () => Promise<{
        tokenIdentifier: string
        name?: string | null
        email?: string | null
        publicMetadata?: Record<string, unknown>
      } | null>
    }
  },
  fallback?: ViewerFallback,
) {
  const identity = await ctx.auth.getUserIdentity()
  if (identity) {
    return {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? fallback?.viewerName ?? null,
      email: identity.email ?? fallback?.viewerEmail ?? null,
    }
  }

  // Fallback to the Clerk user ID passed from the frontend when the JWT
  // hasn't propagated to ctx.auth yet (e.g. first render after sign-in).
  if (fallback?.viewerId) {
    return {
      tokenIdentifier: "https://touched-foxhound-58.clerk.accounts.dev|" + fallback.viewerId,
      name: fallback.viewerName ?? null,
      email: fallback.viewerEmail ?? null,
    }
  }

  throw new Error("Not authenticated. Please sign in.")
}

export const listAllSessions = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, args)

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    const rawIdentity = await ctx.auth.getUserIdentity()
    const metaRole = (rawIdentity?.publicMetadata as { role?: string } | undefined)?.role?.toLowerCase()
    const normalizedRole = viewer?.role?.toLowerCase()
    const isAdmin = normalizedRole === "admin" || metaRole === "admin"

    if (isAdmin) {
      const sessions = await ctx.db
        .query("attendanceSessions")
        .collect()

      return sessions.sort((a, b) => b.createdAt - a.createdAt)
    }

    const sessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userTokenIdentifier_and_dateKey", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .collect()

    return sessions.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getTodaySession = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, args)

    const dateKey = getDateKey()

    return await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userTokenIdentifier_and_dateKey", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier).eq("dateKey", dateKey),
      )
      .unique()
  },
})

export const punchIn = mutation({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, args)
    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()
    const resolvedName = viewer?.userName ?? identity.name
    const resolvedEmail = viewer?.userEmail ?? identity.email

    const now = Date.now()
    const dateKey = getDateKey()

    const existing = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userTokenIdentifier_and_dateKey", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier).eq("dateKey", dateKey),
      )
      .unique()

    if (existing) {
      if (existing.punchOutAt === null) {
        return existing
      }

      throw new Error("You have already punched out for today.")
    }

    const sessionId = await ctx.db.insert("attendanceSessions", {
      userTokenIdentifier: identity.tokenIdentifier,
      userName: resolvedName,
      userEmail: resolvedEmail,
      dateKey,
      punchInAt: now,
      punchOutAt: null,
      createdAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(sessionId)
  },
})

export const punchOut = mutation({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, args)

    const now = Date.now()
    const dateKey = getDateKey()

    const existing = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userTokenIdentifier_and_dateKey", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier).eq("dateKey", dateKey),
      )
      .unique()

    if (!existing) {
      throw new Error("Please punch in first.")
    }

    if (existing.punchOutAt !== null) {
      return existing
    }

    await ctx.db.patch(existing._id, {
      punchOutAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(existing._id)
  },
})

export const listAllSessionss = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("attendanceSessions")
      .collect()

    return sessions
  },
})

export const getMySessions = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, args)

    const sessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userTokenIdentifier_and_dateKey", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .collect()

    return sessions.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const adminPunchOutEmployee = mutation({
  args: {
    adminViewerId: v.optional(v.union(v.string(), v.null())),
    adminViewerName: v.optional(v.union(v.string(), v.null())),
    adminViewerEmail: v.optional(v.union(v.string(), v.null())),
    employeeEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, {
      viewerId: args.adminViewerId,
      viewerName: args.adminViewerName,
      viewerEmail: args.adminViewerEmail,
    })

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    const rawIdentity = await ctx.auth.getUserIdentity()
    const metaRole = (rawIdentity?.publicMetadata as { role?: string } | undefined)?.role?.toLowerCase()
    const normalizedRole = viewer?.role?.toLowerCase()
    const isAdmin = normalizedRole === "admin" || metaRole === "admin"

    if (!isAdmin) {
      throw new Error("Only admins can punch out other employees.")
    }

    const now = Date.now()
    const dateKey = getDateKey()

    const sessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userEmail", (q) => q.eq("userEmail", args.employeeEmail))
      .collect()

    const todaySession = sessions.find((s) => s.dateKey === dateKey && s.punchOutAt === null)

    if (!todaySession) {
      throw new Error("No active session found for this employee today.")
    }

    await ctx.db.patch(todaySession._id, {
      punchOutAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(todaySession._id)
  },
})

export const getEmployeeSessions = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_userEmail", (q) => q.eq("userEmail", args.email))
      .collect()

    return sessions.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getPunchSheet = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getAttendanceIdentity(ctx, args)

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    const dbRole = viewer?.role?.toLowerCase()
    const rawIdentity = await ctx.auth.getUserIdentity()
    const metaRole = (rawIdentity?.publicMetadata as { role?: string } | undefined)?.role?.toLowerCase()
    const isAdmin = dbRole === "admin" || metaRole === "admin"
    if (!isAdmin) return null

    const dateKey = getDateKey()
    const employees = await ctx.db.query("employees").collect()
    const allUsers = await ctx.db.query("users").collect()

    const userRoleByEmail = new Map<string, string>()
    const userByEmail = new Map<string, { tokenIdentifier: string; email: string | null; name: string | null }>()
    const userByToken = new Map<string, { tokenIdentifier: string; email: string | null; name: string | null }>()
    for (const u of allUsers) {
      const normalizedEmail = u.userEmail?.toLowerCase()
      const userSummary = {
        tokenIdentifier: u.userTokenIdentifier,
        email: u.userEmail,
        name: u.userName,
      }
      if (normalizedEmail) {
        userRoleByEmail.set(normalizedEmail, u.role)
        userByEmail.set(normalizedEmail, userSummary)
      }
      userByToken.set(u.userTokenIdentifier, userSummary)
    }

    const allTodaySessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
      .collect()

    const sessionsByToken = new Map<string, typeof allTodaySessions[number]>()
    const sessionsByEmail = new Map<string, typeof allTodaySessions[number]>()
    const seenEmails = new Set<string>()
    const viewerEmail = viewer?.userEmail?.toLowerCase() ?? identity.email?.toLowerCase() ?? null
    const result: {
      employee: {
        _id: string
        fullName: string
        email: string
        department: string
        position: string
        employeeId: string
        employeeType: string
        role: string
      }
      session: {
        _id: string
        punchInAt: number
        punchOutAt: number | null
        dateKey: string
      } | null
    }[] = []

    for (const s of allTodaySessions) {
      if (s.userTokenIdentifier) {
        sessionsByToken.set(s.userTokenIdentifier, s)
      }
      if (s.userEmail) {
        sessionsByEmail.set(s.userEmail.toLowerCase(), s)
      }
    }

    for (const emp of employees) {
      seenEmails.add(emp.email.toLowerCase())
      const normalizedEmail = emp.email.toLowerCase()
      const relatedUser = userByEmail.get(normalizedEmail)
      const session =
        (relatedUser ? sessionsByToken.get(relatedUser.tokenIdentifier) : null) ??
        sessionsByEmail.get(normalizedEmail) ??
        (viewerEmail && normalizedEmail === viewerEmail
          ? sessionsByToken.get(identity.tokenIdentifier) ?? null
          : null)
      result.push({
        employee: {
          _id: emp._id,
          fullName: emp.fullName,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          employeeId: emp.employeeId,
          employeeType: emp.employeeType,
          role: userRoleByEmail.get(emp.email.toLowerCase()) || "staff",
        },
        session: session
          ? {
              _id: session._id,
              punchInAt: session.punchInAt,
              punchOutAt: session.punchOutAt,
              dateKey: session.dateKey,
            }
          : null,
      })
    }

    for (const s of allTodaySessions) {
      const normalizedEmail = s.userEmail?.toLowerCase()
      const relatedUser = s.userTokenIdentifier ? userByToken.get(s.userTokenIdentifier) : null
      const displayEmail = normalizedEmail ?? relatedUser?.email?.toLowerCase() ?? null
      if (displayEmail && !seenEmails.has(displayEmail)) {
        seenEmails.add(displayEmail)
        result.push({
          employee: {
            _id: s._id,
            fullName: s.userName || relatedUser?.name || s.userEmail || "Unknown",
            email: s.userEmail ?? relatedUser?.email ?? "",
            department: "",
            position: "",
            employeeId: "",
            employeeType: "",
            role: userRoleByEmail.get(displayEmail) || "staff",
          },
          session: {
            _id: s._id,
            punchInAt: s.punchInAt,
            punchOutAt: s.punchOutAt,
            dateKey: s.dateKey,
          },
        })
      }
    }

    return result
  },
})
