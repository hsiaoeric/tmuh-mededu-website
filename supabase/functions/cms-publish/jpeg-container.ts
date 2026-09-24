import { boundedDimensions, invalidImage, type ImageDimensions, u16be } from './image-container.ts'

const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

export function parseJpeg(bytes: Uint8Array): ImageDimensions {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) invalidImage()
  let offset = 2
  let dimensions: ImageDimensions | null = null
  let sawScan = false
  let entropy = false
  while (offset < bytes.byteLength) {
    if (bytes[offset] !== 0xff) {
      if (!entropy) invalidImage()
      offset += 1
      continue
    }
    while (offset < bytes.byteLength && bytes[offset] === 0xff) offset += 1
    if (offset >= bytes.byteLength) invalidImage()
    const marker = bytes[offset]
    offset += 1
    if (entropy && marker === 0x00) continue
    if (entropy && marker >= 0xd0 && marker <= 0xd7) continue
    entropy = false
    if (marker === 0xd9) {
      if (dimensions === null || !sawScan || offset !== bytes.byteLength) invalidImage()
      return dimensions
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) invalidImage()
    const length = u16be(bytes, offset)
    if (length < 2 || offset + length > bytes.byteLength) invalidImage()
    const data = offset + 2
    if (SOF_MARKERS.has(marker)) {
      if (dimensions !== null || length < 11 || bytes[data] === 0) invalidImage()
      const components = bytes[data + 5]
      if (components < 1 || length !== 8 + components * 3) invalidImage()
      dimensions = boundedDimensions(u16be(bytes, data + 3), u16be(bytes, data + 1))
    }
    if (marker === 0xda) {
      if (dimensions === null || length < 8) invalidImage()
      const components = bytes[data]
      if (components < 1 || length !== 6 + components * 2) invalidImage()
      sawScan = true
      entropy = true
    }
    offset += length
  }
  return invalidImage()
}
