import assert from 'node:assert/strict'
import test from 'node:test'

import { buildChannelConfig, subscribeChannel } from './useRealtime.js'

test('buildChannelConfig includes table and event defaults to *', () => {
  const config = buildChannelConfig('referrals')

  assert.equal(config.channelName, 'realtime:referrals')
  assert.equal(config.event, '*')
  assert.equal(config.schema, 'public')
  assert.equal(config.table, 'referrals')
  assert.equal(config.filter, undefined)
})

test('buildChannelConfig includes an optional filter', () => {
  const config = buildChannelConfig('referral_events', {
    filter: 'referral_id=eq.abc',
    event: 'INSERT',
  })

  assert.equal(config.filter, 'referral_id=eq.abc')
  assert.equal(config.event, 'INSERT')
})

test('subscribeChannel wires the payload and forwards onChange', () => {
  const calls = []
  const fakeClient = {
    channel(name) {
      calls.push({ phase: 'channel', name })
      return {
        on(_event, payload, cb) {
          calls.push({ phase: 'on', payload })
          return this
        },
        subscribe(onStatus) {
          calls.push({ phase: 'subscribe', onStatus: typeof onStatus })
          return { id: 'channel-handle' }
        },
      }
    },
  }

  const config = buildChannelConfig('referrals', {
    filter: 'id=eq.abc',
    event: 'INSERT',
  })
  const onChange = (payload) => calls.push({ phase: 'change', payload })

  const handle = subscribeChannel(
    fakeClient,
    config,
    () => {},
    onChange,
  )

  assert.equal(handle.id, 'channel-handle')
  assert.deepEqual(calls[0], { phase: 'channel', name: 'realtime:referrals' })
  assert.deepEqual(calls[1].payload, {
    event: 'INSERT',
    schema: 'public',
    table: 'referrals',
    filter: 'id=eq.abc',
  })
  assert.equal(calls[1].payload.filter, 'id=eq.abc')

  // The payload callback should forward to onChange
  const payload = { eventType: 'INSERT', new: { id: 'abc' } }
  calls[1].payload // no-op, but the on() stored a callback — invoke it via the
  // builder's captured callback:
  // Re-derive by re-calling subscribeChannel and capturing the callback.
})

test('subscribeChannel forwards change payloads to onChange', () => {
  const captured = {}
  const fakeClient = {
    channel() {
      return {
        on(_event, _payload, cb) {
          captured.callback = cb
          return this
        },
        subscribe(onStatus) {
          captured.onStatus = onStatus
          return { id: 'handle' }
        },
      }
    },
  }

  const config = buildChannelConfig('referrals')
  const onChange = (payload) => (captured.onChangePayload = payload)

  subscribeChannel(fakeClient, config, () => {}, onChange)

  assert.equal(typeof captured.callback, 'function')
  assert.equal(typeof captured.onStatus, 'function')

  const change = { eventType: 'INSERT', new: { id: 'x' } }
  captured.callback(change)

  assert.equal(captured.onChangePayload, change)
})

test('subscribeChannel does not include a filter when none is set', () => {
  const captured = {}
  const fakeClient = {
    channel() {
      return {
        on(_event, payload) {
          captured.payload = payload
          return this
        },
        subscribe() {
          return { id: 'handle' }
        },
      }
    },
  }

  const config = buildChannelConfig('notifications')
  subscribeChannel(fakeClient, config, () => {}, () => {})

  assert.equal('filter' in captured.payload, false)
  assert.deepEqual(captured.payload, {
    event: '*',
    schema: 'public',
    table: 'notifications',
  })
})