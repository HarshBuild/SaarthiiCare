import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Stethoscope, LayoutDashboard, FileText, Users, BarChart3, Settings, LogOut, Activity } from 'lucide-react'

/**
 * Sidebar Component - Main navigation sidebar
 * Collapsible on mobile, persistent on desktop
 * Highlights active route
 */
export default function Sidebar({ sidebarOpen, setSidebarOpen, user }) {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Referrals', href: '/referrals', icon: FileText },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Supervisor', href: '/supervisor', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (href) => location.pathname === href

  const roleLabel = user?.role
    ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Staff'

  return (
    <aside
      className={`
        fixed inset-0 z-40 flex w-64 flex-col bg-navy-900 text-white shadow-xl
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo / Branding */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">SAARTHII</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Referral System</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Role Badge */}
      <div className="mx-3 mb-2 rounded-lg bg-slate-800/50 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">Current Role</p>
        <p className="text-sm font-medium text-white">{roleLabel}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-slate-800 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}