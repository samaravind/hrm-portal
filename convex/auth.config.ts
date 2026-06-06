import type { AuthConfig } from 'convex/server'

// Keep this static so `convex dev` doesn't require a missing env var at startup.
const domain = 'https://touched-foxhound-58.clerk.accounts.dev'

export default {
  providers: [
    {
      domain,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig
