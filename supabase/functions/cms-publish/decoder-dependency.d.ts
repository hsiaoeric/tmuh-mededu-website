declare module '@cross/image' {
  export class Image {
    static decode(bytes: Uint8Array, options: {
      readonly runtimeDecoding: 'never'
      readonly tolerantDecoding: false
    }): Promise<unknown>
  }
}
