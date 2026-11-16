import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'

/**
 * Build a channel configuration object from the subscription parameters.
 * Extracted for testability so the hook logic can be exercised without a
 * real Supabase client.
 *
 * @param {string} table
 * @param {{ filter?: string, event?: string }} options
 * @returns {{ channelName: string, event: string, schema: string, table: string, filter?: string }}
 */
export function buildChannelConfig(table, { filter, event = '*' } = {}) {
  return {
    channelName: `realtime:${table}`,
    event,
    schema: 'public',
    table,
    filter,
  }
}

/**
 * Subscribe a channel using a Supabase client and configuration.
 *
 * @param {object} client - Supabase client (or a duck-typed stand-in).
 * @param {object} config - Output of `buildChannelConfig`.
 * @param {Function} onStatus - Status callback.
 * @param {Function} onChange - Payload callback.
 * @returns {object} Channel handle.
 */
export function subscribeChannel(client, config, onStatus, onChange) {
  let builder = client.channel(config.channelName)

  const payload = {
    event: config.event,
    schema: config.schema,
    table: config.table,
  }

  if (config.filter) {
    payload.filter = config.filter
  }

  builder = builder.on('postgres_changes', payload, (changePayload) => {
    if (onChange) onChange(changePayload)
  })

  return builder.subscribe(onStatus)
}

/**
 * Generic Realtime subscription hook.
 *
 * @param {string} table - Table name in the `supabase_realtime` publication.
 * @param {Object} options - Subscription options.
 * @param {string} [options.filter] - PostgREST filter (e.g. "facility_id=eq.xxx").
 * @param {string} [options.event] - Event type: 'INSERT', 'UPDATE', 'DELETE', or '*' for all.
 * @param {Function} [options.onChange] - Callback(payload) for each change.
 * @returns {{ subscribe: Function, unsubscribe: Function, status: string, error: Error|null }}
 */
export function useRealtimeSubscription(table, options = {}) {
  const { filter, event = '*', onChange } = options
  const channelRef = useRef(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'subscribing' | 'subscribed' | 'error'
  const [error, setError] = useState(null)

  const channelConfig = buildChannelConfig(table, { filter, event })

  const subscribe = useCallback(() => {
    if (!supabase) {
      setError(new Error('Supabase client not configured.'))
      setStatus('error')
      return
    }

    if (channelRef.current) {
      // Already subscribed
      return
    }

    setStatus('subscribing')
    setError(null)

    const channel = subscribeChannel(
      supabase,
      channelConfig,
      (subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          setStatus('subscribed')
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('error')
          setError(new Error(`Realtime subscription failed: ${subStatus}`))
        } else if (subStatus === 'CLOSED') {
          setStatus('idle')
        }
      },
      onChange,
    )

    channelRef.current = channel
  }, [table, filter, event, onChange, channelConfig])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current)
      channelRef.current = null
      setStatus('idle')
    }
  }, [])

  // Auto-subscribe on mount if enabled
  useEffect(() => {
    if (options.enabled !== false) {
      subscribe()
    }
    return () => unsubscribe()
  }, [subscribe, unsubscribe, options.enabled])

  return { subscribe, unsubscribe, status, error }
}

/**
 * Convenience hook for referral lifecycle events.
 * Subscribes to the referral and its events/outcomes/back-referrals/follow-ups.
 *
 * @param {string} referralId - UUID of the referral to track.
 * @param {Function} [onChange] - Callback(payload) for any change.
 * @returns {{ subscribe: Function, unsubscribe: Function, status: string, error: Error|null }}
 */
