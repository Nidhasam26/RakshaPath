import useUserStorage from './useUserStorage'
import { MAX_CONTACTS, canAddContact, validateContact } from '../utils/contacts'

export function useContacts() {
  const [contacts, setContacts] = useUserStorage('contacts', [])
  const [primaryId, setPrimaryId] = useUserStorage('primaryId', null)

  const primaryContact = contacts.find((contact) => String(contact.id) === String(primaryId)) || null

  const addContact = ({ name, relationship, phone = '', requirePhone = true }) => {
    if (!canAddContact(contacts)) {
      return {
        success: false,
        error: `You can save up to ${MAX_CONTACTS} trusted contacts.`,
      }
    }

    const validation = validateContact({ name, relationship, phone, requirePhone })
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const newContact = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
    }

    setContacts((current) => [...current, newContact])
    if (!primaryId) {
      setPrimaryId(newContact.id)
    }

    return {
      success: true,
      contact: newContact,
    }
  }

  const removeContact = (id) => {
    const remaining = contacts.filter((contact) => String(contact.id) !== String(id))
    setContacts(remaining)
    if (String(primaryId) === String(id)) {
      setPrimaryId(remaining[0]?.id ?? null)
    }
  }

  const setPrimaryContact = (id) => {
    setPrimaryId(id)
  }

  return {
    contacts,
    setContacts,
    primaryId,
    primaryContact,
    setPrimaryContact,
    addContact,
    removeContact,
    canAddMore: canAddContact(contacts),
    isMaxReached: contacts.length >= MAX_CONTACTS,
    maxContacts: MAX_CONTACTS,
  }
}

export default useContacts
