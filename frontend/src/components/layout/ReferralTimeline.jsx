import React from 'react'
import { Badge } from '../ui/Badge'

/**
 * ReferralTimeline Component - Visual audit event log
 * Displays chronological events with status badges and connecting lines
 */
export default function ReferralTimeline({ events = [], className = '' }) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No events recorded yet.
      </div>
    )
  }

  const statusConfig = {
    created: { variant: 'default', label: 'Created' },
    issued: { variant: 'info', label: 'Issued' },
    acknowledged: { variant: 'warning', label: 'Acknowledged' },
    arrived: { variant: 'teal', label: 'Patient Arrived' },
    outcome_recorded: { variant: 'teal', label: 'Outcome Recorded' },
    back_referral_sent: { variant: 'navy', label: 'Back-Referral Sent' },
    follow_up_assigned: { variant: 'warning', label: 'Follow-Up Assigned' },
    follow_up_completed: { variant: 'success', label: 'Follow-Up Completed' },
    closed: { variant: 'success', label: 'Closed' },
    rejected: { variant: 'danger', label: 'Rejected' },
    cancelled: { variant: 'default', label: 'Cancelled' },
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {events.map((event, index) => {
        const config = statusConfig[event.type] || statusConfig.created
        const isLast = index === events.length - 1

        return (
          <div key={event.id || index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-slate-200" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2">
                <Badge variant={config.variant} size="sm">{config.label}</Badge>
                <span className="text-xs text-slate-400">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              {event.description && (
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
              )}
              {event.user && (
                <p className="mt-1 text-xs text-slate-400">By: {event.user}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}