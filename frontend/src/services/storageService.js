import { supabase } from '../lib/supabaseClient.js'

const BUCKET = 'referral-documents'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MiB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

/**
 * Validate a file before upload.
 *
 * @param {File} file - File to validate.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' }
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds 10 MiB limit (${(file.size / 1024 / 1024).toFixed(2)} MiB).`,
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed: PDF, JPEG, PNG, WebP.`,
    }
  }

  return { valid: true }
}

/**
 * Generate the object path for a referral document.
 * Convention: <facility_uuid>/<referral_uuid>/<filename>
 *
 * @param {string} facilityId - UUID of the uploading facility.
 * @param {string} referralId - UUID of the referral.
 * @param {string} filename - Original filename.
 * @returns {string}
 */
export function generateObjectPath(facilityId, referralId, filename) {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${facilityId}/${referralId}/${cleanName}`
}

/**
 * Upload a file to the private referral-documents bucket.
 *
 * @param {Object} params
 * @param {string} params.facilityId - Uploader's facility UUID (first path segment).
 * @param {string} params.referralId - Referral UUID.
 * @param {File} params.file - File to upload.
 * @param {Function} [params.onProgress] - Callback(progress: 0..1).
 * @param {object} [params.client] - Optional Supabase client override (for tests).
 * @returns {Promise<{ path: string, fullPath: string }>}
 */
export async function uploadReferralDocument({ facilityId, referralId, file, onProgress, client }) {
  const activeClient = client || supabase
  if (!activeClient) {
    throw new Error('Supabase client not configured.')
  }

  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const objectPath = generateObjectPath(facilityId, referralId, file.name)

  const { data, error } = await activeClient.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: onProgress
        ? (progress) => onProgress(progress.loaded / progress.total)
        : undefined,
    })

  if (error) {
    // Surface common policy violations
    if (error.message?.includes('row-level security')) {
      throw new Error('Upload denied: you do not have access to this facility.')
    }
    throw new Error(`Upload failed: ${error.message}`)
  }

  return {
    path: data.path,
    fullPath: data.fullPath,
  }
}

/**
 * Create a signed URL for downloading a referral document.
 * The URL expires after the given duration (default 1 hour).
 *
 * @param {string} objectPath - Path returned by uploadReferralDocument.
 * @param {number} [expiresIn=3600] - Expiry in seconds.
 * @param {object} [client] - Optional Supabase client override (for tests).
 * @returns {Promise<string>} Signed URL.
 */
export async function createSignedDownloadUrl(objectPath, expiresIn = 3600, client) {
  const activeClient = client || supabase
  if (!activeClient) {
    throw new Error('Supabase client not configured.')
  }

  const { data, error } = await activeClient.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, expiresIn)

  if (error) {
    throw new Error(`Could not create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Create signed URLs for multiple objects (batch).
 *
 * @param {string[]} objectPaths - Array of object paths.
 * @param {number} [expiresIn=3600] - Expiry in seconds.
 * @param {object} [client] - Optional Supabase client override (for tests).
 * @returns {Promise<{ path: string, signedUrl: string }[]>}
 */
export async function createSignedDownloadUrls(objectPaths, expiresIn = 3600, client) {
  const activeClient = client || supabase
  if (!activeClient) {
    throw new Error('Supabase client not configured.')
  }

  const { data, error } = await activeClient.storage
    .from(BUCKET)
    .createSignedUrls(objectPaths, expiresIn)

  if (error) {
    throw new Error(`Could not create signed URLs: ${error.message}`)
  }

  return data.map((item) => ({
    path: item.path,
    signedUrl: item.signedUrl,
  }))
}

/**
 * Delete a referral document.
 * Requires facility access (enforced by RLS policy).
 *
 * @param {string} objectPath - Path to delete.
 * @param {object} [client] - Optional Supabase client override (for tests).
 * @returns {Promise<void>}
 */
export async function deleteReferralDocument(objectPath, client) {
  const activeClient = client || supabase
  if (!activeClient) {
    throw new Error('Supabase client not configured.')
  }

  const { error } = await activeClient.storage.from(BUCKET).remove([objectPath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * List documents for a referral (by prefix).
 *
 * @param {string} facilityId - Facility UUID.
 * @param {string} referralId - Referral UUID.
 * @param {object} [client] - Optional Supabase client override (for tests).
 * @returns {Promise<{ name: string, id: string, updated_at: string, metadata: object }[]>}
 */
export async function listReferralDocuments(facilityId, referralId, client) {
  const activeClient = client || supabase
  if (!activeClient) {
    throw new Error('Supabase client not configured.')
  }

  const prefix = `${facilityId}/${referralId}/`

  const { data, error } = await activeClient.storage.from(BUCKET).list(prefix)

  if (error) {
    throw new Error(`List failed: ${error.message}`)
  }

  return data || []
}

/**
 * Get public URL (only works if bucket is public; ours is private).
 * Kept for completeness but will not work for private bucket.
 *
 * @param {string} objectPath
 * @returns {string}
 */
export function getPublicUrl(objectPath) {
  if (!supabase) {
    throw new Error('Supabase client not configured.')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  return data.publicUrl
}