import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterReferrals,
  paginate,
  summariseReferrals,
  STATUS_FILTERS,
} from './referralQuery.js'

const REFERRALS = [
  {
    id: 'r1',
    referral_number: 'REF-2026-001',
    patient_name: 'Meera Patel',
    receiving_facility_name: 'District Hospital Bareilly',
    specialty: 'Cardiology',
    status: 'closed',
    created_at: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'r2',
    referral_number: 'REF-2026-002',
    patient_name: 'Rajesh Gupta',
    receiving_facility_name: 'District Hospital Bareilly',
    specialty: 'Orthopaedics',
    status: 'pending_ack',
    created_at: '2026-11-10T00:00:00.000Z',
  },
  {
    id: 'r3',
    referral_number: 'REF-2026-003',
    patient_name: 'Sunita Devi',
    receiving_facility_name: 'PHC Rampur',
    specialty: 'Cardiology',
    status: 'outcome_recorded',
    created_at: '2026-11-12T00:00:00.000Z',
  },
]

test('searches by patient name, referral number and specialty', () => {
  assert.deepEqual(filterReferrals(REFERRALS, { search: 'meera' }).map((r) => r.id), ['r1'])
  assert.deepEqual(filterReferrals(REFERRALS, { search: 'REF-2026-003' }).map((r) => r.id), ['r3'])
  assert.deepEqual(filterReferrals(REFERRALS, { search: 'cardio' }).map((r) => r.id), ['r3', 'r1'])
})

test('filters open and closed referrals', () => {
  assert.deepEqual(filterReferrals(REFERRALS, { status: 'open' }).map((r) => r.id), ['r3', 'r2'])
  assert.deepEqual(filterReferrals(REFERRALS, { status: 'closed' }).map((r) => r.id), ['r1'])
})

test('filters by an exact lifecycle status', () => {
  assert.deepEqual(
    filterReferrals(REFERRALS, { status: 'pending_ack' }).map((r) => r.id),
    ['r2'],
  )
})

test('sorts newest first', () => {
  assert.deepEqual(filterReferrals(REFERRALS, {}).map((r) => r.id), ['r3', 'r2', 'r1'])
})

test('status filters expose open and closed options plus real statuses', () => {
  const values = STATUS_FILTERS.map((option) => option.value)
  assert.ok(values.includes('all'))
  assert.ok(values.includes('open'))
  assert.ok(values.includes('closed'))
  assert.ok(values.includes('outcome_recorded'))
})

test('paginate clamps the page into range and reports totals', () => {
  const page1 = paginate(REFERRALS, 1, 2)
  assert.equal(page1.items.length, 2)
  assert.equal(page1.total, 3)
  assert.equal(page1.pageCount, 2)

  const overflow = paginate(REFERRALS, 99, 2)
  assert.equal(overflow.page, 2)
  assert.deepEqual(overflow.items.map((r) => r.id), ['r3'])

  const empty = paginate([], 1, 10)
  assert.deepEqual(empty.items, [])
  assert.equal(empty.pageCount, 1)
})

test('summariseReferrals counts the register by lifecycle', () => {
  const summary = summariseReferrals(REFERRALS)
  assert.equal(summary.total, 3)
  assert.equal(summary.open, 2)
  assert.equal(summary.closed, 1)
  assert.equal(summary.awaiting, 1)
})
