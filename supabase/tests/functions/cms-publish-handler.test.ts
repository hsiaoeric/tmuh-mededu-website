import { describe, expect, it, vi } from 'vitest'
import { createPublishHandler } from '../../functions/cms-publish/handler.ts'
import { PublishError } from '../../functions/cms-publish/errors.ts'

const origin = 'http://127.0.0.1:5173'
const requestBody = { documentId: '11111111-1111-4111-8111-111111111111', revisionId: '22222222-2222-4222-8222-222222222222', expectedEditVersion: 3 }

function request(body: unknown = requestBody, headers: HeadersInit = {}): Request {
  return new Request('http://localhost/functions/v1/cms-publish', {
    method: 'POST',
    headers: { origin, authorization: 'Bearer token', 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('cms-publish HTTP boundary', () => {
  const dependencies = {
    authenticate: vi.fn().mockResolvedValue({ actorId: '33333333-3333-4333-8333-333333333333' }),
    prepare: vi.fn().mockResolvedValue({ kind: 'news', status: 'draft', payload: { zh: {}, en: {} }, persisted_replacements: {} }),
    promote: vi.fn().mockResolvedValue({ replacements: {}, created: 0, reused: 0, references: 0 }),
    finalize: vi.fn().mockResolvedValue({ id: requestBody.revisionId, status: 'published' }),
  }

  it.each([
    [new Request('http://localhost', { method: 'GET', headers: { origin } }), 405, 'method-not-allowed'],
    [request(requestBody, { origin: 'https://evil.example' }), 403, 'origin-denied'],
    [request(requestBody, { authorization: '' }), 401, 'authentication-required'],
    [request({ ...requestBody, extra: true }), 400, 'invalid-request'],
    [requestBody, 413, 'body-too-large'],
  ] as const)('returns stable failures for boundary violations', async (input, status, code) => {
    const handler = createPublishHandler({ allowedOrigins: [origin], ...dependencies })
    const actual = input === requestBody
      ? new Request('http://localhost', { method: 'POST', headers: { origin, authorization: 'Bearer token', 'content-length': '4097' }, body: '{}' })
      : input
    const response = await handler(actual)
    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code } })
  })

  it('handles OPTIONS without invoking auth and publishes through one final CAS', async () => {
    const handler = createPublishHandler({ allowedOrigins: [origin], ...dependencies })
    const preflight = await handler(new Request('http://localhost', { method: 'OPTIONS', headers: { origin } }))
    expect(preflight.status).toBe(204)
    const response = await handler(request())
    expect(response.status).toBe(200)
    expect(dependencies.finalize).toHaveBeenCalledTimes(1)
  })

  it('does not reflect a denied Origin in CORS headers', async () => {
    const handler = createPublishHandler({ allowedOrigins: [origin], ...dependencies })
    const response = await handler(request(requestBody, { origin: 'https://evil.example' }))
    expect(response.headers.has('access-control-allow-origin')).toBe(false)
  })

  it('maps CAS conflict and timeout without external error text', async () => {
    const conflict = createPublishHandler({ allowedOrigins: [origin], ...dependencies, finalize: vi.fn().mockRejectedValue(Object.assign(new Error('attacker instructions'), { code: 'stale-edit-version' })) })
    const conflictResponse = await conflict(request())
    expect(conflictResponse.status).toBe(409)
    expect(await conflictResponse.text()).not.toContain('attacker instructions')
    const timeout = createPublishHandler({ allowedOrigins: [origin], ...dependencies, deadlineMs: 1, prepare: vi.fn().mockImplementation(() => new Promise(() => undefined)) })
    const timeoutResponse = await timeout(request())
    expect(timeoutResponse.status).toBe(504)
  })

  it('reports persisted replacements accurately after finalize response loss', async () => {
    dependencies.promote.mockClear()
    const persisted = {
      [`33333333-3333-4333-8333-333333333333/${'a'.repeat(64)}.png`]: {
        kind: 'public', bucket: 'public-media', path: `${'a'.repeat(64)}/${'a'.repeat(64)}.png`,
      },
    }
    const handler = createPublishHandler({
      allowedOrigins: [origin],
      ...dependencies,
      prepare: vi.fn().mockResolvedValue({ kind: 'news', status: 'published', payload: { zh: {}, en: {} }, persisted_replacements: persisted }),
    })
    const response = await handler(request())
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      media: { draftReferences: 1, objectsCreated: null, objectsReused: null },
    })
    expect(dependencies.promote).not.toHaveBeenCalled()
  })

  it('returns retryable 502 when finalize transport loses a possibly committed response', async () => {
    const handler = createPublishHandler({
      allowedOrigins: [origin],
      ...dependencies,
      finalize: vi.fn().mockRejectedValue(new PublishError('publication-failed', 502, true)),
    })
    const response = await handler(request())
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: 'publication-failed', retryable: true } })
  })
})
