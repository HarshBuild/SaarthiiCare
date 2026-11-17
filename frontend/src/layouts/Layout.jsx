import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Home,
  FileText,
  Users,
  Building,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Activity,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import NotificationCenter from '../components/layout/NotificationCenter'
import { dashboardPathForRole } from '../utils/roleRoutes'

const SIDEBAR_KEY = 'saarthii_sidebar_collapsed'

const ROLE_LABELS = {
  phc_staff: 'PHC Staff',
  hospital_staff: 'Specialist',
  supervisor: 'Supervisor',
  admin: 'Administrator',
}

const ROUTE_LABELS = {
  'phc-dashboard': 'PHC Dashboard',
  'hospital-dashboard': 'Hospital Dashboard',
  'hospital': 'Hospital',
  'intake': 'Intake Queue',
  'supervisor-dashboard': 'Analytics',
  'referrals': 'Referrals',
  'new': 'New Referral',
  'patients': 'Patients',
  'follow-ups': 'Follow-ups',
  'settings': 'Settings',
  'arrival': 'Patient Arrival',
  'outcomes': 'Outcome Recording',
  'back-referral': 'Back Referral',
  'qr': 'QR Reference',
}

function initials(name) {
  if (!name) return 'U'
  return name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Dashboard shell: collapsible sidebar, search, notification feed, profile menu
 * and breadcrumbs. All user identity comes from AuthContext.
 */
export default function Layout() {
  const { profile, signOut, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const user = profile
  const dashboardPath = dashboardPathForRole(user?.role)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      // non-critical preference
    }
  }, [collapsed])

  useEffect(() => {
    setSidebarOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        setProfileOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!profileOpen) return undefined
    const onPointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [profileOpen])

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const menuItems = useMemo(() => {
    const items = [{ label: 'Dashboard', path: dashboardPath, icon: Home }]

    if (user?.role === 'phc_staff') {
      items.push({ label: 'New Referral', path: '/referrals/new', icon: PlusCircle })
    }

    items.push({ label: 'Referrals', path: '/referrals', icon: FileText })
    items.push({ label: 'Patients', path: '/patients', icon: Users })

    if (user?.role === 'phc_staff') {
      items.push({ label: 'Follow-ups', path: '/follow-ups', icon: Activity })
    }

    if (user?.role === 'hospital_staff') {
      items.push({ label: 'Intake Queue', path: '/hospital-dashboard', icon: Building })
    }

    if (user?.role === 'supervisor' || user?.role === 'admin') {
      items.push({ label: 'Analytics', path: '/supervisor-dashboard', icon: BarChart3 })
    }

    // A role's landing page is also reachable under a descriptive menu label.
    // Merge duplicates (keeping the more specific label) so React keys and the
    // active state stay unambiguous.
    const byPath = new Map()
    items.forEach((item) => {
      const existing = byPath.get(item.path)
      byPath.set(item.path, existing ? { ...existing, label: item.label, icon: item.icon } : item)
    })
    return [...byPath.values()]
  }, [user?.role, dashboardPath])

  // Highlight only the most specific matching route (so /referrals/new does
  // not also light up /referrals).
  const activePath = useMemo(() => {
    const candidates = [...menuItems, { path: '/settings' }]
      .map((item) => item.path)
      .filter((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
      .sort((a, b) => b.length - a.length)
    return candidates[0] || null
  }, [menuItems, location.pathname])

  const handleSearch = (event) => {
    event.preventDefault()
    const query = searchTerm.trim()
    navigate(query ? `/referrals?search=${encodeURIComponent(query)}` : '/referrals')
    setSearchTerm('')
  }

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => ({
      label: ROUTE_LABELS[segment] || segment.replace(/-/g, ' '),
      path: `/${segments.slice(0, index + 1).join('/')}`,
      last: index === segments.length - 1,
    }))
  }, [location.pathname])

  const NavItem = ({ item }) => {
    const isActive = activePath === item.path
    const Icon = item.icon
    return (
      <Link
        to={item.path}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={`
          group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
          ${collapsed ? 'lg:justify-center lg:px-0' : ''}
          ${
            isActive
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
          }
        `}
      >
        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-teal-400'}`} />
        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
        {isActive && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
      </Link>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-teal-600" />
          <p className="text-sm text-slate-500">Loading workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 lg:static lg:block
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          border-r border-slate-800/50 bg-slate-900 text-white shadow-2xl
        `}
      >
        <div className="flex h-full flex-col">
          <div className={`flex h-20 items-center gap-3 border-b border-slate-800/40 ${collapsed ? 'lg:justify-center lg:px-0' : ''} px-6`}>
            <Link to={dashboardPath} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6 text-white" />
            </Link>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                SAARTHII
              </h1>
              <p className="text-[10px] font-bold uppercase leading-none tracking-widest text-teal-500/80">
                Health Coordination
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>
              Workspace
            </p>
            {menuItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}

            <div className="pt-8">
              <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>
                General
              </p>
              <NavItem item={{ label: 'Settings', path: '/settings', icon: Settings }} />
            </div>
          </nav>

          <div className="border-t border-slate-800/40 bg-slate-900/40 p-4">
            <div
              className={`flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 px-2 py-3 ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white">
                {initials(user?.full_name || user?.email)}
              </div>
              <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <p className="truncate text-xs font-semibold text-slate-100">
                  {user?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-teal-400">
                  {ROLE_LABELS[user?.role] || 'Staff'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-md lg:h-20 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={24} />
            </button>

            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
              <span className="font-medium text-slate-400">App</span>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.path}>
                  <ChevronRight size={14} className="shrink-0 text-slate-300" />
                  {crumb.last ? (
                    <span className="truncate font-bold capitalize text-slate-900">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="truncate capitalize text-slate-500 hover:text-teal-600">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <form onSubmit={handleSearch} className="group relative hidden md:flex" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" size={16} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search referrals…"
                aria-label="Search referrals"
                className="w-56 rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 xl:w-64"
              />
            </form>

            <NotificationCenter />

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="mb-1 text-[10px] font-bold uppercase leading-none tracking-widest text-slate-400">
                  Assigned facility
                </p>
                <Badge variant="teal" size="sm" dot>
                  {user?.facility_name || 'Unassigned'}
                </Badge>
              </div>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
                  {initials(user?.full_name || user?.email)}
                </span>
                <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 animate-fade-in"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user?.email || 'No email'}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      <User className="h-3 w-3" />
                      {ROLE_LABELS[user?.role] || 'Staff'}
                    </span>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => navigate('/settings')}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings & profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
