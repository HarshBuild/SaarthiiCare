import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabaseClient'

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
    setUser(null)
    setProfile(null)
  }, [supabaseAvailable])

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
    }),
    [user, profile, loading, error, supabaseAvailable, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider