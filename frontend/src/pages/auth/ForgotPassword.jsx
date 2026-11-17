import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck, ArrowLeft, Send } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'
import AuthShell from '../../components/auth/AuthShell'
import { useAuth } from '../../contexts/AuthContext'
import { validateEmail } from '../../utils/authValidation'

export default function ForgotPassword() {
  const { requestPasswordReset, supabaseAvailable } = useAuth()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const emailError = validateEmail(email)
    setFieldError(emailError)
    if (emailError) return

    setLoading(true)
    try {
      await requestPasswordReset(
        email.trim(),
        `${window.location.origin}/reset-password`,
      )
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Could not send the reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? 'A recovery link is on its way.'
          : 'Enter your work email and we will send a secure recovery link.'
      }
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
      {sent ? (
        <div className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            If an account exists for{' '}
            <span className="font-semibold text-slate-900">{email.trim()}</span>, you will receive a
            password reset link shortly. The link expires after a short period for security.
          </p>
          <Button variant="outline" fullWidth onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!supabaseAvailable && (
            <Alert
              variant="warning"
              title="Supabase not configured"
              message="Password recovery requires Supabase Auth. Add the Supabase environment variables to frontend/.env to enable it."
            />
          )}
          {error && <Alert variant="error" title="Request failed" message={error} />}

          <Input
            label="Work email"
            type="email"
            placeholder="you@facility.in"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            error={fieldError}
            required
          />

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!supabaseAvailable}
            rightIcon={Send}
          >
            {loading ? 'Sending…' : 'Send recovery link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
