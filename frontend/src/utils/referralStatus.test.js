import assert from 'node:assert/strict'
import test from 'node:test'

import {
  WORKFLOW_STAGES,
  getStatusMeta,
  getStageIndex,
  isClosedStatus,
  isTerminalStatus,
} from './referralStatus.js'

test('exposes the seven user-facing workflow stages', () => {
  assert.deepEqual(WORKFLOW_STAGES, [
    'Created',
    'Submitted',
    'Accepted',
    'Appointment',
    'Consultation',
    'Follow-up',
    'Closed',
  ])
})

test('maps every backend status to a label and badge variant', () => {
  const known = [
    'draft',
    'issued',
    'pending_ack',
    'acknowledged',
    'arrived',
    'outcome_recorded',
    'back_referral_pending',
    'back_referral_completed',
    'follow_up_pending',
    'follow_up_completed',
    'closed',
    'rejected',
    'cancelled',
  ]

  for (const status of known) {
    const meta = getStatusMeta(status)
    assert.ok(meta.label, `label for ${status}`)
    assert.ok(meta.variant, `variant for ${status}`)
    assert.equal(typeof meta.stage, 'number')
  }
})

test('falls back gracefully for unknown statuses', () => {
  const meta = getStatusMeta('something_new')
  assert.equal(meta.label, 'Something new')
  assert.equal(meta.stage, 0)
})

test('maps lifecycle statuses onto stage indexes', () => {
  assert.equal(getStageIndex('draft'), 0)
  assert.equal(getStageIndex('pending_ack'), 1)
  assert.equal(getStageIndex('acknowledged'), 2)
  assert.equal(getStageIndex('arrived'), 3)
  assert.equal(getStageIndex('outcome_recorded'), 4)
  assert.equal(getStageIndex('follow_up_pending'), 5)
  assert.equal(getStageIndex('follow_up_completed'), 5)
  assert.equal(getStageIndex('closed'), 6)
})

test('detects closed and terminal statuses', () => {
  assert.equal(isClosedStatus('closed'), true)
  assert.equal(isClosedStatus('follow_up_completed'), false)
  assert.equal(isTerminalStatus('cancelled'), true)
  assert.equal(isTerminalStatus('rejected'), true)
  assert.equal(isTerminalStatus('acknowledged'), false)
})
