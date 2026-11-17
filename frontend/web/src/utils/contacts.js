import { isValidPhone, isNonEmptyText } from './validation'

export const MAX_CONTACTS = 5

export function canAddContact(contacts) {
  return Array.isArray(contacts) && contacts.length < MAX_CONTACTS
}

export function validateContact({ name, relationship, phone, requirePhone = true }) {
  if (!isNonEmptyText(name)) {
    return { valid: false, error: 'Full name is required.' }
  }
  if (!isNonEmptyText(relationship)) {
    return { valid: false, error: 'Relationship is required.' }
  }
  if (requirePhone) {
    if (!isValidPhone(phone)) {
      return { valid: false, error: 'Enter a valid phone number (7–15 digits, digits only or with +, spaces, dashes).' }
    }
  } else if (phone && phone.trim().length > 0) {
    if (!isValidPhone(phone)) {
      return { valid: false, error: 'Enter a valid phone number (7–15 digits, digits only or with +, spaces, dashes).' }
    }
  }
  return { valid: true }
}
