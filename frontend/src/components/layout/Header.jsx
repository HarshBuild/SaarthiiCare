import React from 'react'
import { Activity } from 'lucide-react'

/**
 * Header Component - Top application bar
 * Displays system title, user info, and notification bell
 */
export default function Header({ user, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-700"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center gap-2 text-slate-700">
        <Activity className="h-5 w-5 text-teal-600" />
        <span className="text-sm font-medium hidden sm:inline">SAARTHII Healthcare Coordination Platform</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 5.165 6 6.7 6 8.559v2.642c0 .486-.195.943-.545 1.286L3 15m14 0v2a2 2 0 11-4 0v-2m4-9h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
          </svg>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.name || 'Dr. Priya Sharma'}</p>
            <p className="text-xs text-slate-500">{user?.roleLabel || 'PHC Rampur Medical Officer'}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-700 font-semibold">
            {(user?.name || 'PS')[0]}
          </div>
        </div>
      </div>
    </header>
  )
}