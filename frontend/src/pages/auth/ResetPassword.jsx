import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import AuthShell from '../../components/auth/AuthShell'
import { useAuth } from '../../contexts/AuthContext'
import {
  validatePassword,
  validatePasswordConfirmation,
  passwordStrength,
} from '../../utils/authValidation'

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500']

export default function ResetPassword() {
  const { updatePassword, user, supabaseAvailable } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const strength = passwordStrength(password)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const nextErrors = {
      password: validatePassword(password),
      confirmation: validatePasswordConfirmation(password, confirmation),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.password || nextErrors.confirmation) return

    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2200)
    } catch (err) {
      setError(err?.message || 'Could not update the password. Request a new recovery link.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="Your new password is active.">
        <div className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            You can now sign in with your new password. Redirecting you to the sign-in page…
          </p>
          <Button variant="gradient" fullWidth onClick={() => navigate('/login', { replace: true })}>
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-teal-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!supabaseAvailable && (
          <Alert
            variant="warning"
            title="Supabase not configured"
            message="Password recovery requires Supabase Auth. Add the Supabase environment variables to frontend/.env to enable it."
          />
        )}

        {!user && supabaseAvailable && (
          <Alert
            variant="info"
            title="Recovery session required"
            message="Open the reset link from your email on this device. If it has expired, request a new one."
          />
        )}

        {error && <Alert variant="error" title="Update failed" message={error} />}

        <div>
          <div className="relative">
            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
          {password && (
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
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter the new password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          icon={Lock}
          error={fieldErrors.confirmation}
          required
        />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!supabaseAvailable || !user}
          rightIcon={KeyRound}
        >
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
