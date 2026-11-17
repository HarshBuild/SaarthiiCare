import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirmation,
  passwordStrength,
} from './authValidation.js'

test('validateEmail accepts a normal address and rejects malformed input', () => {
  assert.equal(validateEmail('priya.sharma@saarthii.in'), null)
  assert.equal(validateEmail('  doctor@phc.gov.in '), null)
  assert.equal(validateEmail(''), 'Email is required')
  assert.equal(validateEmail('not-an-email'), 'Enter a valid email address')
  assert.equal(validateEmail('a@b'), 'Enter a valid email address')
})

test('validateFullName requires at least two characters', () => {
  assert.equal(validateFullName('Dr. Priya Sharma'), null)
  assert.equal(validateFullName(''), 'Full name is required')
  assert.equal(validateFullName('A'), 'Full name must be at least 2 characters')
  assert.equal(validateFullName('  Ravi Kumar  '), null)
})

test('validatePassword enforces minimum length and character mix', () => {
  assert.equal(validatePassword('Password123'), null)
  assert.equal(validatePassword(''), 'Password is required')
  assert.equal(validatePassword('short1'), 'Password must be at least 8 characters')
  assert.equal(validatePassword('allletters'), 'Password must include a number')
  assert.equal(validatePassword('12345678'), 'Password must include a letter')
})

test('validatePasswordConfirmation requires an exact match', () => {
  assert.equal(validatePasswordConfirmation('Password123', 'Password123'), null)
  assert.equal(
    validatePasswordConfirmation('Password123', 'Password124'),
    'Passwords do not match',
  )
})

test('passwordStrength scores weak to strong passwords', () => {
  assert.equal(passwordStrength(''), 0)
  assert.equal(passwordStrength('abc'), 1)
  assert.equal(passwordStrength('abcdefgh'), 2)
  assert.equal(passwordStrength('abcdefg1'), 3)
  assert.equal(passwordStrength('Abcdefg1!'), 4)
})
