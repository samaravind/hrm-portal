import { v } from "convex/values"
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

type ViewerFallback = {
  viewerId?: string | null
  viewerName?: string | null
  viewerEmail?: string | null
}

type AttendanceSession = Doc<"attendanceSessions">
type EmployeeDoc = Doc<"employees">
type SalaryDoc = Doc<"salaries">

function createMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`
}

function getDateKeysForMonth(year: number, month: number) {
  const keys: string[] = []
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    keys.push(cursor.toISOString().slice(0, 10))
  }
  return keys
}

function getWorkingDaysInMonth(year: number, month: number) {
  let workingDays = 0
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = cursor.getUTCDay()
    if (day !== 0) workingDays += 1
  }
  return workingDays
}

async function getFinanceIdentity(
  ctx: QueryCtx | MutationCtx,
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

async function getAdminViewer(ctx: QueryCtx | MutationCtx, fallback?: ViewerFallback) {
  const identity = await getFinanceIdentity(ctx, fallback)
  const viewer = await ctx.db
    .query("users")
    .withIndex("by_userTokenIdentifier", (q) => q.eq("userTokenIdentifier", identity.tokenIdentifier))
    .unique()

  if (viewer?.role?.toLowerCase() !== "admin") {
    throw new Error("Only admins can access finance records.")
  }

  return { identity, viewer }
}

function calculateSalary(employee: EmployeeDoc, sessions: AttendanceSession[], year: number, month: number, now = Date.now()) {
  const workingDays = getWorkingDaysInMonth(year, month)
  const sessionByDate = new Map<string, AttendanceSession>()
  for (const session of sessions) {
    sessionByDate.set(session.dateKey, session)
  }

  const recordedSessions = Array.from(sessionByDate.values())
  const presentDays = recordedSessions.length
  const hoursWorked = recordedSessions.reduce((total, session) => {
    const end = session.punchOutAt ?? now
    return total + Math.max(end - session.punchInAt, 0)
  }, 0)

  const halfDays = recordedSessions.reduce((total, session) => {
    const end = session.punchOutAt ?? now
    const hours = Math.max(end - session.punchInAt, 0) / 3_600_000
    return total + (hours > 0 && hours < 4 ? 1 : 0)
  }, 0)

  const paidLeaveDays = 0
  const absentDays = Math.max(workingDays - presentDays - paidLeaveDays, 0)
  const basicSalary = employee.salary ?? 0
  const allowances = employee.allowances ?? 0
  const overtimeRatePerHour = employee.overtimeRatePerHour ?? 0
  const salaryType = employee.salaryType ?? "monthly"
  const fullDays = Math.max(presentDays - halfDays, 0)
  const payableDays = fullDays + halfDays * 0.5 + paidLeaveDays
  const expectedHours = fullDays * 8 + halfDays * 4 + paidLeaveDays * 8
  const overtimeHours = Math.max((hoursWorked / 3_600_000) - expectedHours, 0)
  const overtimePay = overtimeHours * overtimeRatePerHour
  const perDayRate = salaryType === "daily"
    ? basicSalary
    : workingDays > 0
      ? basicSalary / workingDays
      : basicSalary
  const baseSalary = salaryType === "daily"
    ? basicSalary * payableDays
    : basicSalary
  const deductions = halfDays * (perDayRate / 2)
  const absenceDeduction = salaryType === "daily" ? 0 : absentDays * perDayRate
  const bonus = 0
  const finalSalary = Math.max(baseSalary + allowances + bonus + overtimePay - deductions - absenceDeduction, 0)

  return {
    workingDays,
    presentDays,
    absentDays,
    halfDays,
    paidLeaveDays,
    overtimeHours,
    bonus,
    allowances,
    deductions,
    absenceDeduction,
    overtimePay,
    baseSalary,
    finalSalary,
    salaryType,
  }
}

async function upsertFinanceRecord(
  ctx: MutationCtx,
  args: {
    salaryId: Doc<"salaries">["_id"]
    employeeId: Doc<"employees">["_id"]
    employeeEmail: string
    monthKey: string
    recordType: "salary_generated" | "salary_paid" | "salary_adjustment"
    description: string
    amount: number
  },
) {
  const existing = await ctx.db
    .query("financeRecords")
    .withIndex("by_salaryId", (q) => q.eq("salaryId", args.salaryId))
    .collect()

  const current = existing.find((record) => record.recordType === args.recordType && record.monthKey === args.monthKey)
  if (current) {
    await ctx.db.patch(current._id, {
      description: args.description,
      amount: args.amount,
      updatedAt: Date.now(),
    })
    return current._id
  }

  return await ctx.db.insert("financeRecords", {
    salaryId: args.salaryId,
    employeeId: args.employeeId,
    employeeEmail: args.employeeEmail,
    monthKey: args.monthKey,
    recordType: args.recordType,
    description: args.description,
    amount: args.amount,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
}

export const syncMonthlySalaryRecords = mutation({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await getAdminViewer(ctx, args)
    const monthKey = createMonthKey(args.year, args.month)
    const employees = await ctx.db.query("employees").collect()
    const dateKeys = getDateKeysForMonth(args.year, args.month)

    const sessionsByEmail = new Map<string, AttendanceSession[]>()
    for (const dateKey of dateKeys) {
      const sessions = await ctx.db
        .query("attendanceSessions")
        .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
        .collect()

      for (const session of sessions) {
        const email = session.userEmail?.toLowerCase()
        if (!email) continue
        const list = sessionsByEmail.get(email) ?? []
        list.push(session)
        sessionsByEmail.set(email, list)
      }
    }

    const now = Date.now()
    const records: SalaryDoc[] = []

    for (const employee of employees) {
      const monthSessions = sessionsByEmail.get(employee.email.toLowerCase()) ?? []
      const calculation = calculateSalary(employee, monthSessions, args.year, args.month, now)
      const existing = await ctx.db
        .query("salaries")
        .withIndex("by_employeeId_and_monthKey", (q) =>
          q.eq("employeeId", employee._id).eq("monthKey", monthKey),
        )
        .unique()

      const salaryPayload = {
        employeeId: employee._id,
        employeeEmail: employee.email,
        employeeName: employee.fullName,
        employeeCode: employee.employeeId,
        monthKey,
        salaryType: calculation.salaryType as "monthly" | "daily",
        workingDays: calculation.workingDays,
        presentDays: calculation.presentDays,
        absentDays: calculation.absentDays,
        halfDays: calculation.halfDays,
        paidLeaveDays: calculation.paidLeaveDays,
        overtimeHours: calculation.overtimeHours,
        bonus: calculation.bonus,
        allowances: calculation.allowances,
        deductions: calculation.deductions,
        absenceDeduction: calculation.absenceDeduction,
        overtimePay: calculation.overtimePay,
        baseSalary: calculation.baseSalary,
        finalSalary: calculation.finalSalary,
        paymentStatus: existing?.paymentStatus ?? "pending",
        paymentDate: existing?.paymentDate ?? null,
        paidBy: existing?.paidBy ?? null,
        updatedAt: now,
      }

      const notes = existing?.notes

      let salaryId: Doc<"salaries">["_id"]
      if (existing) {
        await ctx.db.patch(existing._id, salaryPayload)
        salaryId = existing._id
      } else {
        salaryId = await ctx.db.insert("salaries", {
          ...salaryPayload,
          ...(notes ? { notes } : {}),
          createdAt: now,
        })
      }

      await upsertFinanceRecord(ctx, {
        salaryId,
        employeeId: employee._id,
        employeeEmail: employee.email,
        monthKey,
        recordType: "salary_generated",
        description: `Monthly salary generated for ${employee.fullName} (${monthKey})`,
        amount: calculation.finalSalary,
      })

      const storedSalary = await ctx.db.get(salaryId)
      if (storedSalary) {
        records.push(storedSalary)
      }
    }

    return {
      monthKey,
      syncedBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
      totalEmployees: employees.length,
      totalRecords: records.length,
    }
  },
})

export const getFinanceDashboard = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
    year: v.number(),
    month: v.number(),
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("all"), v.literal("paid"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    await getAdminViewer(ctx, args)

    const monthKey = createMonthKey(args.year, args.month)
    const employees = await ctx.db.query("employees").collect()
    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_monthKey", (q) => q.eq("monthKey", monthKey))
      .collect()

    const payments = await ctx.db
      .query("salaryPayments")
      .withIndex("by_monthKey", (q) => q.eq("monthKey", monthKey))
      .collect()

    const paymentBySalaryId = new Map<string, typeof payments[number]>()
    for (const payment of payments) {
      paymentBySalaryId.set(payment.salaryId, payment)
    }

    const employeeById = new Map<string, EmployeeDoc>()
    const employeeByEmail = new Map<string, EmployeeDoc>()
    for (const employee of employees) {
      employeeById.set(employee._id, employee)
      employeeByEmail.set(employee.email.toLowerCase(), employee)
    }

    const search = args.search?.trim().toLowerCase() ?? ""
    const status = args.status ?? "all"

    const records = salaries
      .map((salary) => {
        const employee = employeeById.get(salary.employeeId) ?? employeeByEmail.get(salary.employeeEmail.toLowerCase()) ?? null
        const payment = paymentBySalaryId.get(salary._id) ?? null
        const attendanceSummary = `${salary.presentDays}/${salary.workingDays} present`

        return {
          salary,
          employee,
          payment,
          attendanceSummary,
        }
      })
      .filter((row) => {
        if (status !== "all" && row.salary.paymentStatus !== status) return false
        if (!search) return true
        const haystack = [
          row.employee?.fullName ?? row.salary.employeeName,
          row.employee?.email ?? row.salary.employeeEmail,
          row.employee?.employeeId ?? row.salary.employeeCode,
          row.employee?.department ?? "",
          row.salary.monthKey,
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(search)
      })
      .sort((a, b) => b.salary.createdAt - a.salary.createdAt)

    const summary = salaries.reduce(
      (acc, salary) => {
        acc.totalPayroll += salary.finalSalary
        acc.paidPayroll += salary.paymentStatus === "paid" ? salary.finalSalary : 0
        acc.pendingPayroll += salary.paymentStatus === "pending" ? salary.finalSalary : 0
        acc.paidCount += salary.paymentStatus === "paid" ? 1 : 0
        acc.pendingCount += salary.paymentStatus === "pending" ? 1 : 0
        return acc
      },
      {
        totalPayroll: 0,
        paidPayroll: 0,
        pendingPayroll: 0,
        paidCount: 0,
        pendingCount: 0,
      },
    )

    return {
      monthKey,
      monthLabel: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(args.year, args.month - 1, 1))),
      totalEmployees: employees.length,
      totalRecords: salaries.length,
      records,
      summary,
    }
  },
})

export const getEmployeeSalaryHistory = query({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    await getAdminViewer(ctx, args)

    const employee = await ctx.db.get(args.employeeId)
    if (!employee) {
      return {
        employee: null,
        records: [],
      }
    }

    const records = await ctx.db
      .query("salaries")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect()

    const payments = await ctx.db
      .query("salaryPayments")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect()

    const paymentByMonth = new Map<string, typeof payments[number]>()
    for (const payment of payments) {
      paymentByMonth.set(payment.monthKey, payment)
    }

    return {
      employee,
      records: records
        .map((salary) => ({
          salary,
          payment: paymentByMonth.get(salary.monthKey) ?? null,
        }))
        .sort((a, b) => b.salary.createdAt - a.salary.createdAt),
    }
  },
})

export const markSalaryAsPaid = mutation({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
    salaryId: v.id("salaries"),
    paymentMethod: v.string(),
    transactionReference: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await getAdminViewer(ctx, args)
    const salary = await ctx.db.get(args.salaryId)
    if (!salary) {
      throw new Error("Salary record not found.")
    }

    const now = Date.now()
    await ctx.db.patch(args.salaryId, {
      paymentStatus: "paid",
      paymentDate: now,
      paidBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
      ...(args.note ? { notes: args.note } : salary.notes ? { notes: salary.notes } : {}),
      updatedAt: now,
    })

    const existingPayment = await ctx.db
      .query("salaryPayments")
      .withIndex("by_salaryId", (q) => q.eq("salaryId", args.salaryId))
      .collect()

    const currentPayment = existingPayment[0] ?? null
      if (currentPayment) {
        await ctx.db.patch(currentPayment._id, {
          amount: salary.finalSalary,
          paymentMethod: args.paymentMethod,
          ...(args.transactionReference ? { transactionReference: args.transactionReference } : {}),
          ...(args.note ? { note: args.note } : {}),
          paidAt: now,
          paidBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
        })
      } else {
        await ctx.db.insert("salaryPayments", {
          salaryId: args.salaryId,
          employeeId: salary.employeeId,
          employeeEmail: salary.employeeEmail,
          monthKey: salary.monthKey,
          amount: salary.finalSalary,
          paymentMethod: args.paymentMethod,
          ...(args.transactionReference ? { transactionReference: args.transactionReference } : {}),
          paidAt: now,
          paidBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
          ...(args.note ? { note: args.note } : {}),
          createdAt: now,
        })
      }

    await upsertFinanceRecord(ctx, {
      salaryId: args.salaryId,
      employeeId: salary.employeeId,
      employeeEmail: salary.employeeEmail,
      monthKey: salary.monthKey,
      recordType: "salary_paid",
      description: `Salary paid for ${salary.employeeName} (${salary.monthKey})`,
      amount: salary.finalSalary,
    })

    return await ctx.db.get(args.salaryId)
  },
})

export const setSalaryPaymentStatus = mutation({
  args: {
    viewerId: v.optional(v.union(v.string(), v.null())),
    viewerName: v.optional(v.union(v.string(), v.null())),
    viewerEmail: v.optional(v.union(v.string(), v.null())),
    salaryId: v.id("salaries"),
    status: v.union(v.literal("paid"), v.literal("pending")),
    paymentMethod: v.optional(v.string()),
    transactionReference: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await getAdminViewer(ctx, args)
    const salary = await ctx.db.get(args.salaryId)
    if (!salary) {
      throw new Error("Salary record not found.")
    }

    const now = Date.now()
    if (args.status === "paid") {
      await ctx.db.patch(args.salaryId, {
        paymentStatus: "paid",
        paymentDate: now,
        paidBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
        ...(args.note ? { notes: args.note } : salary.notes ? { notes: salary.notes } : {}),
        updatedAt: now,
      })

      const existingPayment = await ctx.db
        .query("salaryPayments")
        .withIndex("by_salaryId", (q) => q.eq("salaryId", args.salaryId))
        .collect()

      const currentPayment = existingPayment[0] ?? null
      if (currentPayment) {
        await ctx.db.patch(currentPayment._id, {
          amount: salary.finalSalary,
          paymentMethod: args.paymentMethod ?? currentPayment.paymentMethod,
          ...(args.transactionReference ? { transactionReference: args.transactionReference } : {}),
          ...(args.note ? { note: args.note } : {}),
          paidAt: now,
          paidBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
        })
      } else {
        await ctx.db.insert("salaryPayments", {
          salaryId: args.salaryId,
          employeeId: salary.employeeId,
          employeeEmail: salary.employeeEmail,
          monthKey: salary.monthKey,
          amount: salary.finalSalary,
          paymentMethod: args.paymentMethod ?? "bank-transfer",
          ...(args.transactionReference ? { transactionReference: args.transactionReference } : {}),
          paidAt: now,
          paidBy: identity.email ?? identity.name ?? identity.tokenIdentifier,
          ...(args.note ? { note: args.note } : {}),
          createdAt: now,
        })
      }

      await upsertFinanceRecord(ctx, {
        salaryId: args.salaryId,
        employeeId: salary.employeeId,
        employeeEmail: salary.employeeEmail,
        monthKey: salary.monthKey,
        recordType: "salary_paid",
        description: `Salary paid for ${salary.employeeName} (${salary.monthKey})`,
        amount: salary.finalSalary,
      })

      return await ctx.db.get(args.salaryId)
    }

    const existingPayments = await ctx.db
      .query("salaryPayments")
      .withIndex("by_salaryId", (q) => q.eq("salaryId", args.salaryId))
      .collect()

    for (const payment of existingPayments) {
      await ctx.db.delete(payment._id)
    }

    await ctx.db.patch(args.salaryId, {
      paymentStatus: "pending",
      paymentDate: null,
      paidBy: null,
      ...(args.note ? { notes: args.note } : salary.notes ? { notes: salary.notes } : {}),
      updatedAt: now,
    })

    await upsertFinanceRecord(ctx, {
      salaryId: args.salaryId,
      employeeId: salary.employeeId,
      employeeEmail: salary.employeeEmail,
      monthKey: salary.monthKey,
      recordType: "salary_adjustment",
      description: `Salary reverted to pending for ${salary.employeeName} (${salary.monthKey})`,
      amount: salary.finalSalary,
    })

    return await ctx.db.get(args.salaryId)
  },
})
