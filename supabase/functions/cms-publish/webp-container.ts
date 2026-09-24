import { ascii, boundedDimensions, invalidImage, type ImageDimensions, u24le, u32le } from './image-container.ts'

function vp8Dimensions(payload: Uint8Array): ImageDimensions {
  if (payload.byteLength < 10 || (payload[0] & 1) !== 0 || payload[3] !== 0x9d || payload[4] !== 0x01 || payload[5] !== 0x2a) invalidImage()
  return boundedDimensions((payload[6] + payload[7] * 0x100) & 0x3fff, (payload[8] + payload[9] * 0x100) & 0x3fff)
}

function vp8lDimensions(payload: Uint8Array): ImageDimensions {
  if (payload.byteLength < 5 || payload[0] !== 0x2f) invalidImage()
  const packed = u32le(payload, 1)
  if ((packed >>> 29) !== 0) invalidImage()
  return boundedDimensions((packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1)
}

export function parseWebp(bytes: Uint8Array): ImageDimensions {
  if (bytes.byteLength < 20 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') invalidImage()
  if (u32le(bytes, 4) + 8 !== bytes.byteLength) invalidImage()
  let offset = 12
  let canvas: ImageDimensions | null = null
  let image: ImageDimensions | null = null
  let chunks = 0
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) invalidImage()
    const type = ascii(bytes, offset, 4)
    const size = u32le(bytes, offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + size
    const paddedEnd = dataEnd + (size % 2)
    if (size === 0 || dataEnd < dataStart || paddedEnd > bytes.byteLength) invalidImage()
    const payload = bytes.subarray(dataStart, dataEnd)
    if (type === 'VP8X') {
      if (chunks !== 0 || canvas !== null || image !== null || size !== 10 || (payload[0] & 0xc3) !== 0
        || payload[1] !== 0 || payload[2] !== 0 || payload[3] !== 0) invalidImage()
      canvas = boundedDimensions(u24le(payload, 4) + 1, u24le(payload, 7) + 1)
    } else if (type === 'VP8 ' || type === 'VP8L') {
      if (image !== null || (canvas === null && chunks !== 0)) invalidImage()
      image = type === 'VP8 ' ? vp8Dimensions(payload) : vp8lDimensions(payload)
    } else if (type === 'ANIM' || type === 'ANMF') {
      invalidImage()
    } else if (canvas === null) {
      invalidImage()
    }
    if (size % 2 === 1 && bytes[dataEnd] !== 0) invalidImage()
    offset = paddedEnd
    chunks += 1
  }
  if (offset !== bytes.byteLength || image === null) invalidImage()
  if (canvas !== null && (canvas.width !== image.width || canvas.height !== image.height)) invalidImage()
  return image
}
