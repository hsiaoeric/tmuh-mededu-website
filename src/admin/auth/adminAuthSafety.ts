export type OperationOutcome<Value> =
  | { readonly kind: 'success'; readonly value: Value }
  | { readonly kind: 'failure' };

export function captureSync<Value>(
  operation: () => Value,
): OperationOutcome<Value> {
  try {
    return { kind: 'success', value: operation() };
  } catch {
    return { kind: 'failure' };
  }
}

export async function captureAsync<Value>(
  operation: () => Promise<Value>,
): Promise<OperationOutcome<Value>> {
  try {
    return { kind: 'success', value: await operation() };
  } catch {
    return { kind: 'failure' };
  }
}
