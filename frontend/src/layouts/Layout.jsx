import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  FileText, 
  Users, 
  Building,
  Stethoscope, 
  Shield, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
  Activity,
  Search
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

/**
 * Main Layout - Premium Dashboard Shell
 *
 * User state is sourced from the AuthContext provider, which wraps the
 * routes in App.jsx. This removes the previous localStorage fallback and
 * lets Supabase session persistence drive the UI.
 */
export default function Layout() {
  const { profile, signOut, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const user = profile

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const roleLabels = {
    'phc_staff': 'PHC Staff',
    'hospital_staff': 'Specialist',
    'supervisor': 'Supervisor',
    'admin': 'Administrator'
  }

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: user?.role === 'phc_staff' ? '/phc-dashboard' : (user?.role === 'hospital_staff' ? '/hospital-dashboard' : '/supervisor-dashboard'), 
      icon: Home 
    },
    { 
      label: 'Referrals', 
      path: '/referrals', 
      icon: FileText 
    },
    { 
      label: 'Patients', 
      path: '/patients', 
      icon: Users 
    },
  ]

  // Add role-specific menu items
  if (user?.role === 'phc_staff') {
    menuItems.splice(1, 0, { label: 'New Referral', path: '/referrals/new', icon: PlusCircle })
    menuItems.push({ label: 'Follow-ups', path: '/follow-ups', icon: Activity })
  }

  if (user?.role === 'hospital_staff') {
    menuItems.push({ label: 'Intake Queue', path: '/hospital-dashboard', icon: Building })
  }

  if (user?.role === 'supervisor' || user?.role === 'admin') {
    menuItems.push({ label: 'Analytics', path: '/supervisor-dashboard', icon: BarChart3 })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = searchTerm.trim()
    navigate(query ? `/referrals?search=${encodeURIComponent(query)}` : '/referrals')
    setSearchTerm('')
  }

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path
    const Icon = item.icon
    
    return (
      <Link
        to={item.path}
        className={`
          flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
          ${isActive 
            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }
        `}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'group-hover:text-teal-400'}`} />
        <span>{item.label}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 lg:static lg:block
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-[#0f172a] text-white border-r border-slate-800/50 shadow-2xl
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-800/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">SAARTHII</h1>
              <p className="text-[10px] font-bold text-teal-500/80 uppercase tracking-widest leading-none">Health Coordination</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto custom-scrollbar">
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Menu</p>
            {menuItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}

            <div className="pt-8 px-3">
              <p className="mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">General</p>
              <NavItem item={{ label: 'Settings', path: '/settings', icon: Settings }} />
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800/40 bg-slate-900/40">
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[10px] font-medium text-teal-400 uppercase tracking-wider truncate">
                  {roleLabels[user?.role] || 'Staff'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 lg:h-20 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            
            {/* Breadcrumbs / Page Title */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium hover:text-teal-600 cursor-pointer">App</span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-slate-900 font-bold capitalize">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3 lg:gap-6">
            <form onSubmit={handleSearch} className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={16} />
              <input 
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search referrals..." 
                aria-label="Search referrals"
                className="w-64 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/5 transition-all"
              />
            </form>

            <div className="flex items-center gap-2">
              <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
              
              <div className="hidden sm:flex items-center gap-3 pl-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Facility</p>
                  <Badge variant="teal" size="sm" dot>{user?.facility_name || 'Facility'}</Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
