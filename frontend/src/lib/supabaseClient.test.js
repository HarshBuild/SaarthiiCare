import assert from 'node:assert/strict'
import test from 'node:test'

import {
  checkSupabaseConnection,
  createSupabaseClient,
  getSupabaseConfigStatus,
  isSupabaseConfigured,
  supabase,
} from './supabaseClient.js'

function validEnv(overrides = {}) {
  return {
    VITE_SUPABASE_URL: 'https://example.supabase.co/',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test-key',
    ...overrides,
  }
}

test('reports missing URL and publishable key', () => {
  const status = getSupabaseConfigStatus({})

  assert.equal(status.configured, false)
  assert.deepEqual(status.missing, [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ])
  assert.equal(status.hasPublishableKey, false)
})

test('normalises a valid project URL without exposing the key', () => {
  const status = getSupabaseConfigStatus(validEnv())

  assert.equal(status.configured, true)
  assert.deepEqual(status.missing, [])
  assert.deepEqual(status.invalid, [])
  assert.equal(status.url, 'https://example.supabase.co')
  assert.equal(JSON.stringify(status).includes('public-test-key'), false)
})

test('flags an invalid project URL', () => {
  const status = getSupabaseConfigStatus(
    validEnv({ VITE_SUPABASE_URL: 'not-a-url' })
  )

  assert.equal(status.configured, false)
  assert.ok(status.invalid.includes('VITE_SUPABASE_URL'))
})

test('creates a persistent client from explicit configuration', () => {
  const client = createSupabaseClient({
    url: 'https://example.supabase.co',
    publishableKey: 'public-test-key',
  })

  assert.ok(client)
  assert.equal(typeof client.auth.getSession, 'function')
})

test('does not create a client without configuration', () => {
  assert.equal(
    createSupabaseClient({ url: null, publishableKey: null }),
    null
  )
})

test('module client is null when Vite environment is absent', () => {
  assert.equal(isSupabaseConfigured, false)
  assert.equal(supabase, null)
})

test('does not call the network when connection configuration is missing', async () => {
  let called = false
  const result = await checkSupabaseConnection({
    config: { url: null, key: null },
    fetchImpl: async () => {
      called = true
    },
  })

  assert.equal(called, false)
  assert.equal(result.status, 'not_configured')
  assert.equal(result.reachable, false)
})

test('reports a reachable Auth endpoint', async () => {
  let request = null
  const result = await checkSupabaseConnection({
    config: { url: 'https://example.supabase.co', key: 'public-test-key' },
    fetchImpl: async (url, options) => {
      request = { url, options }
      return { ok: true, status: 200 }
    },
    timeoutMs: 100,
  })

  assert.equal(request.url, 'https://example.supabase.co/auth/v1/health')
  assert.equal(request.options.headers.apikey, 'public-test-key')
  assert.equal(result.status, 'reachable')
  assert.equal(result.reachable, true)
  assert.equal(JSON.stringify(result).includes('public-test-key'), false)
})

test('reports an unhealthy response without throwing', async () => {
  const result = await checkSupabaseConnection({
    config: { url: 'https://example.supabase.co', key: 'public-test-key' },
    fetchImpl: async () => ({ ok: false, status: 503 }),
  })

  assert.equal(result.status, 'unhealthy')
  assert.equal(result.reachable, true)
  assert.equal(result.httpStatus, 503)
})

test('reports network failures without leaking the key or raw error', async () => {
  const result = await checkSupabaseConnection({
    config: { url: 'https://example.supabase.co', key: 'public-test-key' },
    fetchImpl: async () => {
      throw new Error('raw network failure')
    },
  })

  assert.equal(result.status, 'unreachable')
  assert.equal(result.reachable, false)
  assert.equal(result.message.includes('raw network failure'), false)
  assert.equal(JSON.stringify(result).includes('public-test-key'), false)
})
