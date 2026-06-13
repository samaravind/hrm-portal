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

  leaveRequests: defineTable({
    userTokenIdentifier: v.string(),
    userName: v.union(v.string(), v.null()),
    userEmail: v.union(v.string(), v.null()),
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
    documents: v.array(v.union(
      v.string(),
      v.object({
        name: v.string(),
        storageId: v.id("_storage"),
        contentType: v.optional(v.union(v.string(), v.null())),
        size: v.optional(v.number()),
      }),
    )),
    status: v.union(
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userTokenIdentifier_and_createdAt", ["userTokenIdentifier", "createdAt"])
    .index("by_userEmail", ["userEmail"])
    .index("by_status", ["status"]),

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
    allowances: v.optional(v.number()),
    overtimeRatePerHour: v.optional(v.number()),
    salaryType: v.optional(v.union(v.literal("monthly"), v.literal("daily"))),
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    blocked: v.optional(v.boolean()),
    appUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_employeeId", ["employeeId"]),

  salaries: defineTable({
    employeeId: v.id("employees"),
    employeeEmail: v.string(),
    employeeName: v.string(),
    employeeCode: v.string(),
    monthKey: v.string(),
    salaryType: v.union(v.literal("monthly"), v.literal("daily")),
    workingDays: v.number(),
    presentDays: v.number(),
    absentDays: v.number(),
    halfDays: v.number(),
    paidLeaveDays: v.number(),
    overtimeHours: v.number(),
    bonus: v.number(),
    allowances: v.number(),
    deductions: v.number(),
    absenceDeduction: v.number(),
    overtimePay: v.number(),
    baseSalary: v.number(),
    finalSalary: v.number(),
    paymentStatus: v.union(v.literal("paid"), v.literal("pending")),
    paymentDate: v.optional(v.union(v.number(), v.null())),
    paidBy: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employeeId", ["employeeId"])
    .index("by_monthKey", ["monthKey"])
    .index("by_employeeId_and_monthKey", ["employeeId", "monthKey"])
    .index("by_paymentStatus_and_monthKey", ["paymentStatus", "monthKey"]),

  salaryPayments: defineTable({
    salaryId: v.id("salaries"),
    employeeId: v.id("employees"),
    employeeEmail: v.string(),
    monthKey: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
    transactionReference: v.optional(v.string()),
    paidAt: v.number(),
    paidBy: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_salaryId", ["salaryId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_monthKey", ["monthKey"])
    .index("by_employeeId_and_monthKey", ["employeeId", "monthKey"]),

  financeRecords: defineTable({
    salaryId: v.id("salaries"),
    employeeId: v.id("employees"),
    employeeEmail: v.string(),
    monthKey: v.string(),
    recordType: v.union(
      v.literal("salary_generated"),
      v.literal("salary_paid"),
      v.literal("salary_adjustment"),
    ),
    description: v.string(),
    amount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_salaryId", ["salaryId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_monthKey", ["monthKey"])
    .index("by_recordType_and_monthKey", ["recordType", "monthKey"]),
})
