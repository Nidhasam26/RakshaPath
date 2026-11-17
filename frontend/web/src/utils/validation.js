/**
 * Shared validation utilities for RakshaPath.
 */

/**
 * Validates a phone number:
 * - Allows optional leading '+'
 * - Allows digits, spaces, and hyphens
 * - Must contain between 7 and 15 digits in total
 */
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false
  const trimmed = phone.trim()
  if (!trimmed) return false

  // Only allow +, digits, spaces, and hyphens
  if (!/^\+?[\d\s-]{7,25}$/.test(trimmed)) return false

  // Count raw digits
  const digits = (trimmed.match(/\d/g) || []).length
  return digits >= 7 && digits <= 15
}

/**
 * Validates that text is non-empty after trimming.
 */
export function isNonEmptyText(text) {
  return typeof text === 'string' && text.trim().length > 0
}
