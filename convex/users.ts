import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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

    return {
      name: identity.name ?? null,
      email: identity.email ?? null,
      tokenIdentifier: identity.tokenIdentifier,
      role: user?.role === 'admin' ? 'admin' : 'staff',
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
    const existing = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', args.tokenIdentifier)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role })
      return existing._id
    }
    return await ctx.db.insert('users', {
      userTokenIdentifier: args.tokenIdentifier,
      userName: args.userName,
      userEmail: args.userEmail,
      role: args.role,
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

    const existing = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (existing) {
      if (args.role) {
        await ctx.db.patch(existing._id, { role: args.role })
      }
      return existing._id
    }

    return await ctx.db.insert('users', {
      userTokenIdentifier: identity.tokenIdentifier,
      userName: identity.name ?? null,
      userEmail: identity.email ?? null,
      role: args.role ?? 'staff',
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

    if (caller?.role !== 'admin') throw new Error('Only admins can change roles.')

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

    if (caller?.role !== 'admin') throw new Error('Only admins can change roles.')

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
      })
    } else {
      await ctx.db.patch(user._id, { role: 'admin' })
    }
  },
})

// Sync a newly signed-up user: creates users + employees records if missing
export const syncNewUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity || !identity.email) return null

    // Upsert users table
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_userTokenIdentifier', (q) =>
        q.eq('userTokenIdentifier', identity.tokenIdentifier)
      )
      .unique()

    if (!existingUser) {
      await ctx.db.insert('users', {
        userTokenIdentifier: identity.tokenIdentifier,
        userName: identity.name ?? null,
        userEmail: identity.email ?? null,
        role: 'staff',
      })
    }

    // Upsert employees table by email
    const existingEmployee = await ctx.db
      .query('employees')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .unique()

    if (!existingEmployee) {
      const name = identity.name || identity.email
      await ctx.db.insert('employees', {
        fullName: name,
        email: identity.email,
        phone: '',
        department: '',
        position: 'Staff',
        employeeId: `EMP-${Date.now()}`,
        joiningDate: new Date().toISOString().slice(0, 10),
        employeeType: 'Employee',
        createdAt: Date.now(),
      })
    }

    return true
  },
})

export const getAllUserEmails = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('users').collect()
    return all.map((u) => u.userEmail).filter(Boolean) as string[]
  },
})
