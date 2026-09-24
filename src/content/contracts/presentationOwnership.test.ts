import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY } from './registry';

type PresentationCase = {
  readonly kind: 'centers' | 'facdev' | 'ebm';
  readonly keys: ReadonlySet<string>;
};

const CASES = [
  {
    kind: 'centers',
    keys: new Set(['color', 'icon', 'pageSection', 'panelSection']),
  },
  {
    kind: 'facdev',
    keys: new Set(['colors', 'icon', 'tone', 'color', 'delay']),
  },
  {
    kind: 'ebm',
    keys: new Set(['colors', 'tone', 'color', 'gicon', 'delay']),
  },
] as const satisfies readonly PresentationCase[];

function sourcePayload(kind: PresentationCase['kind']): unknown {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(document.payload);
}

function withoutKeys(value: unknown, keys: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) return value.map((item) => withoutKeys(item, keys));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !keys.has(key))
      .map(([key, item]) => [key, withoutKeys(item, keys)]),
  );
}

function objectAt(value: unknown, path: readonly PropertyKey[]): object {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== 'object') throw new TypeError(`Missing fixture path: ${path.join('.')}`);
    current = Reflect.get(current, key);
  }
  if (current === null || typeof current !== 'object') throw new TypeError(`Missing fixture object: ${path.join('.')}`);
  return current;
}

function withLegacyPresentation(kind: PresentationCase['kind'], payload: unknown): unknown {
  const legacy = structuredClone(payload);
  for (const locale of ['zh', 'en'] as const) {
    if (kind === 'centers') {
      Reflect.set(objectAt(legacy, [locale, 'centers', 0]), 'color', '#000001');
      const branch = objectAt(legacy, [locale, 'centers', 0, 'branches', 0]);
      Reflect.set(branch, 'icon', 'book');
      Reflect.set(branch, 'pageSection', 'legacy-anchor');
      Reflect.set(branch, 'panelSection', 'detail');
    } else if (kind === 'facdev') {
      Reflect.set(objectAt(legacy, [locale]), 'colors', { blue: '#000001' });
      Reflect.set(objectAt(legacy, [locale, 'groups', 0]), 'tone', '#000001');
      Reflect.set(objectAt(legacy, [locale, 'kpis', 0]), 'color', '#000001');
      Reflect.set(objectAt(legacy, [locale, 'kpis', 0]), 'delay', 0);
      Reflect.set(objectAt(legacy, [locale, 'services', 0]), 'icon', 'book');
      Reflect.set(objectAt(legacy, [locale, 'services', 0]), 'tone', '#000001');
    } else {
      Reflect.set(objectAt(legacy, [locale]), 'colors', { gold: '#000001' });
      Reflect.set(objectAt(legacy, [locale, 'kpis', 0]), 'color', '#000001');
      Reflect.set(objectAt(legacy, [locale, 'kpis', 0]), 'delay', 0);
      Reflect.set(objectAt(legacy, [locale, 'awardsLit', 0]), 'tone', '#000001');
      Reflect.set(objectAt(legacy, [locale, 'stages', 0]), 'color', '#000001');
      Reflect.set(objectAt(legacy, [locale, 'courseGroups', 0]), 'color', '#000001');
      Reflect.set(objectAt(legacy, [locale, 'courseGroups', 0]), 'gicon', 'chart');
    }
  }
  return legacy;
}

describe('CMS presentation ownership', () => {
  it.each(CASES)('$kind accepts content-only payloads and rejects legacy presentation keys', ({ kind, keys }) => {
    // Given
    const contract = CMS_PAYLOAD_REGISTRY[kind];
    const contentOnly = withoutKeys(sourcePayload(kind), keys);
    const legacy = withLegacyPresentation(kind, contentOnly);

    // When
    const contentVerdicts = [
      contract.editableSchema.safeParse(contentOnly).success,
      contract.schema.safeParse(contentOnly).success,
      contract.publishedSchema.safeParse(contentOnly).success,
    ];
    const legacyVerdicts = [
      contract.editableSchema.safeParse(legacy).success,
      contract.schema.safeParse(legacy).success,
      contract.publishedSchema.safeParse(legacy).success,
    ];

    // Then
    expect(contentVerdicts).toEqual([true, true, true]);
    expect(legacyVerdicts).toEqual([false, false, false]);
  });
});
