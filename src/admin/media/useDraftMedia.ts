import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DraftDeleteGuard,
} from './types';
import { settleResultOperation } from './draftMediaOperation';
import { draftMediaOwnershipFor } from './draftMediaOwnership';
import {
  initialDraftMediaState,
  type DraftMediaController,
  type DraftMediaOptions,
  type DraftMediaState,
} from './draftMediaState';

export type {
  DraftMediaController,
  DraftMediaOptions,
  DraftMediaState,
} from './draftMediaState';

type ActiveOperation = {
  readonly controller: AbortController;
  readonly generation: number;
};

export function useDraftMedia(options: DraftMediaOptions): DraftMediaController {
  const ownership = draftMediaOwnershipFor(options.ownershipScope);
  const [state, setReactState] = useState<DraftMediaState>(() => (
    initialDraftMediaState(options, ownership.snapshot())
  ));
  const stateRef = useRef(state);
  const activeRef = useRef<ActiveOperation | null>(null);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);

  const setState = useCallback((next: DraftMediaState): void => {
    stateRef.current = next;
    if (mountedRef.current) setReactState(next);
  }, []);

  const begin = useCallback((): ActiveOperation => {
    activeRef.current?.controller.abort();
    const controller = new AbortController();
    const generation = generationRef.current + 1;
    const active = { controller, generation };
    generationRef.current = generation;
    activeRef.current = active;
    return active;
  }, []);

  const isCurrent = useCallback((active: ActiveOperation): boolean => (
    mountedRef.current &&
    generationRef.current === active.generation &&
    activeRef.current === active &&
    !active.controller.signal.aborted
  ), []);

  const finish = useCallback((active: ActiveOperation): void => {
    if (activeRef.current === active) activeRef.current = null;
  }, []);

  const registerCreated = useCallback((uploaded: Awaited<ReturnType<DraftMediaOptions['client']['upload']>>): void => {
    if (!uploaded.ok || uploaded.outcome === 'reused') return;
    ownership.register({ ...uploaded, outcome: 'created' });
    if (mountedRef.current) {
      setState({ ...stateRef.current, unresolvedReferences: ownership.snapshot() });
    }
  }, [ownership, setState]);

  useEffect(() => ownership.subscribe((unresolvedReferences) => {
    setState({ ...stateRef.current, unresolvedReferences });
  }), [ownership, setState]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      activeRef.current?.controller.abort();
      activeRef.current = null;
    };
  }, []);

  const replace = useCallback(async (file: File): Promise<void> => {
    const previous = stateRef.current;
    const active = begin();
    try {
      setState({ ...previous, status: 'uploading', progress: { loaded: 0, total: file.size }, failure: null, failureOperation: null });
      const uploaded = await settleResultOperation(() => options.client.upload(file, (progress) => {
        if (isCurrent(active)) {
          setState({ ...stateRef.current, progress });
        }
      }, active.controller.signal), active.controller.signal);
      registerCreated(uploaded);
      if (!isCurrent(active)) return;
      if (!uploaded.ok) {
        setState({
          ...previous,
          status: 'error',
          progress: null,
          failure: uploaded.failure,
          failureOperation: 'upload',
          unresolvedReferences: stateRef.current.unresolvedReferences,
        });
        return;
      }
      setState({
        ...previous,
        status: 'signing',
        progress: null,
        failure: null,
        failureOperation: null,
        unresolvedReferences: stateRef.current.unresolvedReferences,
      });
      const preview = await settleResultOperation(
        () => options.client.createPreview(uploaded.reference, active.controller.signal),
        active.controller.signal,
      );
      if (!isCurrent(active)) return;
      if (!preview.ok) {
        setState({
          ...previous,
          status: 'error',
          progress: null,
          failure: preview.failure,
          failureOperation: 'preview',
          unresolvedReferences: stateRef.current.unresolvedReferences,
        });
        return;
      }
      setState({
        status: 'ready',
        reference: uploaded.reference,
        previewUrl: preview.url,
        previewExpiresAt: preview.expiresAt,
        progress: null,
        failure: null,
        failureOperation: null,
        unresolvedReferences: ownership.snapshot(),
      });
    } finally {
      finish(active);
    }
  }, [begin, finish, isCurrent, options.client, ownership, registerCreated, setState]);

  const unlink = useCallback((): void => {
    activeRef.current?.controller.abort();
    activeRef.current = null;
    generationRef.current += 1;
    setState({
      status: 'idle', reference: null, previewUrl: null,
      previewExpiresAt: null, progress: null, failure: null,
      failureOperation: null,
      unresolvedReferences: stateRef.current.unresolvedReferences,
    });
  }, [setState]);

  const deleteFromStorage = useCallback(async (guard: DraftDeleteGuard): Promise<void> => {
    const previous = stateRef.current;
    const reference = previous.reference;
    if (reference === null) return;
    const active = begin();
    try {
      setState({ ...previous, status: 'removing', failure: null, failureOperation: null });
      const result = await settleResultOperation(
        () => options.client.delete(reference, guard, active.controller.signal),
        active.controller.signal,
      );
      if (!isCurrent(active)) return;
      if (!result.ok) {
        setState({
          ...previous,
          status: 'error',
          failure: result.failure,
          failureOperation: 'cleanup',
          unresolvedReferences: stateRef.current.unresolvedReferences,
        });
        return;
      }
      setState({
        status: 'idle', reference: null, previewUrl: null,
        previewExpiresAt: null, progress: null, failure: null,
        failureOperation: null,
        unresolvedReferences: stateRef.current.unresolvedReferences,
      });
    } finally {
      finish(active);
    }
  }, [begin, finish, isCurrent, options.client, setState]);

  return { state, replace, unlink, deleteFromStorage };
}
