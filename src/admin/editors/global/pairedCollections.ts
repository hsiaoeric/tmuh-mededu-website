export type PairedCollection<Row> = {
  readonly zh: readonly Row[];
  readonly en: readonly Row[];
};

export type PairedRows<Row> = {
  readonly zh: Row;
  readonly en: Row;
};

export type PairedCollectionResult<Row> =
  | { readonly ok: true; readonly collection: PairedCollection<Row> }
  | { readonly ok: false; readonly reason: 'length-mismatch' }
  | { readonly ok: false; readonly reason: 'index-out-of-bounds' };

type IndexedRows<Row> = {
  readonly index: number;
  readonly rows: PairedRows<Row>;
};

type Move = {
  readonly fromIndex: number;
  readonly toIndex: number;
};

export function nextCollectionId(prefix: string, existingIds: readonly string[]): string {
  const ids = new Set(existingIds);
  let sequence = 1;
  while (ids.has(`${prefix}-${sequence}`)) sequence += 1;
  return `${prefix}-${sequence}`;
}

function failureFor<Row>(
  collection: PairedCollection<Row>,
  indexes: readonly number[],
  upperBound: number,
): PairedCollectionResult<Row> | null {
  if (collection.zh.length !== collection.en.length) {
    return { ok: false, reason: 'length-mismatch' };
  }
  return indexes.every((index) => Number.isInteger(index) && index >= 0 && index < upperBound)
    ? null
    : { ok: false, reason: 'index-out-of-bounds' };
}

export function insertPaired<Row>(
  collection: PairedCollection<Row>,
  change: IndexedRows<Row>,
): PairedCollectionResult<Row> {
  const failure = failureFor(collection, [change.index], collection.zh.length + 1);
  if (failure !== null) return failure;
  return {
    ok: true,
    collection: {
      zh: [...collection.zh.slice(0, change.index), change.rows.zh, ...collection.zh.slice(change.index)],
      en: [...collection.en.slice(0, change.index), change.rows.en, ...collection.en.slice(change.index)],
    },
  };
}

export function removePaired<Row>(
  collection: PairedCollection<Row>,
  change: { readonly index: number },
): PairedCollectionResult<Row> {
  const failure = failureFor(collection, [change.index], collection.zh.length);
  if (failure !== null) return failure;
  return {
    ok: true,
    collection: {
      zh: [...collection.zh.slice(0, change.index), ...collection.zh.slice(change.index + 1)],
      en: [...collection.en.slice(0, change.index), ...collection.en.slice(change.index + 1)],
    },
  };
}

function moveRows<Row>(rows: readonly Row[], change: Move): readonly Row[] {
  const moving = rows.slice(change.fromIndex, change.fromIndex + 1);
  const remaining = [
    ...rows.slice(0, change.fromIndex),
    ...rows.slice(change.fromIndex + 1),
  ];
  return [
    ...remaining.slice(0, change.toIndex),
    ...moving,
    ...remaining.slice(change.toIndex),
  ];
}

export function movePaired<Row>(
  collection: PairedCollection<Row>,
  change: Move,
): PairedCollectionResult<Row> {
  const failure = failureFor(
    collection,
    [change.fromIndex, change.toIndex],
    collection.zh.length,
  );
  if (failure !== null) return failure;
  return {
    ok: true,
    collection: {
      zh: moveRows(collection.zh, change),
      en: moveRows(collection.en, change),
    },
  };
}

export function updatePaired<Row>(
  collection: PairedCollection<Row>,
  change: IndexedRows<Row>,
): PairedCollectionResult<Row> {
  const failure = failureFor(collection, [change.index], collection.zh.length);
  if (failure !== null) return failure;
  return {
    ok: true,
    collection: {
      zh: collection.zh.map((row, index) => index === change.index ? change.rows.zh : row),
      en: collection.en.map((row, index) => index === change.index ? change.rows.en : row),
    },
  };
}
