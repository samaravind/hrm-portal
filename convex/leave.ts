import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

type ViewerFallback = {
  viewerId?: string | null
  viewerName?: string | null
  viewerEmail?: string | null
}

const leaveDocumentValidator = v.union(
  v.string(),
  v.object({
    name: v.string(),
    storageId: v.id("_storage"),
    contentType: v.optional(v.union(v.string(), v.null())),
    size: v.optional(v.number()),
  }),
)

async function getLeaveIdentity(
  ctx: {
    auth: {
      getUserIdentity: () => Promise<{
        tokenIdentifier: string
        name?: string | null
        email?: string | null
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

  if (fallback?.viewerId) {
    return {
      tokenIdentifier: "https://touched-foxhound-58.clerk.accounts.dev|" + fallback.viewerId,
      name: fallback.viewerName ?? null,
      email: fallback.viewerEmail ?? null,
    }
  }

  throw new Error("Not authenticated. Please sign in.")
}

export const getMyLeaveRequests = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await getLeaveIdentity(ctx, args)

    const requests = await ctx.db
      .query("leaveRequests")
      .withIndex("by_userTokenIdentifier_and_createdAt", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .take(100)

    return requests
  },
})

export const listPendingLeaveRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (viewer?.role !== "admin") return []

    const pending = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "submitted"))
      .order("desc")
      .take(50)

    return pending
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    return await ctx.storage.generateUploadUrl()
  },
})

export const getLeaveDocumentUrl = query({
  args: {
    requestId: v.id("leaveRequests"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const request = await ctx.db.get(args.requestId)
    if (!request) return null

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    const canView = request.userTokenIdentifier === identity.tokenIdentifier || viewer?.role === "admin"
    if (!canView) return null

    const hasDocument = request.documents.some((document) => {
      return typeof document !== "string" && document.storageId === args.storageId
    })
    if (!hasDocument) return null

    return await ctx.storage.getUrl(args.storageId)
  },
})

export const createLeaveRequest = mutation({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
    leaveType: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    durationType: v.optional(v.union(
      v.literal("fullDay"),
      v.literal("halfDay"),
      v.literal("periodWise"),
    )),
    halfDay: v.boolean(),
    periodWise: v.boolean(),
    partialDate: v.optional(v.union(v.string(), v.null())),
    session: v.optional(v.union(v.literal("AM"), v.literal("PM"), v.null())),
    selectedPeriod: v.optional(v.union(v.string(), v.null())),
    reason: v.string(),
    documents: v.array(leaveDocumentValidator),
  },
  handler: async (ctx, args) => {
    const identity = await getLeaveIdentity(ctx, args)
    const durationType =
      args.durationType ?? (args.halfDay ? "halfDay" : args.periodWise ? "periodWise" : "fullDay")

    if (!args.leaveType.trim()) throw new Error("Please select a leave type.")
    if (durationType === "halfDay") {
      if (!args.partialDate?.trim()) throw new Error("Please select a partial date.")
      if (!args.session) throw new Error("Please select AM or PM session.")
    } else {
      if (!args.startDate.trim()) throw new Error("Please select a start date.")
      if (!args.endDate.trim()) throw new Error("Please select an end date.")
    }
    if (durationType === "periodWise" && !args.selectedPeriod?.trim()) {
      throw new Error("Please select a period.")
    }
    if (!args.reason.trim()) throw new Error("Please add a reason for leave.")
    const startDate = durationType === "halfDay" ? args.partialDate!.trim() : args.startDate
    const endDate = durationType === "halfDay" ? args.partialDate!.trim() : args.endDate

    const now = Date.now()
    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    const requestId = await ctx.db.insert("leaveRequests", {
      userTokenIdentifier: identity.tokenIdentifier,
      userName: viewer?.userName ?? identity.name,
      userEmail: viewer?.userEmail ?? identity.email,
      leaveType: args.leaveType.trim(),
      startDate,
      endDate,
      durationType,
      halfDay: durationType === "halfDay",
      periodWise: durationType === "periodWise",
      partialDate: durationType === "halfDay" ? args.partialDate!.trim() : null,
      session: durationType === "halfDay" ? args.session! : null,
      selectedPeriod: durationType === "periodWise" ? args.selectedPeriod!.trim() : null,
      reason: args.reason.trim(),
      documents: args.documents,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(requestId)
  },
})

export const approveLeaveRequest = mutation({
  args: {
    requestId: v.id("leaveRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (viewer?.role !== "admin") throw new Error("Only admins can approve leave requests.")

    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Leave request not found.")

    await ctx.db.patch(args.requestId, {
      status: "approved",
      updatedAt: Date.now(),
    })
  },
})

export const declineLeaveRequest = mutation({
  args: {
    requestId: v.id("leaveRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const viewer = await ctx.db
      .query("users")
      .withIndex("by_userTokenIdentifier", (q) =>
        q.eq("userTokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (viewer?.role !== "admin") throw new Error("Only admins can decline leave requests.")

    const request = await ctx.db.get(args.requestId)
    if (!request) throw new Error("Leave request not found.")

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      updatedAt: Date.now(),
    })
  },
})
