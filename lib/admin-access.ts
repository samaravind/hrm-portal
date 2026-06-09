const DEFAULT_ADMIN_EMAILS = [
  'raviteenu.svv@gmail.com',
]

export function getAdminEmails() {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.trim()

  if (!raw) {
    return DEFAULT_ADMIN_EMAILS
  }

  const configuredEmails = raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configuredEmails.length > 0 ? configuredEmails : DEFAULT_ADMIN_EMAILS
}

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null
}

export function isAdminEmail(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return false

  return getAdminEmails().includes(normalizedEmail)
}
