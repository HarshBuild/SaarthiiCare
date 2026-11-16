import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSignedDownloadUrl,
  createSignedDownloadUrls,
  deleteReferralDocument,
  generateObjectPath,
  listReferralDocuments,
  uploadReferralDocument,
  validateFile,
} from './storageService.js'

test('validateFile rejects missing files', () => {
  const result = validateFile(null)
  assert.equal(result.valid, false)
  assert.equal(result.error, 'No file provided.')
})

test('validateFile rejects oversized files', () => {
  const file = { size: 11 * 1024 * 1024, type: 'application/pdf' }
  const result = validateFile(file)
  assert.equal(result.valid, false)
  assert.ok(result.error.includes('exceeds 10 MiB limit'))
})

test('validateFile rejects unsupported MIME types', () => {
  const file = { size: 1024, type: 'text/html' }
  const result = validateFile(file)
  assert.equal(result.valid, false)
  assert.ok(result.error.includes('not allowed'))
})

test('validateFile accepts valid files', () => {
  const file = { size: 1024, type: 'application/pdf' }
  const result = validateFile(file)
  assert.equal(result.valid, true)
})

test('generateObjectPath cleans non-alphanumeric characters', () => {
  const path = generateObjectPath('fac-123', 'ref-456', 'my document (1).pdf')
  assert.equal(path, 'fac-123/ref-456/my_document__1_.pdf')
})

test('uploadReferralDocument calls supabase storage upload', async () => {
  let uploadedPath = null
  let uploadedFile = null
  const fakeClient = {
    storage: {
      from(bucket) {
        assert.equal(bucket, 'referral-documents')
        return {
          upload(path, file) {
            uploadedPath = path
            uploadedFile = file
            return Promise.resolve({
              data: { path, fullPath: `${bucket}/${path}` },
              error: null,
            })
          },
        }
      },
    },
  }

  const file = { name: 'test.pdf', size: 1024, type: 'application/pdf' }
  const result = await uploadReferralDocument({
    facilityId: 'fac-1',
    referralId: 'ref-1',
    file,
    client: fakeClient,
  })

  assert.equal(result.path, 'fac-1/ref-1/test.pdf')
  assert.equal(result.fullPath, 'referral-documents/fac-1/ref-1/test.pdf')
  assert.equal(uploadedPath, 'fac-1/ref-1/test.pdf')
  assert.equal(uploadedFile, file)
})

test('uploadReferralDocument translates RLS policy errors', async () => {
  const fakeClient = {
    storage: {
      from() {
        return {
          upload() {
            return Promise.resolve({
              data: null,
              error: { message: 'new row violates row-level security policy' },
            })
          },
        }
      },
    },
  }

  const file = { name: 'test.pdf', size: 1024, type: 'application/pdf' }
  await assert.rejects(
    uploadReferralDocument({
      facilityId: 'fac-1',
      referralId: 'ref-1',
      file,
      client: fakeClient,
    }),
    /Upload denied: you do not have access to this facility/,
  )
})

test('createSignedDownloadUrl returns signedUrl', async () => {
  const fakeClient = {
    storage: {
      from() {
        return {
          createSignedUrl(path, expiresIn) {
            assert.equal(path, 'fac-1/ref-1/test.pdf')
            assert.equal(expiresIn, 3600)
            return Promise.resolve({
              data: { signedUrl: 'https://example.com/signed?token=xyz' },
              error: null,
            })
          },
        }
      },
    },
  }

  const url = await createSignedDownloadUrl('fac-1/ref-1/test.pdf', 3600, fakeClient)
  assert.equal(url, 'https://example.com/signed?token=xyz')
})

test('listReferralDocuments lists files by facility/referral prefix', async () => {
  const fakeClient = {
    storage: {
      from() {
        return {
          list(prefix) {
            assert.equal(prefix, 'fac-1/ref-1/')
            return Promise.resolve({
              data: [
                { name: 'file1.pdf', id: '1', updated_at: '2026-11-16T00:00:00Z', metadata: {} },
              ],
              error: null,
            })
          },
        }
      },
    },
  }

  const docs = await listReferralDocuments('fac-1', 'ref-1', fakeClient)
  assert.equal(docs.length, 1)
  assert.equal(docs[0].name, 'file1.pdf')
})