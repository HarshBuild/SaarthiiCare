/**
 * Supabase Auth actions used by the registration and password recovery flows.
 *
 * Kept as a factory over a client so the exact payloads sent to Supabase can
 * be unit tested without a live project. Callers pass the shared client from
 * `lib/supabaseClient.js`.
 */

function throwIfError(result) {
  if (result?.error) {
    const error = new Error(result.error.message || 'Authentication request failed')
    error.cause = result.error
    throw error
  }
  return result?.data
}

export function createAuthActions(client) {
  if (!client) {
    throw new Error('A Supabase client is required')
  }

  return {
    /** Create an account. A DB trigger provisions the matching profile row. */
    async signUp({ email, password, fullName, phone, requestedRole }) {
      const data = throwIfError(
        await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone || null,
              // Informational only: the DB trigger always provisions phc_staff
              // and privileged roles are assigned by an administrator.
              requested_role: requestedRole || 'phc_staff',
            },
          },
        }),
      )
      return { user: data?.user ?? null, session: data?.session ?? null }
    },

    /** Send a Supabase password-recovery email. */
    async requestPasswordReset(email, redirectTo) {
      throwIfError(
        await client.auth.resetPasswordForEmail(email, {
          redirectTo,
        }),
      )
      return { sent: true }
    },

    /** Set a new password for the currently authenticated recovery session. */
    async updatePassword(newPassword) {
      const data = throwIfError(await client.auth.updateUser({ password: newPassword }))
      return { user: data?.user ?? null }
    },

    /** Re-send the signup confirmation email. */
    async resendConfirmation(email, redirectTo) {
      throwIfError(
        await client.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: redirectTo },
        }),
      )
      return { sent: true }
    },
  }
}
