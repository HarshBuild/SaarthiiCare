import { createClient } from '@supabase/supabase-js'

const DEFAULT_TIMEOUT_MS = 5000
const AUTH_STORAGE_KEY = 'saarthii-auth'

function readEnvironment() {
  return (typeof import.meta !== 'undefined' && import.meta.env) || {}
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normaliseUrl(value) {
  return clean(value).replace(/\/+$/, '')
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate the public Supabase configuration without creating a client.
 * The publishable key is safe for browsers only once RLS is enabled.
 */
export function getSupabaseConfigStatus(environment = readEnvironment()) {
  const url = normaliseUrl(environment.VITE_SUPABASE_URL)
  const publishableKey = clean(environment.VITE_SUPABASE_PUBLISHABLE_KEY)
  const missing = []
  const invalid = []

  if (!url) {
    missing.push('VITE_SUPABASE_URL')
  } else if (!isHttpUrl(url)) {
    invalid.push('VITE_SUPABASE_URL')
  }

  if (!publishableKey) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')
  }

  const configured = missing.length === 0 && invalid.length === 0

  return {
    configured,
    url: url || null,
    missing,
    invalid,
    hasPublishableKey: Boolean(publishableKey),
    message: configured
      ? 'Supabase browser configuration is present.'
      : 'Supabase browser configuration is incomplete. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.',
  }
}

/**
 * Create a Supabase browser client from an explicit configuration.
 * Kept as a factory so it can be tested without Vite's import.meta.env.
 */
export function createSupabaseClient({ url, publishableKey }) {
  if (!url || !publishableKey) {
    return null
  }

  return createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
    },
  })
}

const environment = readEnvironment()
const publicKey = clean(environment.VITE_SUPABASE_PUBLISHABLE_KEY)
const initialStatus = getSupabaseConfigStatus(environment)

export const supabaseConfigStatus = initialStatus
export const isSupabaseConfigured = initialStatus.configured

/**
 * Shared browser client. It is null when configuration is missing so the
 * existing application can still render and show an honest setup message.
 */
export const supabase = initialStatus.configured
  ? createSupabaseClient({
      url: initialStatus.url,
      publishableKey: publicKey,
    })
  : null

/**
 * Check whether the project Auth endpoint is reachable.
 * This is a setup diagnostic, not proof that tables or RLS are correct.
 */
export async function checkSupabaseConnection({
  config = { url: initialStatus.url, key: publicKey },
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const checkedAt = new Date().toISOString()

  if (!config?.url || !config?.key) {
    return {
      status: 'not_configured',
      reachable: false,
      httpStatus: null,
      message:
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.',
      checkedAt,
    }
  }

  if (typeof fetchImpl !== 'function') {
    return {
      status: 'unreachable',
      reachable: false,
      httpStatus: null,
      message: 'This browser does not provide fetch, so Supabase connectivity cannot be checked.',
      checkedAt,
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(`${config.url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: config.key,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    const healthy = response?.ok === true || response?.status === 200

    return {
      status: healthy ? 'reachable' : 'unhealthy',
      reachable: true,
      httpStatus: response?.status ?? null,
      message: healthy
        ? 'Supabase Auth endpoint responded successfully.'
        : 'Supabase responded, but the Auth health check was not successful.',
      checkedAt,
    }
  } catch (error) {
    return {
      status: 'unreachable',
      reachable: false,
      httpStatus: null,
      message: `Could not reach Supabase (${error?.name || 'network error'}).`,
      checkedAt,
    }
  } finally {
    clearTimeout(timer)
  }
}
