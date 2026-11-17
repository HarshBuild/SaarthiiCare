import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Building2,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  MailCheck,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import AuthShell from '../../components/auth/AuthShell'
import { useAuth } from '../../contexts/AuthContext'
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirmation,
  passwordStrength,
} from '../../utils/authValidation'

const ROLES = [
  {
    value: 'phc_staff',
    name: 'PHC staff',
    description: 'Self-registration enabled',
    icon: Building2,
    selfService: true,
  },
  {
    value: 'hospital_staff',
    name: 'Hospital staff',
    description: 'Needs admin approval',
    icon: Stethoscope,
    selfService: false,
  },
  {
    value: 'supervisor',
    name: 'Supervisor',
    description: 'Needs admin approval',
    icon: ShieldCheck,
    selfService: false,
  },
]

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500']

export default function Register() {
  const { signUp, resendConfirmation, supabaseAvailable } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'phc_staff',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendState, setResendState] = useState({ loading: false, message: '' })

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const strength = passwordStrength(form.password)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const nextErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validatePasswordConfirmation(form.password, form.confirmPassword),
    }
    if (!accepted) nextErrors.accepted = 'Please accept the demo data notice'
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setLoading(true)
    try {
      const result = await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        requestedRole: form.role,
      })

      if (result?.session) {
        navigate('/dashboard', { replace: true })
      } else {
        setPendingEmail(form.email.trim())
      }
    } catch (err) {
      setError(err?.message || 'Could not create the account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendState({ loading: true, message: '' })
    try {
      await resendConfirmation(pendingEmail, `${window.location.origin}/login`)
      setResendState({ loading: false, message: 'Confirmation email sent again.' })
    } catch (err) {
      setResendState({ loading: false, message: err?.message || 'Could not resend the email.' })
    }
  }

  if (pendingEmail) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="One more step to activate your account."
        footer={
          <p className="text-center text-sm text-slate-500">
            Already confirmed?{' '}
            <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
              Sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-slate-900">{pendingEmail}</span>. Open it to
            activate the account, then sign in.
          </p>

          {resendState.message && (
            <Alert variant={resendState.message.includes('again') ? 'success' : 'error'}>
              {resendState.message}
            </Alert>
          )}

          <Button
            variant="outline"
            fullWidth
            loading={resendState.loading}
            onClick={handleResend}
          >
            Resend confirmation email
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the referral coordination network."
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!supabaseAvailable && (
          <Alert
            variant="warning"
            title="Supabase not configured"
            message="Registration requires Supabase Auth. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env to enable it."
          />
        )}
        {error && <Alert variant="error" title="Registration failed" message={error} />}

        <Input
          label="Full name"
          placeholder="Dr. Priya Sharma"
          autoComplete="name"
          value={form.fullName}
          onChange={update('fullName')}
          icon={User}
          error={fieldErrors.fullName}
          required
        />

        <Input
          label="Work email"
          type="email"
          placeholder="you@facility.in"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          icon={Mail}
          error={fieldErrors.email}
          required
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="+91 90000 00000"
          autoComplete="tel"
          value={form.phone}
          onChange={update('phone')}
          icon={Phone}
        />

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">I am a…</span>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((role) => {
              const Icon = role.icon
              const selected = form.role === role.value
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                    selected
                      ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  aria-pressed={selected}
                >
                  <Icon className={`h-4 w-4 ${selected ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className={`text-xs font-semibold ${selected ? 'text-teal-800' : 'text-slate-700'}`}>
                    {role.name}
                  </span>
                  <span className="text-[10px] leading-tight text-slate-500">{role.description}</span>
                </button>
              )
            })}
          </div>
          {form.role !== 'phc_staff' && (
            <p className="mt-2 text-xs text-amber-700">
              This role needs a district administrator to assign it. Your account will start with
              PHC staff access until then.
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
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
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1 flex-1 rounded-full ${
                      step <= strength ? STRENGTH_COLORS[strength] : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="w-12 text-right text-[11px] font-medium text-slate-500">
                {STRENGTH_LABELS[strength]}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          icon={Lock}
          error={fieldErrors.confirmPassword}
          required
        />

        <label className="flex items-start gap-2.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span>
            I understand this is a demo environment and no real patient data should be entered.
          </span>
        </label>
        {fieldErrors.accepted && (
          <p className="text-xs text-rose-600">{fieldErrors.accepted}</p>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!supabaseAvailable}
        >
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <CheckCircle2 className="h-4 w-4" />}
        </Button>
      </form>
    </AuthShell>
  )
}
