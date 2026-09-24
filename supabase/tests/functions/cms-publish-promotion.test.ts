import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { PublishError } from '../../functions/cms-publish/errors.ts'
import { collectDraftReferences, promoteDraftMedia } from '../../functions/cms-publish/promotion.ts'
import { adversarialImages, validPng } from './cms-publish-image-fixtures.ts'

vi.mock('../../functions/cms-publish/decoder.ts', () => ({
  decodeOneFrame: async () => ({ width: 1, height: 1 }),
}))

const actorId = '11111111-1111-4111-8111-111111111111'
const png = Buffer.from(validPng())
const secondPng = Buffer.from(validPng(1, 1, Uint8Array.of(0, 255, 0, 255)))
const digest = createHash('sha256').update(png).digest('hex')
const path = `${actorId}/${digest}.png`
const draft = { kind: 'draft', bucket: 'draft-media', path }

describe('draft media promotion', () => {
  it('deduplicates repeated refs while preserving local and public values', () => {
    const payload = { zh: { image: draft, again: draft }, en: { image: draft }, local: { kind: 'local', path: 'assets/a.jpg' } }
    expect(collectDraftReferences(payload, actorId)).toEqual([path])
  })

  it('rejects malformed and cross-owner references', () => {
    expect(() => collectDraftReferences({ image: { ...draft, path: '../x.png' } }, actorId)).toThrowError('invalid-draft-reference')
    expect(() => collectDraftReferences({ image: { ...draft, path: `22222222-2222-4222-8222-222222222222/${digest}.png` } }, actorId)).toThrowError('draft-owner-mismatch')
    expect(() => collectDraftReferences({ image: { kind: 'public', bucket: 'draft-media', path } }, actorId)).toThrowError('invalid-draft-reference')
    expect(() => collectDraftReferences({ image: { kind: 'draft', bucket: 'public-media', path } }, actorId)).toThrowError('invalid-draft-reference')
  })

  it('promotes once and returns one exact replacement for duplicates', async () => {
    const storage = {
      downloadDraft: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
      uploadPublic: vi.fn().mockResolvedValue('created' as const),
      downloadPublic: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
    }
    const result = await promoteDraftMedia({ payload: { a: draft, b: draft }, actorId, storage, signal: new AbortController().signal })
    expect(storage.downloadDraft).toHaveBeenCalledTimes(1)
    expect(storage.uploadPublic).toHaveBeenCalledWith(`${digest}/${digest}.png`, png, 'image/png', expect.any(AbortSignal))
    expect(result.replacements).toEqual({ [path]: { kind: 'public', bucket: 'public-media', path: `${digest}/${digest}.png` } })
  })

  it('reuses an exact duplicate after response loss and rejects mismatched duplicates', async () => {
    const storage = {
      downloadDraft: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
      uploadPublic: vi.fn().mockResolvedValue('duplicate' as const),
      downloadPublic: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
    }
    await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage, signal: new AbortController().signal })).resolves.toMatchObject({ reused: 1 })
    storage.downloadPublic.mockResolvedValue({ bytes: Buffer.concat([png, Buffer.from([0])]), contentType: 'image/png' })
    await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage, signal: new AbortController().signal })).rejects.toMatchObject({ code: 'public-integrity-conflict' })
  })

  it('rejects a misleading created response when the immutable object cannot be verified', async () => {
    // Given
    const storage = {
      downloadDraft: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
      uploadPublic: vi.fn().mockResolvedValue('created' as const),
      downloadPublic: vi.fn().mockResolvedValue(null),
    }

    // When
    const promotion = promoteDraftMedia({ payload: { image: draft }, actorId, storage, signal: new AbortController().signal })

    // Then
    await expect(promotion).rejects.toMatchObject({ code: 'public-integrity-conflict' })
  })

  it('runs the complete adversarial corpus through duplicate-public verification', async () => {
    const storage = {
      downloadDraft: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
      uploadPublic: vi.fn().mockResolvedValue('duplicate' as const),
      downloadPublic: vi.fn(),
    }
    for (const [_name, bytes] of adversarialImages()) {
      storage.downloadPublic.mockResolvedValueOnce({ bytes, contentType: 'image/png' })
      await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage, signal: new AbortController().signal }))
        .rejects.toMatchObject({ code: 'public-integrity-conflict' })
    }
  })

  it('reuses the first immutable object when a partial promotion is retried', async () => {
    const jpegDigest = createHash('sha256').update(secondPng).digest('hex')
    const secondPath = `${actorId}/${jpegDigest}.png`
    const downloads = new Map([[path, { bytes: png, contentType: 'image/png' }]])
    const uploads = new Map<string, { readonly bytes: Uint8Array; readonly contentType: string }>()
    const storage = {
      downloadDraft: vi.fn(async (sourcePath: string) => downloads.get(sourcePath) ?? null),
      uploadPublic: vi.fn(async (destination: string, uploaded: Uint8Array, contentType: string) => {
        if (uploads.has(destination)) return 'duplicate' as const
        uploads.set(destination, { bytes: uploaded, contentType })
        return 'created' as const
      }),
      downloadPublic: vi.fn(async (destination: string) => uploads.get(destination) ?? null),
    }
    const payload = { first: draft, second: { kind: 'draft', bucket: 'draft-media', path: secondPath } }
    await expect(promoteDraftMedia({ payload, actorId, storage, signal: new AbortController().signal })).rejects.toMatchObject({ code: 'draft-media-missing' })
    downloads.set(secondPath, { bytes: secondPng, contentType: 'image/png' })
    await expect(promoteDraftMedia({ payload, actorId, storage, signal: new AbortController().signal })).resolves.toMatchObject({ created: 1, reused: 1 })
  })

  it('retains and reuses an immutable object after repeated post-upload interruption', async () => {
    // Given
    const publicObjects = new Map<string, { readonly bytes: Uint8Array; readonly contentType: string }>()
    const storageFor = (controller: AbortController, interrupt: boolean) => ({
      downloadDraft: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/png' }),
      uploadPublic: vi.fn(async (destination: string, uploaded: Uint8Array, contentType: string) => {
        const result = publicObjects.has(destination) ? 'duplicate' as const : 'created' as const
        publicObjects.set(destination, { bytes: uploaded, contentType })
        if (interrupt) controller.abort(new DOMException('interrupted', 'AbortError'))
        return result
      }),
      downloadPublic: vi.fn(async (destination: string, signal: AbortSignal) => {
        if (signal.aborted) throw new PublishError('deadline-exceeded', 504, true, { cause: signal.reason })
        return publicObjects.get(destination) ?? null
      }),
    })

    // When / Then
    for (let interruption = 0; interruption < 2; interruption += 1) {
      const controller = new AbortController()
      await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage: storageFor(controller, true), signal: controller.signal }))
        .rejects.toMatchObject({ code: 'deadline-exceeded' })
    }

    const resumed = new AbortController()
    await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage: storageFor(resumed, false), signal: resumed.signal }))
      .resolves.toMatchObject({ created: 0, reused: 1 })
    expect(publicObjects.has(`${digest}/${digest}.png`)).toBe(true)
  })

  it('rejects missing objects, MIME/hash mismatch, and aborts', async () => {
    const base = {
      uploadPublic: vi.fn(),
      downloadPublic: vi.fn(),
    }
    await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage: { ...base, downloadDraft: vi.fn().mockResolvedValue(null) }, signal: new AbortController().signal })).rejects.toMatchObject({ code: 'draft-media-missing' })
    await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage: { ...base, downloadDraft: vi.fn().mockResolvedValue({ bytes: png, contentType: 'image/jpeg' }) }, signal: new AbortController().signal })).rejects.toMatchObject({ code: 'draft-media-mismatch' })
    const controller = new AbortController()
    controller.abort(new DOMException('deadline', 'TimeoutError'))
    await expect(promoteDraftMedia({ payload: { image: draft }, actorId, storage: { ...base, downloadDraft: vi.fn() }, signal: controller.signal })).rejects.toMatchObject({ code: 'deadline-exceeded' })
  })
})
