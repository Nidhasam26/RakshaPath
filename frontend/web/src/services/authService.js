import storageService from './storageService'

export const SESSION_KEY = 'rakshapath_demo_session'
export const USERS_KEY = 'rakshapath_demo_users'

export const authService = {
  getCurrentUser() {
    return storageService.get(SESSION_KEY, null)
  },

  setCurrentUser(user) {
    if (user) {
      storageService.set(SESSION_KEY, user)
    } else {
      storageService.remove(SESSION_KEY)
    }
  },

  getRegisteredUsers() {
    return storageService.get(USERS_KEY, [])
  },

  saveRegisteredUsers(users) {
    return storageService.set(USERS_KEY, users)
  },

  clearSession() {
    storageService.remove(SESSION_KEY)
  },
}

export default authService
