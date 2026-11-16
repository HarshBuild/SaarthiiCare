import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Mail, Lock, Shield, Building2 as HospitalIcon } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import { useAuth } from '../contexts/AuthContext'
import { AuthClient } from '../services/authService'

export default function Login({ onLogin }) {
  const { signIn, supabaseAvailable } = useAuth()
  const [email, setEmail] = useState('priya.sharma@saarthii.in')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roleOptions = [
    { 
      role: 'phc_staff', 
      name: 'PHC Staff', 
      icon: HospitalIcon, 
      email: 'priya.sharma@saarthii.in',
      description: 'Primary Health Centre staff for creating referrals'
    },
    { 
      role: 'hospital_staff', 
      name: 'Hospital Specialist', 
      icon: Stethoscope, 
      email: 'ravi.kumar@saarthii.in',
      description: 'Specialists receiving and treating referrals'
    },
    { 
      role: 'supervisor', 
      name: 'District Supervisor', 
      icon: Shield, 
      email: 'anjali.reddy@saarthii.in',
      description: 'Monitor referral flow and quality metrics'
    },
  ]

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let userProfile = null
      if (supabaseAvailable) {
        userProfile = await signIn(email, password)
      } else {
        const { access_token, user } = await AuthClient.login(email, password)
        localStorage.setItem('saarthii_token', access_token)
        localStorage.setItem('saarthii_user', JSON.stringify(user))
        userProfile = user
      }

      if (onLogin) {
        onLogin(userProfile)
      }

      const destination =
        userProfile?.role === 'hospital_staff'
          ? '/hospital-dashboard'
          : userProfile?.role === 'supervisor' || userProfile?.role === 'admin'
          ? '/supervisor-dashboard'
          : '/phc-dashboard'

      navigate(destination)
    } catch (err) {
      const detail = err.response?.data?.detail || err?.message
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to sign in. Please check your credentials.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = (roleEmail) => {
    setEmail(roleEmail)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 flex items-center justify-center p-4 lg:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side - Logo & Brand */}
        <div className="flex flex-col items-center lg:items-start justify-center text-center lg:text-left space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/25">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              SAARTHII
            </h1>
          </div>
          
          <div className="space-y-4 max-w-md lg:max-w-none">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Closed-Loop Healthcare Referral System
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Seamless referral coordination between Primary Health Centres, hospitals, and district supervisors. 
              Track, manage, and close patient referrals with clinical outcomes.
            </p>
            
            <div className="hidden lg:block mt-8 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Demo Accounts</h3>
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <div key={option.role} className="text-xs text-slate-500">
                    <span className="font-medium text-teal-600 block" onClick={() => handleRoleSelect(option.email)}>{option.name}</span>
                    {option.email}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="relative">
          <div className="glass-panel rounded-2xl shadow-2xl border border-slate-200 p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
              <p className="text-slate-500">Enter your healthcare credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="danger"
                  title="Login Failed"
                  message={error}
                  dismissible
                />
              )}

              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={Mail}
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  required
                />
              </div>

              <div className="text-xs text-slate-500">
                <p>Demo accounts (all use password: <span className="font-medium text-teal-600">Password123!</span>)</p>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Sign in
              </Button>
            </form>

            {/* Mobile: Quick Role Selector */}
            <div className="mt-8 pt-6 border-t border-slate-200 lg:hidden">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Sign In As</h3>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => {
                        setEmail(option.email)
                        setPassword('Password123!')
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <Icon className="h-5 w-5 text-teal-600" />
                      <span className="text-[10px] font-medium text-slate-600 text-center">{option.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}