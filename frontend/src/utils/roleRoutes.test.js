import assert from 'node:assert/strict'
import test from 'node:test'

import { dashboardPathForRole } from './roleRoutes.js'

test('maps PHC staff to the PHC dashboard', () => {
  assert.equal(dashboardPathForRole('phc_staff'), '/phc-dashboard')
})

test('maps hospital staff to the hospital dashboard', () => {
  assert.equal(dashboardPathForRole('hospital_staff'), '/hospital-dashboard')
})

test('maps supervisors and admins to the supervisor dashboard', () => {
  assert.equal(dashboardPathForRole('supervisor'), '/supervisor-dashboard')
  assert.equal(dashboardPathForRole('admin'), '/supervisor-dashboard')
})

test('falls back to the PHC dashboard for unknown or missing roles', () => {
  assert.equal(dashboardPathForRole(undefined), '/phc-dashboard')
  assert.equal(dashboardPathForRole(null), '/phc-dashboard')
  assert.equal(dashboardPathForRole('something_else'), '/phc-dashboard')
})
