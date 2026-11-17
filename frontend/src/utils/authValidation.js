/**
 * Client-side auth form validation.
 *
 * These checks exist to give fast, specific feedback. The backend/Supabase
 * remains the authority on credentials, unique emails and password policy.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value) {
  const email = (value || '').trim()
  if (!email) return 'Email is required'
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address'
  return null
}

export function validateFullName(value) {
  const name = (value || '').trim()
  if (!name) return 'Full name is required'
  if (name.length < 2) return 'Full name must be at least 2 characters'
  return null
}

export function validatePassword(value) {
  const password = value || ''
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Za-z]/.test(password)) return 'Password must include a letter'
  if (!/[0-9]/.test(password)) return 'Password must include a number'
  return null
}

export function validatePasswordConfirmation(password, confirmation) {
  if ((password || '') !== (confirmation || '')) return 'Passwords do not match'
  return null
}

/**
 * Rough strength score from 0 (empty) to 4 (strong), used only for the meter.
 */
export function passwordStrength(value) {
  const password = value || ''
  if (!password) return 0

  let score = 1
  if (password.length >= 8) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1
  return Math.min(score, 4)
}
