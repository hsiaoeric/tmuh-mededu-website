import { describe, expect, it, vi } from 'vitest'
import { inspectImage } from '../../functions/cms-publish/image.ts'
import { adversarialImages, pngAtSize, pngDimensionContainer, validJpeg, validPng, validWebp } from './cms-publish-image-fixtures.ts'

const decoder = async (_format: 'jpg' | 'png' | 'webp', _bytes: Uint8Array) => ({ width: 1, height: 1 })

describe('inspectImage', () => {
  it.each([
    [validJpeg(), 'jpg', 'image/jpeg'],
    [validPng(), 'png', 'image/png'],
    [validWebp(), 'webp', 'image/webp'],
  ] as const)('detects a structurally valid %s image', async (bytes, extension, mime) => {
    await expect(inspectImage(bytes, decoder)).resolves.toMatchObject({ extension, mime, size: bytes.byteLength, width: 1, height: 1 })
  })

  it.each(adversarialImages())('rejects %s', async (_name, bytes) => {
    await expect(inspectImage(bytes, decoder)).rejects.toMatchObject({ code: 'invalid-image' })
  })

  it('enforces compressed and decoded bounds plus decoder agreement', async () => {
    await expect(inspectImage(pngAtSize(10 * 1024 * 1024), decoder)).resolves.toMatchObject({ size: 10 * 1024 * 1024 })
    await expect(inspectImage(new Uint8Array(10 * 1024 * 1024 + 1), decoder)).rejects.toMatchObject({ code: 'image-too-large' })
    await expect(inspectImage(validPng(), async () => ({ width: 2, height: 1 }))).rejects.toMatchObject({ code: 'invalid-image' })
    await expect(inspectImage(validPng(), async () => { throw new Error('decode failed') })).rejects.toMatchObject({ code: 'invalid-image' })
  })

  it.each([
    ['JPEG', validJpeg(1_600, 2_400), validJpeg(341, 11_261)],
    ['PNG', pngDimensionContainer(1_600, 2_400), pngDimensionContainer(341, 11_261)],
    ['lossless WebP', validWebp(1_600, 2_400), validWebp(341, 11_261)],
  ] as const)('enforces the pre-decode pixel boundary for %s', async (_name, atCap, aboveCap) => {
    const atCapDecoder = vi.fn().mockResolvedValue({ width: 1_600, height: 2_400 })
    await expect(inspectImage(atCap, atCapDecoder)).resolves.toMatchObject({ width: 1_600, height: 2_400 })
    expect(atCapDecoder).toHaveBeenCalledTimes(1)

    const aboveCapDecoder = vi.fn().mockResolvedValue({ width: 341, height: 11_261 })
    await expect(inspectImage(aboveCap, aboveCapDecoder)).rejects.toMatchObject({ code: 'invalid-image' })
    expect(aboveCapDecoder).not.toHaveBeenCalled()
  })
})
