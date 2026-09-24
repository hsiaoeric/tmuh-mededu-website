import { createClient } from '@supabase/supabase-js'
import { PublishError } from './errors.ts'

type AuthConfiguration = {
  readonly url: string
  readonly publishableKey: string
  readonly timeoutMs: number
}
type GatewayError = { readonly status?: number }
export type AuthGateway = {
  readonly getUser: (token: string, signal: AbortSignal) => Promise<{ readonly user: { readonly id: string } | null; readonly error: GatewayError | null }>
  readonly isAdmin: (signal: AbortSignal) => Promise<{ readonly value: boolean | null; readonly error: GatewayError | null }>
}

function timeout(signal: AbortSignal): never {
  if (signal.aborted) throw new PublishError('deadline-exceeded', 504, true, { cause: signal.reason })
  throw new PublishError('publication-failed', 502, true)
}

export async function authenticateWithGateway(gateway: AuthGateway, token: string, signal: AbortSignal): Promise<{ readonly actorId: string }> {
  if (signal.aborted) return timeout(signal)
  let identity: Awaited<ReturnType<AuthGateway['getUser']>>
  try {
    identity = await gateway.getUser(token, signal)
  } catch (error) {
    if (signal.aborted) return timeout(signal)
    throw new PublishError('publication-failed', 502, true, { cause: error })
  }
  if (signal.aborted) return timeout(signal)
  if (identity.error !== null) {
    if (identity.error.status === 401 || identity.error.status === 403) throw new PublishError('authentication-required', 401, false)
    throw new PublishError('publication-failed', 502, true)
  }
  if (identity.user === null) throw new PublishError('authentication-required', 401, false)
  let admin: Awaited<ReturnType<AuthGateway['isAdmin']>>
  try {
    admin = await gateway.isAdmin(signal)
  } catch (error) {
    if (signal.aborted) return timeout(signal)
    throw new PublishError('publication-failed', 502, true, { cause: error })
  }
  if (signal.aborted) return timeout(signal)
  if (admin.error !== null) throw new PublishError('publication-failed', 502, true)
  if (admin.value !== true) throw new PublishError('administrator-required', 403, false)
  return { actorId: identity.user.id }
}

export function createAuthenticator(config: AuthConfiguration) {
  const gateway = (token: string, operationSignal: AbortSignal): AuthGateway => {
    const client = createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
        fetch: (input, init) => fetch(input, {
          ...init,
          signal: AbortSignal.any([operationSignal, init?.signal].filter((value): value is AbortSignal => value instanceof AbortSignal)),
        }),
      },
    })
    return {
      getUser: async (value, _signal) => {
        const result = await client.auth.getUser(value)
        return { user: result.data.user, error: result.error === null ? null : { status: result.error.status } }
      },
      isAdmin: async (signal) => {
        const result = await client.rpc('is_cms_admin').abortSignal(signal)
        return { value: result.data, error: result.error === null ? null : {} }
      },
    }
  }
  return (token: string, signal: AbortSignal) => {
    const operationSignal = AbortSignal.any([signal, AbortSignal.timeout(config.timeoutMs)])
    return authenticateWithGateway(gateway(token, operationSignal), token, operationSignal)
  }
}
