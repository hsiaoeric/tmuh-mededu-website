import { decodeOneFrame } from './decoder.ts'
import { PublishError } from './errors.ts'
import { boundedDimensions, invalidImage, type ImageDimensions, type ImageFormat } from './image-container.ts'
import { parseJpeg } from './jpeg-container.ts'
import { parsePng } from './png-container.ts'
import { parseWebp } from './webp-container.ts'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export type ImageDecoder = (format: ImageFormat, bytes: Uint8Array) => Promise<ImageDimensions>
export type InspectedImage = {
  readonly extension: ImageFormat
  readonly mime: 'image/jpeg' | 'image/png' | 'image/webp'
  readonly size: number
  readonly digest: string
  readonly width: number
  readonly height: number
}

function detect(bytes: Uint8Array): { readonly extension: ImageFormat; readonly mime: InspectedImage['mime']; readonly dimensions: ImageDimensions } {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return { extension: 'jpg', mime: 'image/jpeg', dimensions: parseJpeg(bytes) }
  if (bytes[0] === 137 && bytes[1] === 80) return { extension: 'png', mime: 'image/png', dimensions: parsePng(bytes) }
  if (bytes[0] === 82 && bytes[1] === 73) return { extension: 'webp', mime: 'image/webp', dimensions: parseWebp(bytes) }
  return invalidImage()
}

export async function inspectImage(bytes: Uint8Array, decoder: ImageDecoder = decodeOneFrame): Promise<InspectedImage> {
  if (bytes.byteLength === 0) invalidImage()
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new PublishError('image-too-large', 413, false)
  const detected = detect(bytes)
  let decoded: ImageDimensions
  try {
    const result = await decoder(detected.extension, bytes)
    decoded = boundedDimensions(result.width, result.height)
  } catch (error) {
    if (error instanceof PublishError) throw error
    throw new PublishError('invalid-image', 415, false, { cause: error })
  }
  if (decoded.width !== detected.dimensions.width || decoded.height !== detected.dimensions.height) invalidImage()
  const hash = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer)
  const digest = Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('')
  return { extension: detected.extension, mime: detected.mime, size: bytes.byteLength, digest, width: decoded.width, height: decoded.height }
}
