import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { PublishError } from '../../functions/cms-publish/errors.ts'
import { createPublishHandler } from '../../functions/cms-publish/handler.ts'
import { promoteDraftMedia } from '../../functions/cms-publish/promotion.ts'
import { validPng } from './cms-publish-image-fixtures.ts'

vi.mock('../../functions/cms-publish/decoder.ts', () => ({
  decodeOneFrame: async () => ({ width: 1, height: 1 }),
}))

const origin = 'http://127.0.0.1:5173'
const actorId = '11111111-1111-4111-8111-111111111111'
const documentId = '22222222-2222-4222-8222-222222222222'
const revisionId = '33333333-3333-4333-8333-333333333333'
const bytes = Buffer.from(validPng())
const digest = createHash('sha256').update(bytes).digest('hex')
const draftPath = `${actorId}/${digest}.png`
const destination = `${digest}/${digest}.png`
const payload = { image: { kind: 'draft', bucket: 'draft-media', path: draftPath } }

function request(): Request {
  return new Request('http://localhost/functions/v1/cms-publish', {
    method: 'POST',
    headers: { origin, authorization: 'Bearer token', 'content-type': 'application/json' },
    body: JSON.stringify({ documentId, revisionId, expectedEditVersion: 1 }),
  })
}

describe('cms-publish failure safety', () => {
  it('does not finalize when promotion fails', async () => {
    // Given
    const finalize = vi.fn()
    const handler = createPublishHandler({
      allowedOrigins: [origin],
      authenticate: vi.fn().mockResolvedValue({ actorId }),
      prepare: vi.fn().mockResolvedValue({ kind: 'news', status: 'draft', payload, persisted_replacements: {} }),
      promote: vi.fn().mockRejectedValue(new PublishError('storage-failure', 502, true)),
      finalize,
    })

    // When
    const response = await handler(request())

    // Then
    expect(response.status).toBe(502)
    expect(finalize).not.toHaveBeenCalled()
  })

  it('retains a created immutable object after finalize failure and reuses it on retry', async () => {
    // Given
    const publicObjects = new Map<string, { readonly bytes: Uint8Array; readonly contentType: string }>()
    const storage = {
      downloadDraft: vi.fn().mockResolvedValue({ bytes, contentType: 'image/png' }),
      uploadPublic: vi.fn(async (path: string, uploaded: Uint8Array, contentType: string) => {
        if (publicObjects.has(path)) return 'duplicate' as const
        publicObjects.set(path, { bytes: uploaded, contentType })
        return 'created' as const
      }),
      downloadPublic: vi.fn(async (path: string) => publicObjects.get(path) ?? null),
    }
    const finalize = vi.fn()
      .mockRejectedValueOnce(new PublishError('publication-failed', 502, true))
      .mockResolvedValueOnce({ id: revisionId, status: 'published' })
    const handler = createPublishHandler({
      allowedOrigins: [origin],
      authenticate: vi.fn().mockResolvedValue({ actorId }),
      prepare: vi.fn().mockResolvedValue({ kind: 'news', status: 'draft', payload, persisted_replacements: {} }),
      promote: (input) => promoteDraftMedia({ ...input, storage }),
      finalize,
    })

    // When
    const interrupted = await handler(request())
    const retried = await handler(request())

    // Then
    expect(interrupted.status).toBe(502)
    expect(retried.status).toBe(200)
    expect(publicObjects.has(destination)).toBe(true)
    expect(storage.uploadPublic).toHaveBeenCalledTimes(2)
    expect(storage.downloadPublic).toHaveBeenCalledTimes(2)
    expect(finalize).toHaveBeenCalledTimes(2)
  })
})
