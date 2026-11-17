import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabaseClient'
import { createAuthActions } from '../services/authActions'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Build a profile shape from a Supabase Auth user and a profile row.
 *
 * The profile row is the authority for role and facility assignments. The
 * auth user only supplies id and email.
 */
function buildProfile(authUser, profileRow) {
  if (!profileRow) {
    return {
      id: authUser?.id,
      email: authUser?.email,
      full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User',
      role: 'phc_staff',
      facility_ids: [],
      facility_name: null,
    }
  }

  return {
    id: profileRow.id,
    email: profileRow.email,
    full_name: profileRow.full_name,
    role: profileRow.role,
    facility_ids: profileRow.facility_ids || [],
    facility_name: profileRow.facility_name || null,
  }
}

/** Shape a FastAPI legacy login response into the app's profile model. */
function buildLegacyProfile(legacyUser) {
  return {
    id: legacyUser.id,
    email: legacyUser.email,
    full_name: legacyUser.full_name || legacyUser.email?.split('@')[0] || 'User',
    role: legacyUser.role || 'phc_staff',
    facility_ids: legacyUser.facility_id ? [legacyUser.facility_id] : [],
    facility_name: legacyUser.facility_name || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const supabaseAvailable = Boolean(supabase)

  const loadProfile = useCallback(
    async (authUser) => {
      if (!authUser || !supabaseAvailable) {
        setProfile(null)
        return null
      }

      try {
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('id', authUser.id)
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        const { data: assignments } = await supabase
          .from('user_facility_assignments')
          .select('facility_id, facilities(id, name)')
          .eq('user_id', authUser.id)

        const facilityIds = (assignments || []).map((a) => a.facility_id)
        const facilityNames = (assignments || [])
          .map((a) => a.facilities?.name)
          .filter(Boolean)

        return buildProfile(authUser, {
          ...profileRow,
          facility_ids: facilityIds,
          facility_name: facilityNames[0] || null,
        })
      } catch (err) {
        setError(err?.message || 'Could not load profile.')
        return null
      }
    },
    [supabaseAvailable],
  )

  const refreshProfile = useCallback(async () => {
    if (!supabaseAvailable) {
      return null
    }
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser) {
      return null
    }
    return loadProfile(authUser)
  }, [supabaseAvailable, loadProfile])

  const initialise = useCallback(async () => {
    if (!supabaseAvailable) {
      // Legacy backend mode: restore the user saved by the FastAPI login
      // fallback so protected routes work without Supabase configured.
      try {
        const raw = localStorage.getItem('saarthii_user')
        const legacyUser = raw ? JSON.parse(raw) : null
        if (legacyUser?.id || legacyUser?.email) {
          setUser(legacyUser)
          setProfile(buildLegacyProfile(legacyUser))
        }
      } catch {
        localStorage.removeItem('saarthii_user')
      }
      setLoading(false)
      return
    }

    try {
      const { data } = await supabase.auth.getSession()
      const authUser = data?.session?.user || null
      setUser(authUser)
      const builtProfile = await loadProfile(authUser)
      setProfile(builtProfile)
    } catch (err) {
      setError(err?.message || 'Could not restore session.')
    } finally {
      setLoading(false)
    }
  }, [supabaseAvailable, loadProfile])

  useEffect(() => {
    initialise()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialise])

  useEffect(() => {
    if (!supabaseAvailable) {
      return undefined
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user || null
        setUser(authUser)
        if (authUser) {
          const builtProfile = await loadProfile(authUser)
          setProfile(builtProfile)
        } else {
          setProfile(null)
        }
        setLoading(false)
      },
    )

    return () => subscription?.unsubscribe?.()
  }, [supabaseAvailable, loadProfile])

  const signIn = useCallback(
    async (email, password) => {
      if (!supabaseAvailable) {
        throw new Error('Supabase is not configured.')
      }
      setError(null)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        throw authError
      }
      const authUser = data?.user || null
      setUser(authUser)
      const builtProfile = await loadProfile(authUser)
      setProfile(builtProfile)
      return builtProfile
    },
    [supabaseAvailable, loadProfile],
  )

  const signOut = useCallback(async () => {
    if (supabaseAvailable) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('saarthii_token')
    localStorage.removeItem('saarthii_user')
    setUser(null)
    setProfile(null)
  }, [supabaseAvailable])

  /**
   * Adopt a FastAPI legacy login result. Used when Supabase is not configured
   * so protected routes and the dashboard shell work against the backend.
   */
  const adoptLegacySession = useCallback((legacyUser, accessToken) => {
    if (legacyUser) {
      localStorage.setItem('saarthii_user', JSON.stringify(legacyUser))
    }
    if (accessToken) {
      localStorage.setItem('saarthii_token', accessToken)
    }
    setUser(legacyUser || null)
    setProfile(legacyUser ? buildLegacyProfile(legacyUser) : null)
  }, [])

  const requireSupabase = useCallback(() => {
    if (!supabaseAvailable) {
      throw new Error(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.',
      )
    }
  }, [supabaseAvailable])

  const signUp = useCallback(
    async (payload) => {
      requireSupabase()
      return createAuthActions(supabase).signUp(payload)
    },
    [requireSupabase],
  )

  const requestPasswordReset = useCallback(
    async (email, redirectTo) => {
      requireSupabase()
      return createAuthActions(supabase).requestPasswordReset(email, redirectTo)
    },
    [requireSupabase],
  )

  const updatePassword = useCallback(
    async (newPassword) => {
      requireSupabase()
      return createAuthActions(supabase).updatePassword(newPassword)
    },
    [requireSupabase],
  )

  const resendConfirmation = useCallback(
    async (email, redirectTo) => {
      requireSupabase()
      return createAuthActions(supabase).resendConfirmation(email, redirectTo)
    },
    [requireSupabase],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      supabaseAvailable,
      signIn,
      signOut,
      refreshProfile,
      signUp,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      adoptLegacySession,
    }),
    [
      user,
      profile,
      loading,
      error,
      supabaseAvailable,
      signIn,
      signOut,
      refreshProfile,
      signUp,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      adoptLegacySession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider