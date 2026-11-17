import assert from 'node:assert/strict'
import test from 'node:test'

import { buildNotifications } from './notificationService.js'

const NOW = new Date('2026-11-17T10:00:00.000Z')

test('flags overdue and due-today follow-up tasks', () => {
  const items = buildNotifications({
    now: NOW,
    followUps: [
      { id: 'f1', referral_id: 'r1', task_description: 'Home visit', due_date: '2026-11-15', status: 'pending' },
      { id: 'f2', referral_id: 'r1', task_description: 'Lab results', due_date: '2026-11-17', status: 'pending' },
      { id: 'f3', referral_id: 'r1', task_description: 'Done task', due_date: '2026-11-10', status: 'completed' },
    ],
  })

  assert.equal(items.length, 2)
  assert.equal(items[0].kind, 'follow_up_overdue')
  assert.equal(items[0].href, '/follow-ups')
  assert.equal(items[1].kind, 'follow_up_today')
})

test('flags referrals that are still awaiting acceptance', () => {
  const items = buildNotifications({
    now: NOW,
    referrals: [
      { id: 'r1', referral_number: 'REF-1', status: 'submitted', priority: 'urgent' },
      { id: 'r2', referral_number: 'REF-2', status: 'closed' },
    ],
  })

  assert.equal(items.length, 1)
  assert.equal(items[0].kind, 'referral_awaiting_acceptance')
  assert.equal(items[0].href, '/referrals/r1')
  assert.match(items[0].title, /urgent/i)
})

test('flags referrals open for more than seven days', () => {
  const items = buildNotifications({
    now: NOW,
    referrals: [
      { id: 'r1', referral_number: 'REF-9', status: 'accepted', created_at: '2026-11-01T00:00:00.000Z' },
      { id: 'r2', referral_number: 'REF-8', status: 'accepted', created_at: '2026-11-15T00:00:00.000Z' },
      { id: 'r3', referral_number: 'REF-7', status: 'cancelled', created_at: '2026-10-01T00:00:00.000Z' },
    ],
  })

  assert.equal(items.length, 1)
  assert.equal(items[0].kind, 'referral_stale')
  assert.equal(items[0].href, '/referrals/r1')
})

test('orders urgent items first and caps the list', () => {
  const followUps = Array.from({ length: 12 }, (_, i) => ({
    id: `f${i}`,
    task_description: `Task ${i}`,
    due_date: '2026-11-10',
    status: 'pending',
  }))

  const items = buildNotifications({ now: NOW, followUps, limit: 5 })

  assert.equal(items.length, 5)
  assert.ok(items.every((item) => item.severity === 'high'))
})
