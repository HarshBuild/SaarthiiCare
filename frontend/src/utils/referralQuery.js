/**
 * Pure helpers behind the referral register: search, lifecycle filters,
 * pagination and the summary strip. Kept free of React so the behaviour can be
 * unit tested and reused by dashboards.
 */

import { getStatusMeta, isOpenStatus, isTerminalStatus } from './referralStatus.js'

export const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'pending_ack', label: 'Awaiting acknowledgement' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'arrived', label: 'Patient arrived' },
  { value: 'outcome_recorded', label: 'Outcome recorded' },
  { value: 'back_referral_pending', label: 'Back-referral pending' },
  { value: 'follow_up_pending', label: 'Follow-up pending' },
]

const CLOSED_STATUS = 'closed'

function matchesStatus(referral, filter) {
  if (!filter || filter === 'all') return true
  if (filter === 'open') return isOpenStatus(referral.status)
  if (filter === 'closed') return isTerminalStatus(referral.status)
  if (filter === 'closed_exact') return referral.status === CLOSED_STATUS
  return referral.status === filter
}

export function filterReferrals(referrals = [], { search = '', status = 'all' } = {}) {
  const term = (search || '').trim().toLowerCase()

  return referrals
    .filter((referral) => matchesStatus(referral, status))
    .filter((referral) => {
      if (!term) return true
      const haystack = [
        referral.patient_name,
        referral.referral_number,
        referral.id,
        referral.specialty,
        referral.receiving_facility_name,
        getStatusMeta(referral.status).label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
}

export function paginate(items = [], page = 1, pageSize = 10) {
  const size = Math.max(1, pageSize)
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const clamped = Math.min(Math.max(1, page), pageCount)
  const start = (clamped - 1) * size

  return {
    items: items.slice(start, start + size),
    page: clamped,
    pageCount,
    total: items.length,
    pageSize: size,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + size, items.length),
  }
}

export function summariseReferrals(referrals = []) {
  return {
    total: referrals.length,
    open: referrals.filter((referral) => isOpenStatus(referral.status)).length,
    closed: referrals.filter((referral) => referral.status === CLOSED_STATUS).length,
    awaiting: referrals.filter((referral) => ['issued', 'pending_ack'].includes(referral.status))
      .length,
  }
}
