/**
 * Derives the notification feed from real workflow data.
 *
 * There is no dedicated notifications table in the schema, so the bell is
 * built from the records that actually need attention: overdue follow-ups,
 * follow-ups due today, referrals awaiting acceptance and referrals that have
 * been open too long. Nothing here is fabricated.
 */

const CLOSED_REFERRAL_STATUSES = new Set(['closed', 'cancelled', 'rejected'])
const DONE_FOLLOW_UP_STATUSES = new Set(['completed', 'cancelled'])
const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function daysBetween(earlier, later) {
  return Math.floor((startOfUtcDay(later) - startOfUtcDay(earlier)) / 86400000)
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function buildNotifications({ followUps = [], referrals = [], now = new Date(), limit = 8 } = {}) {
  const items = []
  const today = startOfUtcDay(now)

  for (const task of followUps) {
    if (!task || DONE_FOLLOW_UP_STATUSES.has(task.status)) continue
    const due = parseDate(task.due_date)
    if (!due) continue

    const dueDay = startOfUtcDay(due)
    const label = task.task_description || 'Follow-up task'

    if (task.status === 'overdue' || dueDay < today) {
      const daysLate = Math.max(1, Math.floor((today - dueDay) / 86400000))
      items.push({
        id: `follow-up-overdue-${task.id}`,
        kind: 'follow_up_overdue',
        severity: 'high',
        title: `Follow-up overdue: ${label}`,
        description: `Was due ${formatDate(due)} · ${daysLate} day${daysLate === 1 ? '' : 's'} late`,
        href: '/follow-ups',
        timestamp: due.toISOString(),
      })
    } else if (dueDay === today) {
      items.push({
        id: `follow-up-today-${task.id}`,
        kind: 'follow_up_today',
        severity: 'medium',
        title: `Follow-up due today: ${label}`,
        description: `Due ${formatDate(due)}`,
        href: '/follow-ups',
        timestamp: due.toISOString(),
      })
    }
  }

  for (const referral of referrals) {
    if (!referral || CLOSED_REFERRAL_STATUSES.has(referral.status)) continue
    const number = referral.referral_number || referral.id
    const createdAt = parseDate(referral.created_at)

    if (referral.status === 'submitted') {
      const urgent = referral.priority === 'urgent' || referral.priority === 'emergency'
      items.push({
        id: `referral-awaiting-${referral.id}`,
        kind: 'referral_awaiting_acceptance',
        severity: urgent ? 'high' : 'medium',
        title: `Referral ${number} awaiting acceptance${urgent ? ' (urgent)' : ''}`,
        description: 'The receiving facility has not acknowledged this referral yet.',
        href: `/referrals/${referral.id}`,
        timestamp: (createdAt || now).toISOString(),
      })
    }

    if (createdAt && daysBetween(createdAt, now) > 7) {
      const age = daysBetween(createdAt, now)
      items.push({
        id: `referral-stale-${referral.id}`,
        kind: 'referral_stale',
        severity: 'low',
        title: `Referral ${number} open for ${age} days`,
        description: 'Still not closed. Check the workflow for blockers.',
        href: `/referrals/${referral.id}`,
        timestamp: createdAt.toISOString(),
      })
    }
  }

  return items
    .sort((a, b) => {
      const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      if (rank !== 0) return rank
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    .slice(0, limit)
}

/** Load the raw records the feed is derived from. Failures degrade to an empty list. */
export async function fetchNotificationSource(ReferralListClient, FollowUpClient) {
  const [referrals, followUps] = await Promise.all([
    ReferralListClient.list().catch(() => []),
    FollowUpClient.list().catch(() => []),
  ])
  return {
    referrals: Array.isArray(referrals) ? referrals : [],
    followUps: Array.isArray(followUps) ? followUps : [],
  }
}
