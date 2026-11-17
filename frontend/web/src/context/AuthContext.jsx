import {
  useEffect,
  useState,
} from 'react'
import AuthContext from './authContext.js'
import { hashPassword, generateSalt, verifyPassword } from '../utils/crypto'
import { migrateLegacyDataForUser } from '../hooks/useUserStorage'

const SESSION_KEY = 'rakshapath_demo_session'
const USERS_KEY = 'rakshapath_demo_users'

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch (error) {
    console.error(`Unable to read ${key}:`, error)
    return fallback
  }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() =>
    readStorage(USERS_KEY, [])
  )

  const [user, setUser] = useState(() =>
    readStorage(SESSION_KEY, null)
  )

  // Persist registered demo accounts.
  useEffect(() => {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    } catch (error) {
      console.error('Unable to save demo accounts:', error)
    }
  }, [users])

  // Persist the current demo session.
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(SESSION_KEY)
      }
    } catch (error) {
      console.error('Unable to save demo session:', error)
    }
  }, [user])

  // Register a new demo account.
  const register = async ({ name, email, password, role }) => {
    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = users.find(
      (account) => account.email === normalizedEmail
    )

    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists.',
      }
    }

    try {
      const salt = generateSalt()
      const credentials = await hashPassword(password, salt)

      const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        salt: credentials.salt,
        passwordHash: credentials.passwordHash,
        kdf: credentials.kdf,
        iterations: credentials.iterations,
        hash: credentials.hash,
        role,
      }

      setUsers((previousUsers) => {
        const next = [...previousUsers, newUser]
        try {
          localStorage.setItem(USERS_KEY, JSON.stringify(next))
        } catch (err) {
          console.error('Unable to save demo accounts:', err)
        }
        return next
      })

      const demoUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }

      migrateLegacyDataForUser(demoUser.id)
      setUser(demoUser)

      return {
        success: true,
        user: demoUser,
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return {
        success: false,
        message: error.message || 'Unable to create account in this environment.',
      }
    }
  }

  // Validate demo login credentials.
  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = users.find(
      (account) => account.email === normalizedEmail
    )

    if (!existingUser) {
      return {
        success: false,
        message: 'Invalid email or password.',
      }
    }

    try {
      const verification = await verifyPassword(password, existingUser)

      if (!verification.valid) {
        return {
          success: false,
          message: 'Invalid email or password.',
        }
      }

      // Upgrade legacy plaintext or older hash accounts to PBKDF2
      if (verification.needsUpgrade) {
        const salt = generateSalt()
        const credentials = await hashPassword(password, salt)
        const updatedAccount = {
          ...existingUser,
          salt: credentials.salt,
          passwordHash: credentials.passwordHash,
          kdf: credentials.kdf,
          iterations: credentials.iterations,
          hash: credentials.hash,
        }
        delete updatedAccount.password

        setUsers((previousUsers) => {
          const next = previousUsers.map((acc) =>
            acc.id === existingUser.id ? updatedAccount : acc
          )
          try {
            localStorage.setItem(USERS_KEY, JSON.stringify(next))
          } catch (err) {
            console.error('Unable to save demo accounts:', err)
          }
          return next
        })
      }

      const demoUser = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      }

      migrateLegacyDataForUser(demoUser.id)
      setUser(demoUser)

      return {
        success: true,
        user: demoUser,
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.message || 'Unable to authenticate in this environment.',
      }
    }
  }

  // End the current demo session.
  const logout = () => {
    setUser(null)
  }

  const updateProfile = ({ name, email }) => {
    if (!user) return
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()
    const duplicate = users.some((account) => account.email === normalizedEmail && account.id !== user.id)
    if (duplicate) return { success: false, message: 'That email address is already in use.' }
    const updatedUser = { ...user, name: normalizedName, email: normalizedEmail }
    setUser(updatedUser)
    setUsers((current) => current.map((account) => account.id === user.id ? { ...account, name: normalizedName, email: normalizedEmail } : account))
    return { success: true, user: updatedUser }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
