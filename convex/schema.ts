import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
  userTokenIdentifier: v.string(),

  userName: v.union(v.string(), v.null()),

  userEmail: v.union(v.string(), v.null()),

  phone: v.optional(v.string()),

  github: v.optional(v.string()),

  approved: v.optional(v.boolean()),

  approvalStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("declined")
  )),

  accessRequestSentAt: v.optional(v.number()),

  dob: v.optional(v.string()),

  role: v.union(
    v.literal("admin"),
    v.literal("staff")
  ),
}).index("by_userTokenIdentifier", ["userTokenIdentifier"])
  .index("by_userEmail", ["userEmail"])
  .index("by_approved", ["approved"])
  .index("by_approvalStatus", ["approvalStatus"]),

  attendanceSessions: defineTable({
    userTokenIdentifier: v.string(),
    userName: v.union(v.string(), v.null()),
    userEmail: v.union(v.string(), v.null()),
    dateKey: v.string(),
    punchInAt: v.number(),
    punchOutAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userTokenIdentifier_and_dateKey", ["userTokenIdentifier", "dateKey"])
    .index("by_dateKey", ["dateKey"])
    .index("by_userEmail", ["userEmail"]),

  employees: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    department: v.string(),
    position: v.string(),
    employeeId: v.string(),
    joiningDate: v.string(),
    employeeType: v.string(),
    salary: v.optional(v.number()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
    appUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_employeeId", ["employeeId"]),
})
