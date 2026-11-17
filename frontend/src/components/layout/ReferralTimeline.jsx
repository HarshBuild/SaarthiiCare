import React from 'react'
import Badge from '../ui/Badge'

/**
 * ReferralTimeline - chronological audit log for a referral.
 *
 * Backend events use `event_type` and `notes`; older callers may send `type`
 * and `description`. Both shapes are supported.
 */
const EVENT_CONFIG = {
  created: { variant: 'default', label: 'Created' },
  issued: { variant: 'info', label: 'Issued' },
  submitted: { variant: 'info', label: 'Submitted' },
  acknowledged: { variant: 'warning', label: 'Acknowledged' },
  arrived: { variant: 'teal', label: 'Patient arrived' },
  outcome_recorded: { variant: 'teal', label: 'Outcome recorded' },
  back_referral_sent: { variant: 'navy', label: 'Back-referral sent' },
  back_referral_completed: { variant: 'success', label: 'Back-referral complete' },
  follow_up_assigned: { variant: 'warning', label: 'Follow-up assigned' },
  follow_up_completed: { variant: 'success', label: 'Follow-up completed' },
  closed: { variant: 'success', label: 'Closed' },
  rejected: { variant: 'danger', label: 'Rejected' },
  cancelled: { variant: 'default', label: 'Cancelled' },
}

function formatTimestamp(value) {
  if (!value) return 'Time not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time not recorded'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReferralTimeline({ events = [], className = '' }) {
  if (!events.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-400">
        No workflow events recorded yet.
      </div>
    )
  }

  const ordered = [...events].sort(
    (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
  )

  return (
    <ol className={`space-y-0 ${className}`}>
      {ordered.map((event, index) => {
        const type = event.event_type || event.type
        const config = EVENT_CONFIG[type] || {
          variant: 'default',
          label: type ? type.replace(/_/g, ' ') : 'Event',
        }
        const note = event.notes || event.description
        const actor = event.actor_name || event.user
        const isLast = index === ordered.length - 1

        return (
          <li key={event.id || `${type}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              </span>
              {!isLast && <span className="w-0.5 flex-1 bg-slate-200" />}
            </div>
            <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-6'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={config.variant} size="sm">
                  {config.label}
                </Badge>
                <span className="text-xs text-slate-400">{formatTimestamp(event.timestamp)}</span>
              </div>
              {note && <p className="mt-1 text-sm leading-relaxed text-slate-600">{note}</p>}
              {actor && <p className="mt-1 text-xs text-slate-400">By {actor}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
