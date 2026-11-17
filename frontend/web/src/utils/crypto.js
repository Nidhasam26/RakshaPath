/**
 * Secure password hashing utilities for RakshaPath demo authentication.
 * Uses Web Cryptography API: PBKDF2 with HMAC-SHA-256, 100,000 iterations,
 * and a cryptographically random 16-byte salt per account.
 *
 * NOTE: This is client-side demo authentication designed for local workspace isolation.
 * It is not connected to production authentication, live identity verification, or backend recovery.
 */

export const PBKDF2_ITERATIONS = 600000
export const PBKDF2_HASH = 'SHA-256'
export const PBKDF2_KEY_LENGTH = 256 // bits (32 bytes)

/**
 * Checks if the Web Cryptography API is supported in the current environment.
 * Note: Modern browsers restrict crypto.subtle to secure contexts (HTTPS or localhost).
 * Accessing via HTTP over a local network (e.g. http://192.168.x.x:5173) disables crypto.subtle.
 */
export function isWebCryptoAvailable() {
  return (
    typeof globalThis !== 'undefined' &&
    Boolean(
      globalThis.crypto?.subtle?.importKey &&
      globalThis.crypto?.subtle?.deriveBits &&
      globalThis.crypto?.getRandomValues
    )
  )
}

function assertWebCryptoAvailable() {
  if (!isWebCryptoAvailable()) {
    throw new Error(
      'Web Cryptography is unavailable in this environment. Most browsers disable crypto.subtle when accessed over non-secure HTTP (e.g. over a local LAN IP). Please use http://localhost:5173 or HTTPS.'
    )
  }
}

function uint8ArrayToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToUint8Array(hex) {
  if (!hex || typeof hex !== 'string' || hex.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal salt representation.')
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * Generates a unique 16-byte cryptographically random salt (32 hex characters).
 */
export function generateSalt() {
  if (typeof globalThis === 'undefined' || !globalThis.crypto?.getRandomValues) {
    throw new Error('Cryptographically secure random values are unavailable.')
  }
  const array = new Uint8Array(16)
  globalThis.crypto.getRandomValues(array)
  return uint8ArrayToHex(array)
}

/**
 * Derives a PBKDF2 hash using Web Crypto API.
 * @param {string} password - Raw password text
 * @param {string} saltHex - Hex-encoded salt
 * @param {number} [iterations=100000] - Iteration count
 * @returns {Promise<string>} Hex-encoded derived key (64 characters)
 */
export async function hashPasswordPBKDF2(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  assertWebCryptoAvailable()

  const encoder = new TextEncoder()
  const passwordKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const saltBytes = hexToUint8Array(saltHex)

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: PBKDF2_HASH,
    },
    passwordKey,
    PBKDF2_KEY_LENGTH
  )

  return uint8ArrayToHex(new Uint8Array(derivedBits))
}

/**
 * Legacy SHA-256 hashing for backwards-compatibility with existing demo accounts.
 */
export async function hashPasswordLegacySHA256(password, saltHex) {
  assertWebCryptoAvailable()
  const encoder = new TextEncoder()
  const data = encoder.encode(`${saltHex}:${password}`)
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
  return uint8ArrayToHex(new Uint8Array(hashBuffer))
}

/**
 * Primary hash function - produces PBKDF2 hash and algorithm metadata.
 */
export async function hashPassword(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  const hash = await hashPasswordPBKDF2(password, saltHex, iterations)
  return {
    passwordHash: hash,
    salt: saltHex,
    kdf: 'PBKDF2',
    iterations,
    hash: PBKDF2_HASH,
  }
}

/**
 * Verifies a password against an account record.
 * Supports:
 *  1. PBKDF2 (current standard)
 *  2. Legacy SHA-256 (auto-detected)
 *  3. Legacy plaintext (for migration)
 *
 * @returns {Promise<{ valid: boolean, needsUpgrade: boolean }>}
 */
export async function verifyPassword(password, account) {
  if (!account) return { valid: false, needsUpgrade: false }

  // 1. PBKDF2 account
  if (account.kdf === 'PBKDF2' && account.passwordHash && account.salt) {
    assertWebCryptoAvailable()
    const iterations = account.iterations || 100000
    const computed = await hashPasswordPBKDF2(password, account.salt, iterations)
    const valid = computed === account.passwordHash
    return {
      valid,
      needsUpgrade: valid && iterations < PBKDF2_ITERATIONS,
    }
  }

  // 2. Legacy SHA-256 account
  if (account.passwordHash && account.salt && (!account.kdf || account.kdf === 'SHA-256')) {
    assertWebCryptoAvailable()
    const computed = await hashPasswordLegacySHA256(password, account.salt)
    const valid = computed === account.passwordHash
    return {
      valid,
      needsUpgrade: valid, // Upgrade to PBKDF2 if verified
    }
  }

  // 3. Legacy plaintext account
  if (account.password) {
    const valid = account.password === password
    return {
      valid,
      needsUpgrade: valid, // Upgrade to PBKDF2 if verified
    }
  }

  return { valid: false, needsUpgrade: false }
}
