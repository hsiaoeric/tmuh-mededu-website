export function assertNever(value: never, context: string): never {
  throw new TypeError(`Unexpected ${context}: ${JSON.stringify(value)}`);
}
