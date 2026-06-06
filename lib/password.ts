type PasswordRule = {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'at least 8 characters', test: (password) => password.length >= 8 },
  { label: 'one uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { label: 'one lowercase letter', test: (password) => /[a-z]/.test(password) },
  { label: 'one number', test: (password) => /\d/.test(password) },
  { label: 'one special character', test: (password) => /[^A-Za-z0-9]/.test(password) },
]

export type PasswordStrength = {
  label: 'Weak' | 'Strong'
  score: number
  total: number
  isStrong: boolean
  message: string
  criteria: Array<PasswordRule & { met: boolean }>
}

export function getPasswordStrength(password: string): PasswordStrength {
  const criteria = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }))

  const score = criteria.filter((criterion) => criterion.met).length
  const isStrong = score === PASSWORD_RULES.length
  const unmet = criteria.filter((criterion) => !criterion.met).map((criterion) => criterion.label)

  return {
    label: isStrong ? 'Strong' : 'Weak',
    score,
    total: PASSWORD_RULES.length,
    isStrong,
    message: isStrong
      ? 'Strong password.'
      : `Weak password. Add ${unmet.join(', ')}.`,
    criteria,
  }
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordStrength(password).isStrong
}
