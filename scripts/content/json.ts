import type { JsonObject, JsonValue } from './types';

export class ContentSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentSerializationError';
  }
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sanitize(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    const items: JsonValue[] = [];
    for (const item of value) {
      const sanitized = sanitize(item);
      if (sanitized !== undefined) items.push(sanitized);
    }
    return items;
  }
  if (typeof value !== 'object') return undefined;

  const entries = Object.entries(value);
  if (entries.some(([key, item]) => key === '$$typeof' && typeof item === 'symbol')) {
    return undefined;
  }
  const result: Record<string, JsonValue> = {};
  for (const [key, item] of entries.sort(([left], [right]) => compareText(left, right))) {
    const sanitized = sanitize(item);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toJsonObject(value: unknown): JsonObject {
  const sanitized = sanitize(value);
  if (sanitized === undefined || !isJsonObject(sanitized)) {
    throw new ContentSerializationError('CMS locale payload must serialize to an object');
  }
  return sanitized;
}

function serializableRoot(value: unknown): JsonValue {
  const sanitized = sanitize(value);
  if (sanitized === undefined) {
    throw new ContentSerializationError('CMS artifact root is not serializable');
  }
  return sanitized;
}

export function stableStringify(value: unknown): string {
  const sanitized = serializableRoot(value);
  return `${JSON.stringify(sanitized, null, 2)}\n`;
}

export function stableCompactStringify(value: unknown): string {
  return JSON.stringify(serializableRoot(value));
}
