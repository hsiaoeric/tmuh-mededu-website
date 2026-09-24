import { ascii, boundedDimensions, invalidImage, type ImageDimensions, u32be } from './image-container.ts'

const SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_value, index) => {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0)
  return crc >>> 0
})

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff
  for (let offset = start; offset < end; offset += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[offset]) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

export function parsePng(bytes: Uint8Array): ImageDimensions {
  if (bytes.byteLength < 45 || !SIGNATURE.every((byte, index) => bytes[index] === byte)) invalidImage()
  let offset = 8
  let dimensions: ImageDimensions | null = null
  let sawPalette = false
  let paletteRequired = false
  let paletteForbidden = false
  let sawIdat = false
  let idatEnded = false
  let idatBytes = 0
  while (offset < bytes.byteLength) {
    if (offset + 12 > bytes.byteLength) invalidImage()
    const length = u32be(bytes, offset)
    const type = ascii(bytes, offset + 4, 4)
    if (![...type].every((character) => /[A-Za-z]/.test(character)) || !/[A-Z]/.test(type[2])) invalidImage()
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    const chunkEnd = dataEnd + 4
    if (dataEnd < dataStart || chunkEnd > bytes.byteLength) invalidImage()
    if (crc32(bytes, offset + 4, dataEnd) !== u32be(bytes, dataEnd)) invalidImage()
    if (dimensions === null && type !== 'IHDR') invalidImage()
    if (type === 'IHDR') {
      if (dimensions !== null || length !== 13) invalidImage()
      const bitDepth = bytes[dataStart + 8]
      const colorType = bytes[dataStart + 9]
      paletteRequired = colorType === 3
      paletteForbidden = colorType === 0 || colorType === 4
      const legalDepth = colorType === 0 ? [1, 2, 4, 8, 16]
        : colorType === 2 ? [8, 16]
          : colorType === 3 ? [1, 2, 4, 8]
            : colorType === 4 || colorType === 6 ? [8, 16] : []
      if (!legalDepth.includes(bitDepth) || bytes[dataStart + 10] !== 0 || bytes[dataStart + 11] !== 0 || bytes[dataStart + 12] > 1) invalidImage()
      dimensions = boundedDimensions(u32be(bytes, dataStart), u32be(bytes, dataStart + 4))
    } else if (type === 'PLTE') {
      if (sawPalette || sawIdat || paletteForbidden || length === 0 || length % 3 !== 0 || length > 768) invalidImage()
      sawPalette = true
    } else if (type === 'IDAT') {
      if (idatEnded || length === 0) invalidImage()
      sawIdat = true
      idatBytes += length
    } else if (type === 'IEND') {
      if (length !== 0 || !sawIdat || idatBytes === 0 || (paletteRequired && !sawPalette)
        || chunkEnd !== bytes.byteLength || dimensions === null) invalidImage()
      return dimensions
    } else {
      if (sawIdat) idatEnded = true
      const critical = type.charCodeAt(0) >= 65 && type.charCodeAt(0) <= 90
      if (critical) invalidImage()
    }
    offset = chunkEnd
  }
  return invalidImage()
}
