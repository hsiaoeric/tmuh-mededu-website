import type { Json } from '@/content/database.types';

export type PayloadChange =
  | { readonly kind: 'changed'; readonly path: readonly (string | number)[]; readonly before: Json; readonly after: Json }
  | { readonly kind: 'added'; readonly path: readonly (string | number)[]; readonly after: Json }
  | { readonly kind: 'removed'; readonly path: readonly (string | number)[]; readonly before: Json };

function isObject(value: Json | undefined): value is { readonly [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Walks both trees with one shared path stack and copies the path only for a reported change, so
 * a large unchanged payload (the posts archive) costs no allocation per node.
 */
function walk(before: Json | undefined, after: Json | undefined, path: (string | number)[], changes: PayloadChange[]): void {
  if (before === after) return;
  if (before === undefined) {
    changes.push({ kind: 'added', path: [...path], after: after as Json });
    return;
  }
  if (after === undefined) {
    changes.push({ kind: 'removed', path: [...path], before });
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      path.push(index);
      walk(before[index], after[index], path, changes);
      path.pop();
    }
    return;
  }
  if (isObject(before) && isObject(after)) {
    for (const key of Object.keys(before)) {
      path.push(key);
      walk(before[key], after[key], path, changes);
      path.pop();
    }
    for (const key of Object.keys(after)) {
      if (key in before) continue;
      path.push(key);
      walk(undefined, after[key], path, changes);
      path.pop();
    }
    return;
  }
  // Two primitives that are not identical differ; mixed shapes (an object replaced by a string,
  // a list by an object) compare by their JSON text as before.
  if (typeof before !== 'object' || typeof after !== 'object' || before === null || after === null) {
    if (before !== after) changes.push({ kind: 'changed', path: [...path], before, after });
    return;
  }
  if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ kind: 'changed', path: [...path], before, after });
}

/**
 * Leaf-level differences between two payloads. A list item present on only one side is reported
 * once as added or removed rather than as every field inside it.
 */
export function diffPayloads(before: Json, after: Json): PayloadChange[] {
  const changes: PayloadChange[] = [];
  walk(before, after, [], changes);
  return changes;
}

const LOCALE_LABELS: Readonly<Record<string, { readonly zh: string; readonly en: string }>> = {
  zh: { zh: '中文', en: 'Chinese' },
  en: { zh: '英文', en: 'English' },
};

export function formatChangePath(path: readonly (string | number)[], isZh: boolean): string {
  return path.map((segment, index) => {
    if (typeof segment === 'number') return isZh ? `第 ${segment + 1} 項` : `item ${segment + 1}`;
    const locale = index === 0 ? LOCALE_LABELS[segment] : undefined;
    return locale === undefined ? segment : (isZh ? locale.zh : locale.en);
  }).join(' › ');
}

export function formatChangeValue(value: Json, maxLength = 60): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const oneLine = text.replace(/\s+/gu, ' ').trim();
  if (oneLine === '') return '（空白）';
  return oneLine.length > maxLength ? `${oneLine.slice(0, maxLength - 1)}…` : oneLine;
}
