/**
 * Canonical mapping between the database referral lifecycle and the
 * seven-stage workflow shown in the UI.
 *
 * The database is authoritative; this module only decides how each raw status
 * is labelled, coloured and positioned on the visual timeline.
 */

export const WORKFLOW_STAGES = [
  'Created',
  'Submitted',
  'Accepted',
  'Appointment',
  'Consultation',
  'Follow-up',
  'Closed',
]

export const STATUS_META = {
  draft: { label: 'Draft', stage: 0, variant: 'default' },
  issued: { label: 'Issued', stage: 1, variant: 'info' },
  pending_ack: { label: 'Awaiting acknowledgement', stage: 1, variant: 'warning' },
  acknowledged: { label: 'Acknowledged', stage: 2, variant: 'info' },
  arrived: { label: 'Patient arrived', stage: 3, variant: 'teal' },
  outcome_recorded: { label: 'Outcome recorded', stage: 4, variant: 'success' },
  back_referral_pending: { label: 'Back-referral pending', stage: 5, variant: 'warning' },
  back_referral_completed: { label: 'Back-referral complete', stage: 5, variant: 'success' },
  follow_up_pending: { label: 'Follow-up pending', stage: 5, variant: 'warning' },
  follow_up_completed: { label: 'Follow-up complete', stage: 5, variant: 'success' },
  closed: { label: 'Closed', stage: 6, variant: 'success' },
  rejected: { label: 'Rejected', stage: 6, variant: 'danger' },
  cancelled: { label: 'Cancelled', stage: 6, variant: 'default' },
}

const CLOSED = new Set(['closed'])
const TERMINAL = new Set(['closed', 'rejected', 'cancelled'])

export function getStatusMeta(status) {
  if (STATUS_META[status]) return STATUS_META[status]
  return {
    label: status ? status.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Unknown',
    stage: 0,
    variant: 'default',
  }
}

export function getStageIndex(status) {
  return getStatusMeta(status).stage
}

export function isClosedStatus(status) {
  return CLOSED.has(status)
}

export function isTerminalStatus(status) {
  return TERMINAL.has(status)
}

/** True when the referral still needs action before it can be closed. */
export function isOpenStatus(status) {
  return !TERMINAL.has(status)
}
