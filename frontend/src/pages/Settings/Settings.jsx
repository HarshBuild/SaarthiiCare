import React, { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Database,
  MapPin,
  Save,
  Globe,
  ShieldCheck,
  Lock,
  LogOut,
  Info,
} from 'lucide-react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Switch from '../../components/ui/Switch'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../contexts/AuthContext'
import { AuthClient } from '../../services/authService'

const SETTINGS_KEY = 'saarthii_settings'

const DEFAULT_SETTINGS = {
  notifications: {
    new_referrals: true,
    overdue_tasks: true,
    closure_alerts: true,
  },
  preferences: {
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
  },
  facility: {
    facility_type: 'PHC',
  },
}

const ROLE_LABELS = {
  phc_staff: 'PHC Staff',
  hospital_staff: 'Hospital Staff',
  supervisor: 'Supervisor',
  admin: 'Administrator',
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem('saarthii_user')
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    return null
  }
}

function readStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      preferences: { ...DEFAULT_SETTINGS.preferences, ...(parsed.preferences || {}) },
      facility: { ...DEFAULT_SETTINGS.facility, ...(parsed.facility || {}) },
    }
  } catch (err) {
    return DEFAULT_SETTINGS
  }
}

export default function Settings() {
  const toast = useToast()
  const { profile, signOut, supabaseAvailable } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState(readStoredSettings)
  const [user] = useState(readStoredUser)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [signOutModalOpen, setSignOutModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const currentUser = profile || user

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'account', name: 'Account', icon: Shield },
    { id: 'facility', name: 'Facility', icon: MapPin },
    { id: 'integrations', name: 'Integrations', icon: Database },
  ]

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }))
  }

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }))
  }

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    toast.success('Your preferences were saved on this device.', 'Settings saved')
  }

  const handleSignOut = async () => {
    AuthClient.logout()
    if (supabaseAvailable) {
      await signOut()
    }
    window.location.assign('/login')
  }

  const openPasswordModal = () => {
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    setPasswordError('')
    setPasswordModalOpen(true)
  }

  const handleChangePassword = async () => {
    setPasswordError('')

    if (!passwordForm.current_password || !passwordForm.new_password) {
      setPasswordError('Enter your current password and a new password.')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('The new password must be at least 8 characters long.')
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('The new passwords do not match.')
      return
    }

    if (!currentUser?.email) {
      setPasswordError('No active session found. Please sign in again.')
      return
    }

    setPasswordSaving(true)
    try {
      await AuthClient.changePassword(
        currentUser.email,
        passwordForm.current_password,
        passwordForm.new_password
      )
      setPasswordModalOpen(false)
      toast.success('Your password has been updated. Use the new password next time you sign in.', 'Password changed')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPasswordError(typeof detail === 'string' ? detail : 'Unable to update the password. Please try again.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure your preferences, notifications, and account settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Tabs Sidebar */}
        <nav className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <TabIcon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </nav>

        {/* Settings Content */}
        <div className="lg:col-span-9 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tabs.find(t => t.id === activeTab)?.name} Settings</CardTitle>
              <CardDescription>
                {activeTab === 'general' && 'Manage your general preferences and appearance'}
                {activeTab === 'notifications' && 'Control how and when you receive notifications'}
                {activeTab === 'account' && 'Manage your account information and security'}
                {activeTab === 'facility' && 'Review your assigned facility details'}
                {activeTab === 'integrations' && 'Connect external systems and tools'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Appearance</h3>
                      <div className="flex gap-2">
                        <Button
                          variant={settings.preferences.theme === 'light' ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handlePreferenceChange('theme', 'light')}
                        >
                          Light
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Dark theme is not available in this release"
                        >
                          Dark (soon)
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        The interface currently uses the light theme.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="settings-language" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Language
                      </label>
                      <select
                        id="settings-language"
                        value={settings.preferences.language}
                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="te">Telugu</option>
                        <option value="ta">Tamil</option>
                      </select>
                      <p className="mt-2 text-xs text-slate-500">
                        Language preference is stored on this device for future localization.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Date &amp; Time</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="settings-timezone" className="block text-xs text-slate-500 mb-1.5">Timezone</label>
                        <select
                          id="settings-timezone"
                          value={settings.preferences.timezone}
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata</option>
                          <option value="Asia/Dubai">Asia/Dubai</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="settings-date-format" className="block text-xs text-slate-500 mb-1.5">Date Format</label>
                        <select
                          id="settings-date-format"
                          value={settings.preferences.date_format}
                          onChange={(e) => handlePreferenceChange('date_format', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-slate-900">New referrals</h4>
                      <p className="text-xs text-slate-500">Receive notifications for new incoming referrals</p>
                    </div>
                    <Switch
                      checked={settings.notifications.new_referrals}
                      onCheckedChange={() => handleToggle('notifications', 'new_referrals')}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-slate-900">Overdue tasks</h4>
                      <p className="text-xs text-slate-500">Get alerts when follow-up tasks are overdue</p>
                    </div>
                    <Switch
                      checked={settings.notifications.overdue_tasks}
                      onCheckedChange={() => handleToggle('notifications', 'overdue_tasks')}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-slate-900">Closure alerts</h4>
                      <p className="text-xs text-slate-500">Notifications when referrals are blocked from closure</p>
                    </div>
                    <Switch
                      checked={settings.notifications.closure_alerts}
                      onCheckedChange={() => handleToggle('notifications', 'closure_alerts')}
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Delivery channels are managed by your facility administrator.
                  </p>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Signed In As</h3>
                      <p className="text-sm font-medium text-slate-900">{currentUser?.full_name || 'Unknown user'}</p>
                      <p className="text-xs text-slate-500">{currentUser?.email || 'No email available'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Role</h3>
                      <Badge variant="teal">{ROLE_LABELS[currentUser?.role] || 'Staff'}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={openPasswordModal}>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="danger" onClick={() => setSignOutModalOpen(true)}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500">
                    Demo accounts are stored in memory by the local API, so password changes
                    reset when the backend restarts.
                  </p>
                </div>
              )}

              {activeTab === 'facility' && (
                <div className="space-y-6">
                  {currentUser ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Facility Name</h3>
                        <p className="text-slate-600">{currentUser.facility_name || 'Not assigned'}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Facility ID</h3>
                        <p className="font-mono text-xs text-slate-600 break-all">{currentUser.facility_id || '—'}</p>
                      </div>
                    </div>
                  ) : (
                    <Alert
                      variant="warning"
                      title="No facility context"
                      message="Your session does not include a facility assignment. Sign in again to reload your profile."
                    />
                  )}

                  <Alert
                    variant="info"
                    title="Managed by your administrator"
                    message="Facility details and the referral network are configured by the platform administrator and cannot be edited from this screen."
                  />
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4 text-teal-600" />
                      Health Information Exchange
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Connect to the state health database for real-time patient data synchronization.
                      This requires HIE credentials configured on the server.
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge variant="default">Not Connected</Badge>
                      <Button
                        size="sm"
                        disabled
                        title="HIE credentials are not configured in this environment"
                      >
                        Connect
                      </Button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-teal-600" />
                      ABHA ID Verification
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Automatic verification of Aadhaar-based Health ID numbers is provided by the
                      national ABHA service once configured.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Not Configured</Badge>
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    External integrations are disabled in this demo environment. No credentials are
                    requested or stored in the browser.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Change password */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => !passwordSaving && setPasswordModalOpen(false)}
        title="Change Password"
        description={`Update the password for ${currentUser?.email || 'your account'}.`}
        footer={(
          <>
            <Button
              variant="secondary"
              onClick={() => setPasswordModalOpen(false)}
              disabled={passwordSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} loading={passwordSaving}>
              Update Password
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {passwordError && <Alert variant="danger" title="Cannot update password" message={passwordError} />}

          <Input
            label="Current Password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
            autoComplete="current-password"
            icon={Lock}
            required
          />
          <Input
            label="New Password"
            type="password"
            helperText="At least 8 characters"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
            autoComplete="new-password"
            icon={Lock}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
            autoComplete="new-password"
            icon={Lock}
            required
          />
        </div>
      </Modal>

      {/* Sign out confirmation */}
      <Modal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        title="Sign out?"
        description="You will be returned to the sign-in screen."
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setSignOutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSignOut}>
              Sign Out
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          Any unsaved settings changes on this page will be discarded.
        </p>
      </Modal>
    </div>
  )
}
