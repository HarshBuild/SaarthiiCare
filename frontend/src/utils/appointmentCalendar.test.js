import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appointmentsForDay,
  buildMonthGrid,
  effectiveStatus,
  filterAppointments,
  groupAppointmentsByDate,
  summariseAppointments,
  toDateKey,
} from './appointmentCalendar.js'

const NOW = new Date('2026-11-17T12:00:00')

function at(iso) {
  return new Date(iso).toISOString()
}

const APPOINTMENTS = [
  {
    id: 'a1',
    referral_number: 'REF-2026-001',
    patient_name: 'Meera Patel',
    location: 'Cardiology OPD',
    scheduled_for: at('2026-11-17T09:00:00'),
    status: 'scheduled',
    duration_minutes: 30,
  },
  {
    id: 'a2',
    referral_number: 'REF-2026-002',
    patient_name: 'Rajesh Gupta',
    location: 'Orthopaedics OPD',
    scheduled_for: at('2026-11-17T15:00:00'),
    status: 'scheduled',
    duration_minutes: 20,
  },
  {
    id: 'a3',
    referral_number: 'REF-2026-003',
    patient_name: 'Sunita Devi',
    location: 'Cardiology OPD',
    scheduled_for: at('2026-11-18T10:00:00'),
    status: 'scheduled',
    duration_minutes: 30,
  },
  {
    id: 'a4',
    referral_number: 'REF-2026-004',
    patient_name: 'Imran Khan',
    location: 'Neurology OPD',
    scheduled_for: at('2026-11-16T10:00:00'),
    status: 'scheduled',
    duration_minutes: 30,
  },
  {
    id: 'a5',
    referral_number: 'REF-2026-005',
    patient_name: 'Lata Joshi',
    location: 'Cardiology OPD',
    scheduled_for: at('2026-11-10T10:00:00'),
    status: 'completed',
    duration_minutes: 30,
  },
  {
    id: 'a6',
    referral_number: 'REF-2026-006',
    patient_name: 'Dev Verma',
    location: 'Orthopaedics OPD',
    scheduled_for: at('2026-11-11T10:00:00'),
    status: 'cancelled',
    duration_minutes: 30,
  },
]

test('toDateKey keeps the local calendar day instead of shifting to UTC', () => {
  assert.equal(toDateKey(new Date(2026, 10, 17, 23, 30)), '2026-11-17')
  assert.equal(toDateKey('2026-11-17T00:30:00Z'), toDateKey(new Date('2026-11-17T00:30:00Z')))
  assert.equal(toDateKey('not-a-date'), '')
  assert.equal(toDateKey(null), '')
})

test('effectiveStatus marks only past days as overdue', () => {
  assert.equal(effectiveStatus(APPOINTMENTS[0], NOW), 'scheduled')
  assert.equal(effectiveStatus(APPOINTMENTS[3], NOW), 'overdue')
  assert.equal(effectiveStatus(APPOINTMENTS[4], NOW), 'completed')
  assert.equal(effectiveStatus({ status: 'cancelled', scheduled_for: at('2026-11-01T09:00:00') }, NOW), 'cancelled')
})

test('summariseAppointments counts the diary by real state', () => {
  const summary = summariseAppointments(APPOINTMENTS, NOW)
  assert.equal(summary.total, 6)
  assert.equal(summary.today, 2)
  assert.equal(summary.upcoming, 2)
  assert.equal(summary.overdue, 1)
  assert.equal(summary.completed, 1)
  assert.equal(summary.cancelled, 1)
})

test('groupAppointmentsByDate buckets and sorts by time inside a day', () => {
  const grouped = groupAppointmentsByDate(APPOINTMENTS)
  assert.deepEqual(Object.keys(grouped).sort(), [
    '2026-11-10',
    '2026-11-11',
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
  ])
  assert.deepEqual(
    appointmentsForDay(APPOINTMENTS, '2026-11-17').map((item) => item.id),
    ['a1', 'a2'],
  )
})

test('filterAppointments searches patient, referral number and location', () => {
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { search: 'sunita' }, NOW).map((item) => item.id),
    ['a3'],
  )
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { search: 'REF-2026-002' }, NOW).map((item) => item.id),
    ['a2'],
  )
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { search: 'orthopaedics' }, NOW).map((item) => item.id),
    ['a2', 'a6'],
  )
})

test('filterAppointments supports today, upcoming, overdue and exact status', () => {
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { status: 'today' }, NOW).map((item) => item.id),
    ['a1', 'a2'],
  )
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { status: 'upcoming' }, NOW).map((item) => item.id),
    ['a2', 'a3'],
  )
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { status: 'overdue' }, NOW).map((item) => item.id),
    ['a4'],
  )
  assert.deepEqual(
    filterAppointments(APPOINTMENTS, { status: 'completed' }, NOW).map((item) => item.id),
    ['a5'],
  )
})

test('buildMonthGrid returns a stable six-week grid with month boundaries', () => {
  const grid = buildMonthGrid(2026, 10, { today: NOW })
  assert.equal(grid.length, 42)
  assert.equal(grid[0].key, '2026-11-01')
  assert.equal(grid[0].inMonth, true)
  assert.equal(grid.filter((cell) => cell.inMonth).length, 30)
  assert.equal(grid.find((cell) => cell.key === '2026-11-17').isToday, true)
  assert.equal(grid.find((cell) => cell.key === '2026-11-17').inMonth, true)

  const december = buildMonthGrid(2026, 11, { today: NOW })
  assert.equal(december[0].key, '2026-11-29')
  assert.equal(december[0].inMonth, false)
  assert.equal(december[2].key, '2026-12-01')
  assert.equal(december[2].inMonth, true)
})
