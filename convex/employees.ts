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
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { password, ...employeeData } = args
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
      phone: args.phone,
      employeeId: args.employeeId,
      joiningDate: args.joiningDate,
      department: args.department,
      position: args.position,
      password,
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
    phone: v.string(),
    department: v.string(),
    position: v.string(),
    employeeType: v.string(),
    salary: v.optional(v.number()),
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
