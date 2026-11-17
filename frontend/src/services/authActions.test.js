import assert from 'node:assert/strict'
import test from 'node:test'

import { createAuthActions } from './authActions.js'

function fakeClient(overrides = {}) {
  const calls = []
  const client = {
    auth: {
      signUp: async (payload) => {
        calls.push(['signUp', payload])
        return overrides.signUp?.() ?? { data: { user: { id: 'u1' }, session: null }, error: null }
      },
      resetPasswordForEmail: async (email, options) => {
        calls.push(['resetPasswordForEmail', email, options])
        return overrides.resetPasswordForEmail?.() ?? { data: {}, error: null }
      },
      updateUser: async (payload) => {
        calls.push(['updateUser', payload])
        return overrides.updateUser?.() ?? { data: { user: { id: 'u1' } }, error: null }
      },
      resend: async (payload) => {
        calls.push(['resend', payload])
        return overrides.resend?.() ?? { data: {}, error: null }
      },
    },
  }
  return { client, calls }
}

test('signUp forwards email, password and profile metadata', async () => {
  const { client, calls } = fakeClient()
  const actions = createAuthActions(client)

  const result = await actions.signUp({
    email: 'new.doctor@saarthii.in',
    password: 'Password123',
    fullName: 'Dr. New Doctor',
    phone: '+919000000000',
    requestedRole: 'hospital_staff',
  })

  assert.equal(calls[0][0], 'signUp')
  assert.deepEqual(calls[0][1], {
    email: 'new.doctor@saarthii.in',
    password: 'Password123',
    options: {
      data: {
        full_name: 'Dr. New Doctor',
        phone: '+919000000000',
        requested_role: 'hospital_staff',
      },
    },
  })
  assert.equal(result.user.id, 'u1')
})

test('signUp throws the Supabase error message', async () => {
  const { client } = fakeClient({
    signUp: () => ({ data: null, error: { message: 'User already registered' } }),
  })
  const actions = createAuthActions(client)

  await assert.rejects(
    () => actions.signUp({ email: 'a@b.co', password: 'Password123', fullName: 'A B' }),
    /User already registered/,
  )
})

test('requestPasswordReset passes the redirect URL', async () => {
  const { client, calls } = fakeClient()
  const actions = createAuthActions(client)

  await actions.requestPasswordReset('a@b.co', 'http://localhost:5173/reset-password')

  assert.deepEqual(calls[0], [
    'resetPasswordForEmail',
    'a@b.co',
    { redirectTo: 'http://localhost:5173/reset-password' },
  ])
})

test('updatePassword calls updateUser with the new password', async () => {
  const { client, calls } = fakeClient()
  const actions = createAuthActions(client)

  await actions.updatePassword('NewPassword123')

  assert.deepEqual(calls[0], ['updateUser', { password: 'NewPassword123' }])
})

test('resendConfirmation calls auth.resend for signup', async () => {
  const { client, calls } = fakeClient()
  const actions = createAuthActions(client)

  await actions.resendConfirmation('a@b.co', 'http://localhost:5173/login')

  assert.deepEqual(calls[0], [
    'resend',
    { type: 'signup', email: 'a@b.co', options: { emailRedirectTo: 'http://localhost:5173/login' } },
  ])
})