export function useReferralRealtime(referralId, onChange) {
  const referralSub = useRealtimeSubscription('referrals', {
    filter: `id=eq.${referralId}`,
    event: '*',
    onChange,
  })

  const eventsSub = useRealtimeSubscription('referral_events', {
    filter: `referral_id=eq.${referralId}`,
    event: '*',
    onChange,
  })

  const outcomesSub = useRealtimeSubscription('referral_outcomes', {
    filter: `referral_id=eq.${referralId}`,
    event: '*',
    onChange,
  })

  const backReferralsSub = useRealtimeSubscription('back_referrals', {
    filter: `referral_id=eq.${referralId}`,
    event: '*',
    onChange,
  })

  const followUpsSub = useRealtimeSubscription('follow_up_tasks', {
    filter: `referral_id=eq.${referralId}`,
    event: '*',
    onChange,
  })

  // Aggregate status: subscribed only when all are subscribed
  const statuses = [
    referralSub.status,
    eventsSub.status,
    outcomesSub.status,
    backReferralsSub.status,
    followUpsSub.status,
  ]
  const status = statuses.every((s) => s === 'subscribed')
    ? 'subscribed'
    : statuses.some((s) => s === 'error')
    ? 'error'
    : 'subscribing'

  const error = [
    referralSub.error,
    eventsSub.error,
    outcomesSub.error,
    backReferralsSub.error,
    followUpsSub.error,
  ].find((e) => e !== null)

  const subscribe = useCallback(() => {
    referralSub.subscribe()
    eventsSub.subscribe()
    outcomesSub.subscribe()
    backReferralsSub.subscribe()
    followUpsSub.subscribe()
  }, [referralSub, eventsSub, outcomesSub, backReferralsSub, followUpsSub])

  const unsubscribe = useCallback(() => {
    referralSub.unsubscribe()
    eventsSub.unsubscribe()
    outcomesSub.unsubscribe()
    backReferralsSub.unsubscribe()
    followUpsSub.unsubscribe()
  }, [referralSub, eventsSub, outcomesSub, backReferralsSub, followUpsSub])

  return { subscribe, unsubscribe, status, error }
}

/**
 * Hook for facility-scoped realtime: all referrals/events for a facility.
 *
 * @param {string} facilityId - UUID of the facility.
 * @param {Function} [onChange] - Callback(payload) for any change.
 */
export function useFacilityRealtime(facilityId, onChange) {
  const referralsSub = useRealtimeSubscription('referrals', {
    filter: `or(sending_facility_id.eq.${facilityId},receiving_facility_id.eq.${facilityId})`,
    event: '*',
    onChange,
  })

  const eventsSub = useRealtimeSubscription('referral_events', {
    filter: `facility_id=eq.${facilityId}`,
    event: '*',
    onChange,
  })

  const outcomesSub = useRealtimeSubscription('referral_outcomes', {
    filter: `facility_id=eq.${facilityId}`,
    event: '*',
    onChange,
  })

  const statuses = [
    referralsSub.status,
    eventsSub.status,
    outcomesSub.status,
  ]
  const status = statuses.every((s) => s === 'subscribed')
    ? 'subscribed'
    : statuses.some((s) => s === 'error')
    ? 'error'
    : 'subscribing'

  const error = [referralsSub.error, eventsSub.error, outcomesSub.error].find(
    (e) => e !== null,
  )

  const subscribe = useCallback(() => {
    referralsSub.subscribe()
    eventsSub.subscribe()
    outcomesSub.subscribe()
  }, [referralsSub, eventsSub, outcomesSub])

  const unsubscribe = useCallback(() => {
    referralsSub.unsubscribe()
    eventsSub.unsubscribe()
    outcomesSub.unsubscribe()
  }, [referralsSub, eventsSub, outcomesSub])

  return { subscribe, unsubscribe, status, error }
}

/**
 * Hook for user notifications and escalations.
 *
 * @param {string} userId - Auth user UUID.
 * @param {Function} [onChange] - Callback(payload) for any change.
 */
export function useUserNotificationsRealtime(userId, onChange) {
  const notificationsSub = useRealtimeSubscription('notifications', {
    filter: `user_id=eq.${userId}`,
    event: '*',
    onChange,
  })

  const escalationsSub = useRealtimeSubscription('escalations', {
    filter: `assigned_to=eq.${userId}`,
    event: '*',
    onChange,
  })

  const statuses = [notificationsSub.status, escalationsSub.status]
  const status = statuses.every((s) => s === 'subscribed')
    ? 'subscribed'
    : statuses.some((s) => s === 'error')
    ? 'error'
    : 'subscribing'

  const error = [notificationsSub.error, escalationsSub.error].find(
    (e) => e !== null,
  )

  const subscribe = useCallback(() => {
    notificationsSub.subscribe()
    escalationsSub.subscribe()
  }, [notificationsSub, escalationsSub])

  const unsubscribe = useCallback(() => {
    notificationsSub.unsubscribe()
    escalationsSub.unsubscribe()
  }, [notificationsSub, escalationsSub])

  return { subscribe, unsubscribe, status, error }
}