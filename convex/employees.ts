import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const create = mutation({
  args: {
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
    password: v.optional(v.string()),
    appUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { password, appUrl, ...employeeData } = args
    const existing = await ctx.db
      .query("employees")
      .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
      .unique()

    if (existing) {
      throw new Error(`Employee ID "${args.employeeId}" is already taken.`)
    }

    const id = await ctx.db.insert("employees", {
      ...employeeData,
      createdAt: Date.now(),
    })

    ctx.scheduler.runAfter(0, internal.employeeMail.sendEmployeeOnboarding, {
      fullName: args.fullName,
      email: args.email,
      employeeId: args.employeeId,
      joiningDate: args.joiningDate,
      department: args.department,
      position: args.position,
      password,
      appUrl,
    })

    return await ctx.db.get(id)
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("employees").order("desc").collect()
  },
})

export const updateEmployee = mutation({
  args: {
    id: v.id("employees"),
    fullName: v.string(),
    email: v.string(),
    employeeId: v.string(),
    phone: v.string(),
    department: v.string(),
    position: v.string(),
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
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args
    await ctx.db.patch(id, data)
    return await ctx.db.get(id)
  },
})

export const toggleBlockEmployee = mutation({
  args: {
    id: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.id)
    if (!employee) throw new Error("Employee not found")
    const newBlocked = !employee.blocked
    await ctx.db.patch(args.id, { blocked: newBlocked })
    return { blocked: newBlocked, email: employee.email }
  },
})

export const remove = mutation({
  args: {
    id: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.id)
    if (!employee) throw new Error("Employee not found")
    await ctx.db.delete(args.id)
    return { deleted: true, email: employee.email }
  },
})

export const removeByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique()

    if (!employee) {
      return { deleted: false, email: args.email }
    }

    await ctx.db.delete(employee._id)
    return { deleted: true, email: employee.email }
  },
})

export const submitForm = mutation({
  args: {
    viewerId: v.string(),
    viewerName: v.union(v.string(), v.null()),
    viewerEmail: v.union(v.string(), v.null()),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    department: v.string(),
    role: v.string(),
    joiningDate: v.string(),
    address: v.string(),
    emergencyContact: v.string(),
    notes: v.string(),
    salary: v.optional(v.number()),
    allowances: v.optional(v.number()),
    overtimeRatePerHour: v.optional(v.number()),
    salaryType: v.optional(v.union(v.literal("monthly"), v.literal("daily"))),
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employeeId = `EMP-${Date.now()}`
    const id = await ctx.db.insert("employees", {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      department: args.department,
      position: args.role,
      employeeId,
      joiningDate: args.joiningDate,
      employeeType: "Employee",
      salary: args.salary,
      allowances: args.allowances,
      overtimeRatePerHour: args.overtimeRatePerHour,
      salaryType: args.salaryType,
      bankName: args.bankName,
      accountNumber: args.accountNumber,
      ifscCode: args.ifscCode,
      address: args.address || undefined,
      createdAt: Date.now(),
    })

    ctx.scheduler.runAfter(0, internal.employeeMail.sendWelcomeEmail, {
      fullName: args.fullName,
      email: args.email,
      employeeId,
      joiningDate: args.joiningDate,
    })

    return await ctx.db.get(id)
  },
})
