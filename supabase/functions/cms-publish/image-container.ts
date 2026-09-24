import { PublishError } from './errors.ts'

export type ImageFormat = 'jpg' | 'png' | 'webp'
export type ImageDimensions = { readonly width: number; readonly height: number }

const MAX_DIMENSION = 16_384
const MAX_PIXELS = 3_840_000

export function invalidImage(): never {
  throw new PublishError('invalid-image', 415, false)
}

export function boundedDimensions(width: number, height: number): ImageDimensions {
  if (!Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1
    || width > MAX_DIMENSION || height > MAX_DIMENSION
    || width * height > MAX_PIXELS) invalidImage()
  return { width, height }
}

export function ascii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || length < 0 || offset + length > bytes.byteLength) invalidImage()
  return String.fromCharCode(...bytes.subarray(offset, offset + length))
}

export function u16be(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.byteLength) invalidImage()
  return bytes[offset] * 0x100 + bytes[offset + 1]
}

export function u24le(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 3 > bytes.byteLength) invalidImage()
  return bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000
}

export function u32be(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.byteLength) invalidImage()
  return (bytes[offset] * 0x1000000 + bytes[offset + 1] * 0x10000 + bytes[offset + 2] * 0x100 + bytes[offset + 3]) >>> 0
}

export function u32le(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.byteLength) invalidImage()
  return (bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x1000000) >>> 0
}
