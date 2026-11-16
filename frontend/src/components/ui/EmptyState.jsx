import React from 'react'
import { FileText, Users, Activity, BarChart3, Inbox } from 'lucide-react'

/**
 * Empty State Component - Displayed when no data is available
 * Supports icon, title, description, and action button
 */
export default function EmptyState({
  icon: Icon = FileText,
  title = 'No data available',
  description = 'There is nothing to display yet.',
  action,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`} {...props}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * Preset empty states for common scenarios
 */
export function EmptyReferrals() {
  return (
    <EmptyState
      icon={FileText}
      title="No referrals yet"
      description="Create your first patient referral to begin tracking the care journey."
    />
  )
}

export function EmptyPatients() {
  return (
    <EmptyState
      icon={Users}
      title="No patients registered"
      description="Register patients in your facility to create referrals and manage follow-ups."
    />
  )
}

export function EmptyInbox() {
  return (
    <EmptyState
      icon={Inbox}
      title="Inbox is empty"
      description="Incoming referrals from primary health centres will appear here."
    />
  )
}