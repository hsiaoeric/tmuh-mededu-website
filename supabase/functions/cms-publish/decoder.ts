import type { ImageDimensions, ImageFormat } from './image-container.ts'

type DecodeOptions = { readonly runtimeDecoding: 'never'; readonly tolerantDecoding: false }
type ImageClass = { readonly decode: (bytes: Uint8Array, options: DecodeOptions) => Promise<unknown> }
type DecoderModule = { readonly Image: ImageClass }

function isDecoderModule(value: unknown): value is DecoderModule {
  if (typeof value !== 'object' || value === null || !('Image' in value)) return false
  const image = value.Image
  return typeof image === 'function' && 'decode' in image && typeof image.decode === 'function'
}

function dimensions(value: unknown): ImageDimensions {
  if (typeof value !== 'object' || value === null || !('width' in value) || !('height' in value)) throw new TypeError('decoder returned no dimensions')
  if (typeof value.width !== 'number' || typeof value.height !== 'number') throw new TypeError('decoder returned invalid dimensions')
  return { width: value.width, height: value.height }
}

export async function decodeOneFrame(_format: ImageFormat, bytes: Uint8Array): Promise<ImageDimensions> {
  const loaded: unknown = await import(/* @vite-ignore */ '@cross/image')
  if (!isDecoderModule(loaded)) throw new TypeError('image decoder unavailable')
  return dimensions(await loaded.Image.decode(bytes, { runtimeDecoding: 'never', tolerantDecoding: false }))
}
