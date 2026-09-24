import { deflateSync } from 'node:zlib'

function u32be(value: number): Uint8Array {
  return Uint8Array.of(value >>> 24, value >>> 16, value >>> 8, value)
}

function u32le(value: number): Uint8Array {
  return Uint8Array.of(value, value >>> 8, value >>> 16, value >>> 24)
}

function join(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.byteLength, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.byteLength
  }
  return result
}

export function crc32(bytes: Uint8Array): number {
  const table = Uint32Array.from({ length: 256 }, (_value, index) => {
    let entry = index
    for (let bit = 0; bit < 8; bit += 1) entry = (entry >>> 1) ^ ((entry & 1) === 1 ? 0xedb88320 : 0)
    return entry >>> 0
  })
  let crc = 0xffffffff
  for (const byte of bytes) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

export function pngAtSize(size: number): Uint8Array {
  const base = validPng()
  const fillerLength = size - base.byteLength - 12
  if (fillerLength < 0) throw new RangeError('requested PNG size is too small')
  return join(base.subarray(0, 33), pngChunk('raNd', new Uint8Array(fillerLength)), base.subarray(33))
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const name = new TextEncoder().encode(type)
  return join(u32be(data.byteLength), name, data, u32be(crc32(join(name, data))))
}

export function validPng(width = 1, height = 1, rgba = Uint8Array.of(255, 0, 0, 255)): Uint8Array {
  const ihdr = join(u32be(width), u32be(height), Uint8Array.of(8, 6, 0, 0, 0))
  const row = new Uint8Array(1 + width * 4)
  for (let pixel = 0; pixel < width; pixel += 1) row.set(rgba, 1 + pixel * 4)
  const raw = new Uint8Array(row.byteLength * height)
  for (let y = 0; y < height; y += 1) raw.set(row, y * row.byteLength)
  return join(
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', new Uint8Array()),
  )
}

export function pngDimensionContainer(width: number, height: number): Uint8Array {
  const ihdr = join(u32be(width), u32be(height), Uint8Array.of(8, 6, 0, 0, 0))
  return join(
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Uint8Array.of(0, 0, 0, 0, 0))),
    pngChunk('IEND', new Uint8Array()),
  )
}

export function validJpeg(width = 1, height = 1): Uint8Array {
  return Uint8Array.of(
    0xff, 0xd8,
    0xff, 0xc0, 0, 11, 8, height >>> 8, height, width >>> 8, width, 1, 1, 0x11, 0,
    0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0,
    1, 0xff, 0xd9,
  )
}

export function validWebp(width = 1, height = 1): Uint8Array {
  const packed = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14)
  const payload = Uint8Array.of(0x2f, packed, packed >>> 8, packed >>> 16, packed >>> 24)
  const chunk = join(new TextEncoder().encode('VP8L'), u32le(payload.byteLength), payload, Uint8Array.of(0))
  return join(new TextEncoder().encode('RIFF'), u32le(4 + chunk.byteLength), new TextEncoder().encode('WEBP'), chunk)
}

export function corruptPngCrc(bytes: Uint8Array): Uint8Array {
  const result = Uint8Array.from(bytes)
  result[29] ^= 1
  return result
}

export function pngWithoutIdat(): Uint8Array {
  const ihdr = join(u32be(1), u32be(1), Uint8Array.of(8, 6, 0, 0, 0))
  return join(Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10), pngChunk('IHDR', ihdr), pngChunk('IEND', new Uint8Array()))
}

function trailing(bytes: Uint8Array): Uint8Array {
  return new Uint8Array([...bytes, ...new TextEncoder().encode('<html>')])
}

export function adversarialImages(): readonly (readonly [string, Uint8Array])[] {
  return [
    ['jpeg missing SOF', Uint8Array.of(0xff, 0xd8, 0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0, 1, 0xff, 0xd9)],
    ['jpeg missing SOS', Uint8Array.of(...validJpeg().subarray(0, 15), 0xff, 0xd9)],
    ['jpeg zero segment length', Uint8Array.of(0xff, 0xd8, 0xff, 0xc0, 0, 0, 0xff, 0xd9)],
    ['jpeg truncated segment', Uint8Array.of(0xff, 0xd8, 0xff, 0xc0, 0, 20, 8, 0, 1)],
    ['jpeg zero dimensions', validJpeg(0, 1)],
    ['png bad CRC', corruptPngCrc(validPng())],
    ['png zero dimensions', validPng(0, 1)],
    ['png no IDAT', pngWithoutIdat()],
    ['webp empty image chunk', Uint8Array.of(82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 76, 0, 0, 0, 0)],
    ['webp overrun chunk', Uint8Array.of(82, 73, 70, 70, 13, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 76, 8, 0, 0, 0, 0)],
    ['webp invalid dimensions', validWebp(1, 1).map((byte, index) => index >= 21 && index <= 24 ? 0xff : byte)],
    ['jpeg trailing HTML', trailing(validJpeg())],
    ['png trailing HTML', trailing(validPng())],
    ['webp trailing HTML', trailing(validWebp())],
  ]
}
