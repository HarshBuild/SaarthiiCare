import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, AlertCircle, Clock, FileWarning, Inbox } from 'lucide-react'
import { buildNotifications, fetchNotificationSource } from '../../services/notificationService'
import { ReferralListClient, FollowUpClient } from '../../services/referralsService'

const READ_KEY = 'saarthii_notifications_read'

const KIND_ICONS = {
  follow_up_overdue: AlertCircle,
  follow_up_today: Clock,
  referral_awaiting_acceptance: FileWarning,
  referral_stale: FileWarning,
}

const SEVERITY_STYLES = {
  high: 'bg-rose-50 text-rose-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-slate-100 text-slate-500',
}

function readReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function persistReadIds(set) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]))
  } catch {
    // Storage can be unavailable in private modes; unread state is non-critical.
  }
}

/**
 * Header notification feed derived from live referral and follow-up data.
 */
export default function NotificationCenter() {
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [readIds, setReadIds] = useState(() => readReadIds())

  const load = useCallback(async () => {
    setError('')
    try {
      const source = await fetchNotificationSource(ReferralListClient, FollowUpClient)
      setItems(buildNotifications(source))
    } catch {
      setError('Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const unread = useMemo(
    () => items.filter((item) => !readIds.has(item.id)),
    [items, readIds],
  )

  const markAllRead = () => {
    const next = new Set(readIds)
    items.forEach((item) => next.add(item.id))
    setReadIds(next)
    persistReadIds(next)
  }

  const openItem = (item) => {
    const next = new Set(readIds)
    next.add(item.id)
    setReadIds(next)
    persistReadIds(next)
    setOpen(false)
    navigate(item.href)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-[11px] text-slate-500">
                {unread.length} unread · from live workflow data
              </p>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-teal-600 hover:bg-teal-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <AlertCircle className="h-6 w-6 text-rose-400" />
                <p className="text-xs text-slate-500">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-7 w-7 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">You are all caught up</p>
                <p className="text-xs text-slate-500">No overdue follow-ups or pending referrals.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const Icon = KIND_ICONS[item.kind] || Bell
                  const isUnread = !readIds.has(item.id)
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => openItem(item)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                          isUnread ? 'bg-teal-50/30' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.low
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-xs font-semibold text-slate-900">
                              {item.title}
                            </span>
                            {isUnread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/follow-ups')
              }}
              className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-teal-600"
            >
              Open follow-up workspace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
