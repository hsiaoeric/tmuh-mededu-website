import { describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema, type DraftMediaReference } from '@/content/media';
import {
  createDraftMediaOwnershipScope,
  draftMediaOwnershipFor,
  resetDraftMediaOwnership,
} from './draftMediaOwnership';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function reference(character: string): DraftMediaReference {
  return DraftMediaReferenceSchema.parse({
    kind: 'draft', bucket: 'draft-media',
    path: `${OWNER}/${character.repeat(64)}.png`,
  });
}

function created(reference: DraftMediaReference) {
  return { ok: true, outcome: 'created', reference, sha256: reference.path.split('/')[1]?.slice(0, 64) ?? '' } as const;
}

describe('draft media ownership registry', () => {
  it('does not expose administrator A ownership to a distinct authorization scope', () => {
    // Given
    const administratorA = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    const aPath = reference('a');
    administratorA.register(created(aPath));

    // When
    const administratorB = draftMediaOwnershipFor(createDraftMediaOwnershipScope());

    // Then
    expect(administratorB.snapshot()).toEqual([]);
  });

  it('keeps ordered unique paths isolated by scope and resolves only the matching path', () => {
    // Given
    const first = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    const second = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    const c = reference('c');
    const d = reference('d');

    // When
    first.register(created(c));
    first.register(created(d));
    first.register(created(c));
    second.register(created(c));
    first.resolve(c);

    // Then
    expect(first.snapshot()).toEqual([d]);
    expect(second.snapshot()).toEqual([c]);
  });

  it('publishes snapshots until unsubscribe and supports explicit session reset', () => {
    // Given
    const scope = createDraftMediaOwnershipScope();
    const registry = draftMediaOwnershipFor(scope);
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const unsubscribeFirst = registry.subscribe(firstListener);
    const unsubscribeSecond = registry.subscribe(secondListener);
    const c = reference('c');
    const d = reference('d');

    // When
    registry.register(created(c));
    unsubscribeFirst();
    registry.register(created(d));
    unsubscribeSecond();
    resetDraftMediaOwnership(scope);

    // Then
    expect(firstListener).toHaveBeenCalledOnce();
    expect(firstListener).toHaveBeenCalledWith([c]);
    expect(secondListener).toHaveBeenCalledTimes(2);
    expect(secondListener).toHaveBeenLastCalledWith([c, d]);
    expect(registry.snapshot()).toEqual([]);
  });

  it('cannot resolve an exact path owned by another authorization scope', () => {
    // Given
    const aPath = reference('a');
    const bPath = reference('b');
    const administratorA = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    const administratorB = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    administratorA.register(created(aPath));
    administratorB.register(created(bPath));

    // When
    administratorB.resolve(aPath);

    // Then
    expect(administratorA.snapshot()).toEqual([aPath]);
    expect(administratorB.snapshot()).toEqual([bPath]);
  });

  it('reopens only created references no longer claimed by document content', () => {
    // Given
    const registry = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    const claimed = reference('c');
    const abandoned = reference('d');
    registry.register(created(claimed));
    registry.register(created(abandoned));
    registry.resolve(claimed);
    registry.resolve(abandoned);

    // When
    registry.synchronize((candidate) => candidate.path === claimed.path);

    // Then
    expect(registry.snapshot()).toEqual([abandoned]);
  });

  it('forgets a permanently deleted created reference across synchronize and reopen', () => {
    // Given
    const registry = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    const deleted = reference('e');
    registry.register(created(deleted));

    // When
    registry.forget(deleted);
    registry.synchronize(() => false);
    registry.reopen(deleted);

    // Then
    expect(registry.snapshot()).toEqual([]);
  });
});
