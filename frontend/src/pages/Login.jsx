import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import AuthShell from '../components/auth/AuthShell'
import { useAuth } from '../contexts/AuthContext'
import { AuthClient } from '../services/authService'
import { dashboardPathForRole } from '../utils/roleRoutes'
import { validateEmail, validatePassword } from '../utils/authValidation'

const DEMO_PASSWORD = 'Password123!'

const DEMO_ACCOUNTS = [
  {
    role: 'phc_staff',
    name: 'PHC Staff',
    email: 'priya.sharma@saarthii.in',
    icon: Building2,
    description: 'Create and track referrals',
  },
  {
    role: 'hospital_staff',
    name: 'Hospital',
    email: 'ravi.kumar@saarthii.in',
    icon: Stethoscope,
    description: 'Receive and treat referrals',
  },
  {
    role: 'supervisor',
    name: 'Supervisor',
    email: 'anjali.reddy@saarthii.in',
    icon: ShieldCheck,
    description: 'Monitor district performance',
  },
]

export default function Login({ onLogin }) {
  const { signIn, supabaseAvailable, user, loading: authLoading, adoptLegacySession } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) {
      return
    }

    setLoading(true)
    try {
      let userProfile = null
      if (supabaseAvailable) {
        userProfile = await signIn(email.trim(), password)
      } else {
        const { access_token, user: legacyUser } = await AuthClient.login(email.trim(), password)
        adoptLegacySession(legacyUser, access_token)
        userProfile = legacyUser
      }

      if (onLogin) onLogin(userProfile)
      navigate(dashboardPathForRole(userProfile?.role), { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail || err?.message
      setError(
        typeof detail === 'string' && detail.length > 0
          ? detail
          : 'Unable to sign in. Please check your credentials.',
      )
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setFieldErrors({})
    setError('')
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access the referral coordination workspace."
      footer={
        <div className="space-y-4">
          <p className="text-center text-sm text-slate-500">
            New to SaarthiiCare?{' '}
            <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
              Create an account
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400">
            <Link to="/" className="hover:text-slate-600">
              ← Back to home
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!supabaseAvailable && (
          <Alert
            variant="warning"
            title="Supabase not configured"
            message="Live sign-in needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env. Until then, demo accounts use the legacy backend login."
          />
        )}

        {error && <Alert variant="error" title="Sign in failed" message={error} />}

        <Input
          label="Email address"
          type="email"
          placeholder="you@facility.in"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          error={fieldErrors.email}
          required
        />

        <div>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              error={fieldErrors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[2.15rem] rounded-md p-1 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="gradient" size="lg" fullWidth loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      {supabaseAvailable && (
        <div className="mt-7">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Demo accounts
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                >
                  <Icon className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-800">{account.name}</span>
                  <span className="text-[10px] leading-tight text-slate-500">{account.description}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Demo password for every account: <span className="font-semibold text-slate-600">{DEMO_PASSWORD}</span>
          </p>
        </div>
      )}
    </AuthShell>
  )
}
