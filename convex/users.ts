import { internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { getAdminEmails, isAdminEmail } from '../lib/admin-access'

// Get the current viewer's profile + role
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const approvalStatus = user?.approvalStatus ?? (user ? (user.approved === true ? 'approved' : 'pending') : 'pending')
    const resolvedEmail = identity.email ?? user?.userEmail
    const role = isAdminEmail(resolvedEmail) || user?.role === 'admin' ? 'admin' : 'staff'

    return {
      name: user?.userName ?? identity.name ?? null,
      email: identity.email ?? user?.userEmail ?? null,
      phone: user?.phone ?? null,
      github: user?.github ?? null,
      tokenIdentifier: identity.tokenIdentifier,
      role,
      approved: approvalStatus === 'approved',
      approvalStatus,
    }
  },
})

// Register a newly created Clerk user with a role
// Called from the employee creation flow after Clerk account is made
export const registerEmployee = mutation({
  args: {
    tokenIdentifier: v.string(),
    userName: v.union(v.string(), v.null()),
    userEmail: v.union(v.string(), v.null()),
    role: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const resolvedRole = isAdminEmail(args.userEmail) || args.role === 'admin' ? 'admin' : 'staff'
    const existing = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', args.tokenIdentifier)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { role: resolvedRole })
      return existing._id
    }
    return await ctx.db.insert('users', {
      userTokenIdentifier: args.tokenIdentifier,
      userName: args.userName,
      userEmail: args.userEmail,
      role: resolvedRole,
      approved: false,
      approvalStatus: 'pending',
    })
  },
})

// Upsert the current logged-in user (call on first login to ensure record exists)
export const upsertUser = mutation({
  args: {
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const resolvedRole = isAdminEmail(identity.email) || args.role === 'admin' ? 'admin' : 'staff'

    const existing = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (existing) {
      const patch: Record<string, unknown> = {
        role: resolvedRole,
      }
      if (existing.approvalStatus == null && existing.approved !== true) {
        patch.approved = false
        patch.approvalStatus = 'pending'
      }
      await ctx.db.patch(existing._id, patch)
      return existing._id
    }

    return await ctx.db.insert('users', {
      userTokenIdentifier: identity.tokenIdentifier,
      userName: identity.name ?? null,
      userEmail: identity.email ?? null,
      role: resolvedRole,
      approved: false,
      approvalStatus: 'pending',
    })
  },
})

// Admin only: update another user's role
export const setUserRole = mutation({
  args: {
    userTokenIdentifier: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const caller = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const callerEmail = identity.email ?? caller?.userEmail
    if (caller?.role !== 'admin' && !isAdminEmail(callerEmail)) throw new Error('Only admins can change roles.')

    const target = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', args.userTokenIdentifier)
      )
      .unique()

    if (!target) throw new Error('User not found.')
    await ctx.db.patch(target._id, { role: args.role })
  },
})

// Admin only: update another user's role by email
export const setUserRoleByEmail = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const caller = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const callerEmail = identity.email ?? caller?.userEmail
    if (caller?.role !== 'admin' && !isAdminEmail(callerEmail)) throw new Error('Only admins can change roles.')

    const target = await ctx.db
      .query('users')
      .withIndex('by_userEmail', (q) => q.eq('userEmail', args.email))
      .unique()

    if (!target) throw new Error('User not found.')

    await ctx.db.patch(target._id, { role: args.role })
  },
})

export const getAllUserRoles = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('users').collect()
    return all.map((u) => ({ email: u.userEmail, role: u.role }))
  },
})

// Set current user as admin (for development/testing)
export const setSelfAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user) {
      await ctx.db.insert('users', {
        userTokenIdentifier: identity.tokenIdentifier,
        userName: identity.name ?? null,
        userEmail: identity.email ?? null,
        role: 'admin',
        approved: false,
        approvalStatus: 'pending',
      })
    } else {
      await ctx.db.patch(user._id, {
        role: 'admin',
        approved: false,
        approvalStatus: 'pending',
      })
    }
  },
})

// Sync a newly signed-up user: creates users + employees records if missing
export const syncNewUser = mutation({
  args: {
    role: v.optional(v.union(v.literal("admin"), v.literal("staff"))),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const desiredEmail = identity.email ?? args.email ?? null
    const resolvedRole = isAdminEmail(desiredEmail) || args.role === 'admin' ? 'admin' : 'staff'

    // Upsert users table
    const existingUser: Doc<'users'> | null = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const isNewUser = !existingUser

    let createdUserId: Id<'users'> | null = null

    if (!existingUser) {
      createdUserId = await ctx.db.insert('users', {
        userTokenIdentifier: identity.tokenIdentifier,
        userName: identity.name ?? null,
        userEmail: desiredEmail ?? null,
        role: resolvedRole,
        approved: false,
        approvalStatus: 'pending',
      })
    } else {
      const patch: Record<string, unknown> = {}
      if (identity.name && existingUser.userName !== identity.name) {
        patch.userName = identity.name
      }
      if (existingUser.userEmail !== desiredEmail) {
        patch.userEmail = desiredEmail
      }
      if (existingUser.role !== resolvedRole) {
        patch.role = resolvedRole
      }
      if (existingUser.approvalStatus == null && existingUser.approved !== true) {
        patch.approved = false
        patch.approvalStatus = 'pending'
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existingUser._id, patch)
      }
    }

    const existingApprovalStatus = existingUser?.approvalStatus ?? null
    const existingAccessRequestSentAt = existingUser?.accessRequestSentAt ?? null
    const needsAccessRequest =
      Boolean(desiredEmail) &&
      existingAccessRequestSentAt == null &&
      (isNewUser || existingApprovalStatus !== 'approved')

    if (needsAccessRequest) {
      const admins = (await ctx.db.query('users').collect()).filter(
        (user) => user.role === 'admin' && !!user.userEmail,
      )
      const adminRecipients = new Set<string>(getAdminEmails())
      for (const admin of admins) {
        if (admin.userEmail) adminRecipients.add(admin.userEmail.toLowerCase())
      }

      if (desiredEmail) {
        const requestedAt = new Date().toISOString()
        const requestedUserName = identity.name ?? desiredEmail ?? 'New user'

        for (const adminEmail of adminRecipients) {
          ctx.scheduler.runAfter(0, internal.employeeMail.sendAccessRequestEmail, {
            adminEmail,
            userName: requestedUserName,
            userEmail: desiredEmail,
            requestedAt,
            appUrl: process.env.NEXT_PUBLIC_APP_URL,
          })
        }

        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            accessRequestSentAt: Date.now(),
          })
        } else if (createdUserId) {
          await ctx.db.patch(createdUserId, {
            accessRequestSentAt: Date.now(),
          })
        }
      }
    }

    if (desiredEmail) {
      const existingEmployeeByCurrentEmail = await ctx.db
        .query('employees')
        .withIndex('by_email', (q) => q.eq('email', desiredEmail))
        .unique()

      const existingEmployeeByOldEmail =
        existingUser?.userEmail && existingUser.userEmail !== desiredEmail
          ? await ctx.db
              .query('employees')
              .withIndex('by_email', (q) => q.eq('email', existingUser.userEmail!))
              .unique()
          : null

      const existingEmployee = existingEmployeeByCurrentEmail ?? existingEmployeeByOldEmail

      if (!existingEmployee) {
        const name = identity.name || desiredEmail
        await ctx.db.insert('employees', {
          fullName: name,
          email: desiredEmail,
          phone: '',
          department: '',
          position: 'Staff',
          employeeId: `EMP-${Date.now()}`,
          joiningDate: new Date().toISOString().slice(0, 10),
          employeeType: 'Employee',
          createdAt: Date.now(),
        })
      } else {
        const employeePatch: { fullName?: string; email?: string } = {}
        if (identity.name && existingEmployee.fullName !== identity.name) {
          employeePatch.fullName = identity.name
        }
        if (existingEmployee.email !== desiredEmail) {
          employeePatch.email = desiredEmail
        }
        if (Object.keys(employeePatch).length > 0) {
          await ctx.db.patch(existingEmployee._id, employeePatch)
        }
      }
    }

    return true
  },
})

// Update the current user's editable profile fields.
export const updateCurrentProfile = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    github: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const sanitizePhone = (value: string) => {
      const digits = value.replace(/\D/g, '')
      return digits.length > 10 ? digits.slice(-10) : digits
    }
    const phone = sanitizePhone(args.phone)

    let user = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!user && identity.email) {
      user = await ctx.db
        .query('users')
        .withIndex('by_userEmail', (q) => q.eq('userEmail', identity.email!))
        .unique()
    }

    const patch: {
      userTokenIdentifier?: string
      userName: string
      userEmail?: string
      phone?: string
      github?: string
    } = {
      userName: args.fullName,
    }

    if (!user) {
      patch.userTokenIdentifier = identity.tokenIdentifier
      if (identity.email) patch.userEmail = identity.email
    } else if (user.userTokenIdentifier !== identity.tokenIdentifier) {
      patch.userTokenIdentifier = identity.tokenIdentifier
    }

    if (phone) patch.phone = phone
    if (args.github.trim()) patch.github = args.github.trim()

    if (user) {
      await ctx.db.patch(user._id, patch)
    } else {
      await ctx.db.insert('users', {
        userTokenIdentifier: identity.tokenIdentifier,
        userName: args.fullName,
        userEmail: identity.email ?? null,
        phone: phone || undefined,
        github: args.github.trim() || undefined,
        role: 'staff',
        approved: false,
        approvalStatus: 'pending',
      })
    }

    if (identity.email) {
      const employee = await ctx.db
        .query('employees')
        .withIndex('by_email', (q) => q.eq('email', identity.email!))
        .unique()

      if (employee) {
        await ctx.db.patch(employee._id, {
          fullName: args.fullName,
          phone,
        })
      }
    }

    return {
      fullName: args.fullName,
      phone,
      github: args.github,
    }
  },
})

export const getAllUserEmails = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('users').collect()
    return all.map((u) => u.userEmail).filter(Boolean) as string[]
  },
})

export const listPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const caller = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const resolvedEmail = identity.email ?? caller?.userEmail
    if (caller?.role !== 'admin' && !isAdminEmail(resolvedEmail)) return []

    const pending = (await ctx.db.query('users').collect())
      .filter(
        (user) =>
          user.approved !== true &&
          (user.approvalStatus === 'pending' || user.approvalStatus == null)
      )
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 25)

    return pending.map((user) => ({
      email: user.userEmail,
      name: user.userName,
      tokenIdentifier: user.userTokenIdentifier,
      approved: user.approved ?? false,
      approvalStatus: user.approvalStatus ?? 'pending',
      role: user.role,
    }))
  },
})

export const approveUserByTokenIdentifier = mutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const caller = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const callerEmail = identity.email ?? caller?.userEmail
    if (caller?.role !== 'admin' && !isAdminEmail(callerEmail)) throw new Error('Only admins can approve users.')

    const target = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) => q.eq('userTokenIdentifier', args.tokenIdentifier))
      .unique()

    if (!target) throw new Error('User not found.')

    await ctx.db.patch(target._id, { approved: true, approvalStatus: 'approved' })
  },
})

export const declineUserByTokenIdentifier = mutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const caller = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    const callerEmail = identity.email ?? caller?.userEmail
    if (caller?.role !== 'admin' && !isAdminEmail(callerEmail)) throw new Error('Only admins can decline users.')

    const target = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) => q.eq('userTokenIdentifier', args.tokenIdentifier))
      .unique()

    if (!target) throw new Error('User not found.')

    await ctx.db.patch(target._id, { approved: false, approvalStatus: 'declined' })
  },
})
