import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for legacy token support (Supabase sends its own session).
// When VITE_SUPABASE_AUTH_ENABLED=false, the legacy flow uses a signed JWT
// from /auth/login, stored as saarthii_token.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saarthii_token')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for authentication errors.
// When the legacy endpoint returns 401, clear legacy storage and redirect.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('saarthii_token')
      localStorage.removeItem('saarthii_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient