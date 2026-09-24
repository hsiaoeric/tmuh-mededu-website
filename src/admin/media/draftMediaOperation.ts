import type { DraftMediaFailure } from './types';

export type OperationResult<Value> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly failure: DraftMediaFailure };

type FailedOperation = Extract<OperationResult<never>, { readonly ok: false }>;

function operationFailure(signal?: AbortSignal): DraftMediaFailure {
  return signal?.aborted === true
    ? { kind: 'aborted' }
    : { kind: 'transport-error' };
}

export function settleOperation<Value>(
  operation: () => Promise<Value>,
  signal?: AbortSignal,
): Promise<OperationResult<Value>> {
  if (signal?.aborted === true) {
    return Promise.resolve({ ok: false, failure: { kind: 'aborted' } });
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: OperationResult<Value>): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      resolve(result);
    };
    const abort = (): void => finish({ ok: false, failure: { kind: 'aborted' } });
    signal?.addEventListener('abort', abort, { once: true });
    try {
      operation().then(
        (value) => finish({ ok: true, value }),
        () => finish({ ok: false, failure: operationFailure(signal) }),
      );
    } catch {
      finish({ ok: false, failure: operationFailure(signal) });
    }
  });
}

export async function settleResultOperation<Result extends { readonly ok: boolean }>(
  operation: () => Promise<Result>,
  signal?: AbortSignal,
): Promise<Result | FailedOperation> {
  try {
    return await operation();
  } catch {
    return { ok: false, failure: operationFailure(signal) };
  }
}

export function hashFile(file: File, signal?: AbortSignal): Promise<OperationResult<string>> {
  return settleOperation(async () => {
    const bytes = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }, signal);
}
