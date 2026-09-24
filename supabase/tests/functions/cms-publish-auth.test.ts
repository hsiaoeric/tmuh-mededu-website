import { describe, expect, it, vi } from 'vitest'
import { authenticateWithGateway } from '../../functions/cms-publish/auth.ts'

const signal = new AbortController().signal
const user = { id: '11111111-1111-4111-8111-111111111111' }

describe('cms-publish authentication adapter', () => {
  it('maps only invalid identity and exact false to nonretryable denial', async () => {
    await expect(authenticateWithGateway({ getUser: vi.fn().mockResolvedValue({ user: null, error: { status: 401 } }), isAdmin: vi.fn() }, 'bad', signal))
      .rejects.toMatchObject({ code: 'authentication-required', status: 401, retryable: false })
    await expect(authenticateWithGateway({ getUser: vi.fn().mockResolvedValue({ user, error: null }), isAdmin: vi.fn().mockResolvedValue({ value: false, error: null }) }, 'token', signal))
      .rejects.toMatchObject({ code: 'administrator-required', status: 403, retryable: false })
  })

  it.each([
    ['identity network', { getUser: vi.fn().mockRejectedValue(new TypeError('network')), isAdmin: vi.fn() }, 502],
    ['identity backend', { getUser: vi.fn().mockResolvedValue({ user: null, error: { status: 500 } }), isAdmin: vi.fn() }, 502],
    ['admin network', { getUser: vi.fn().mockResolvedValue({ user, error: null }), isAdmin: vi.fn().mockRejectedValue(new TypeError('network')) }, 502],
    ['admin backend', { getUser: vi.fn().mockResolvedValue({ user, error: null }), isAdmin: vi.fn().mockResolvedValue({ value: null, error: { status: 503 } }) }, 502],
  ] as const)('maps %s failure to retryable upstream error', async (_name, gateway, status) => {
    await expect(authenticateWithGateway(gateway, 'token', signal)).rejects.toMatchObject({ status, retryable: true })
  })

  it('maps an auth timeout to retryable 504', async () => {
    const controller = new AbortController()
    controller.abort(new DOMException('deadline', 'TimeoutError'))
    await expect(authenticateWithGateway({ getUser: vi.fn(), isAdmin: vi.fn() }, 'token', controller.signal))
      .rejects.toMatchObject({ code: 'deadline-exceeded', status: 504, retryable: true })
  })

  it.each(['identity', 'admin'] as const)('maps %s operation timeout to retryable 504', async (stage) => {
    const controller = new AbortController()
    const timeout = () => {
      controller.abort(new DOMException('deadline', 'TimeoutError'))
      throw new DOMException('deadline', 'TimeoutError')
    }
    const gateway = stage === 'identity'
      ? { getUser: vi.fn(timeout), isAdmin: vi.fn() }
      : { getUser: vi.fn().mockResolvedValue({ user, error: null }), isAdmin: vi.fn(timeout) }
    await expect(authenticateWithGateway(gateway, 'token', controller.signal))
      .rejects.toMatchObject({ code: 'deadline-exceeded', status: 504, retryable: true })
  })
})
