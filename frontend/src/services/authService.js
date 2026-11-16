import apiClient from './api'

/**
 * AuthClient - Legacy authentication against the FastAPI backend.
 *
 * This is a thin wrapper kept for the fallback path when Supabase Auth
 * is not available or for the deprecated /auth/login endpoint.
 * New sign-in should use supabase.auth.signInWithPassword instead.
 */
export const AuthClient = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },

  async me() {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  async changePassword(email, currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      email,
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },

  logout() {
    localStorage.removeItem('saarthii_token')
    localStorage.removeItem('saarthii_user')
  },
}

export default AuthClient
