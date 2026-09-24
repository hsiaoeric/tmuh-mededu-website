import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { SupabaseConfiguration } from '@/content/env';
import type { AdminAuthClient, AdminAuthClientLoader, AdminAuthEventPayload } from './adminAuthClient';
import { decideAdminAuthEvent } from './adminAuthEvent';
import { captureAsync, captureSync } from './adminAuthSafety';
import { INITIAL_ADMIN_AUTH_STATE, reduceAdminAuthState, type AdminAuthState } from './adminAuthState';
import { verifyAdminAccess } from './adminAuthVerification';

export type AdminAuthController = {
  readonly state: AdminAuthState;
  readonly signIn: (email: string, password: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly retry: () => Promise<void>;
};
type ControllerOptions = Readonly<{ configuration: SupabaseConfiguration; loadClient: AdminAuthClientLoader }>;
function unexpectedResult(result: never): never {
  throw new TypeError(`Unexpected administrator auth result: ${JSON.stringify(result)}`);
}

export function useAdminAuthController({
  configuration,
  loadClient,
}: ControllerOptions): AdminAuthController {
  const [state, dispatch] = useReducer(reduceAdminAuthState, INITIAL_ADMIN_AUTH_STATE);
  const stateRef = useRef(state);
  const activeRef = useRef(false);
  const generationRef = useRef(0);
  const clientRef = useRef<AdminAuthClient | null>(null);
  const loadingRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe(): void } | null>(null);
  const subscriptionEpochRef = useRef(0);
  const candidateSessionRef = useRef(false);
  const logoutIntentRef = useRef(false);
  const scheduledRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  stateRef.current = state;

  const clearScheduled = useCallback(() => {
    for (const task of scheduledRef.current) clearTimeout(task);
    scheduledRef.current.clear();
  }, []);
  const isCurrent = useCallback(
    (generation: number) => activeRef.current && generationRef.current === generation,
    [],
  );
  const verify = useCallback(async (
    client: AdminAuthClient,
    generation: number,
    expectedUserId: string | null,
  ) => {
    const action = await verifyAdminAccess(client, () => isCurrent(generation), expectedUserId);
    if (action === null || !isCurrent(generation) || logoutIntentRef.current) return;
    dispatch(action);
  }, [isCurrent]);
  const scheduleVerification = useCallback((
    client: AdminAuthClient,
    generation: number,
    expectedUserId: string | null,
  ) => {
    const task = setTimeout(() => {
      scheduledRef.current.delete(task);
      if (isCurrent(generation) && !logoutIntentRef.current) {
        void verify(client, generation, expectedUserId);
      }
    }, 0);
    scheduledRef.current.add(task);
  }, [isCurrent, verify]);
  const handleEvent = useCallback(
    (client: AdminAuthClient, epoch: number, payload: AdminAuthEventPayload) => {
      if (!activeRef.current || subscriptionEpochRef.current !== epoch) return;
      const decision = decideAdminAuthEvent(
        stateRef.current,
        payload,
        logoutIntentRef.current,
      );
      if (decision.kind === 'ignore') return;
      const generation = ++generationRef.current;
      clearScheduled();
      switch (decision.kind) {
        case 'clear-session':
          if (payload.event === 'SIGNED_OUT') logoutIntentRef.current = false;
          candidateSessionRef.current = false;
          dispatch({ type: 'session-cleared' });
          return;
        case 'verify': {
          candidateSessionRef.current = true;
          const previousUser = decision.previouslyAuthorizedUser;
          dispatch(previousUser === null
            ? { type: 'verification-started' }
            : { type: 'reauthorization-started', user: previousUser });
          scheduleVerification(client, generation, previousUser?.id ?? null);
          return;
        }
        case 'unsupported':
          candidateSessionRef.current = false;
          dispatch({
            type: 'operation-failed',
            failure: 'unsupported-auth-event',
          });
          return;
        default:
          return unexpectedResult(decision);
      }
    },
    [clearScheduled, scheduleVerification],
  );
  const initialize = useCallback(async (): Promise<void> => {
    const generation = ++generationRef.current;
    const subscriptionEpoch = ++subscriptionEpochRef.current;
    clearScheduled();
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    clientRef.current = null;
    loadingRef.current = false;
    candidateSessionRef.current = false;
    logoutIntentRef.current = false;
    dispatch({ type: 'boot' });
    if (configuration.kind === 'disabled') {
      dispatch({ type: 'configuration-failed', failure: { kind: 'disabled' } });
      return;
    }
    if (configuration.kind === 'invalid') {
      dispatch({
        type: 'configuration-failed',
        failure: { kind: 'invalid', reason: configuration.error.reason },
      });
      return;
    }
    loadingRef.current = true;
    const loadOutcome = await captureAsync(() => loadClient(configuration.config));
    if (!isCurrent(generation)) return;
    loadingRef.current = false;
    if (loadOutcome.kind === 'failure') {
      dispatch({ type: 'operation-failed', failure: 'client-unavailable' });
      return;
    }
    const client = loadOutcome.value;
    clientRef.current = client;
    const subscriptionOutcome = captureSync(() =>
      client.subscribe((payload) => {
        handleEvent(client, subscriptionEpoch, payload);
      }),
    );
    if (subscriptionOutcome.kind === 'failure') {
      generationRef.current += 1;
      subscriptionEpochRef.current += 1;
      clearScheduled();
      candidateSessionRef.current = false;
      clientRef.current = null;
      dispatch({ type: 'operation-failed', failure: 'client-unavailable' });
      return;
    }
    subscriptionRef.current = subscriptionOutcome.value;
  }, [clearScheduled, configuration, handleEvent, isCurrent, loadClient]);
  useEffect(() => {
    activeRef.current = true;
    void initialize();
    return () => {
      generationRef.current += 1;
      subscriptionEpochRef.current += 1;
      activeRef.current = false;
      clearScheduled();
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      clientRef.current = null;
      loadingRef.current = false;
      candidateSessionRef.current = false;
      logoutIntentRef.current = false;
    };
  }, [clearScheduled, initialize]);
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    if (logoutIntentRef.current) return;
    const client = clientRef.current;
    if (client === null) {
      if (loadingRef.current) return;
      dispatch({ type: 'operation-failed', failure: 'client-unavailable' });
      return;
    }
    const generation = ++generationRef.current;
    clearScheduled();
    candidateSessionRef.current = false;
    dispatch({ type: 'sign-in-started' });
    const outcome = await captureAsync(() => client.signIn(email, password));
    if (!isCurrent(generation)) return;
    if (outcome.kind === 'failure' || outcome.value.kind === 'error') {
      dispatch({ type: 'operation-failed', failure: 'sign-in-failed' });
    }
  }, [clearScheduled, isCurrent]);
  const signOut = useCallback(async (): Promise<void> => {
    const client = clientRef.current;
    if (client === null) {
      if (loadingRef.current) return;
      dispatch({ type: 'session-cleared' });
      return;
    }
    const generation = ++generationRef.current;
    clearScheduled();
    candidateSessionRef.current = false;
    logoutIntentRef.current = true;
    dispatch({ type: 'sign-out-started' });
    const outcome = await captureAsync(() => client.signOutLocal());
    if (!isCurrent(generation)) return;
    if (outcome.kind === 'failure' || outcome.value.kind === 'error') {
      dispatch({ type: 'operation-failed', failure: 'sign-out-failed' });
      return;
    }
    logoutIntentRef.current = false;
    dispatch({ type: 'session-cleared' });
  }, [clearScheduled, isCurrent]);
  const retryVerification = useCallback(async (): Promise<void> => {
    const client = clientRef.current;
    if (client === null || !candidateSessionRef.current) return;
    const generation = ++generationRef.current;
    clearScheduled();
    dispatch({ type: 'verification-started' });
    await verify(client, generation, null);
  }, [clearScheduled, verify]);
  const retry = useCallback(async (): Promise<void> => {
    const current = stateRef.current;
    switch (current.status) {
      case 'denied':
      case 'expired':
        return retryVerification();
      case 'error':
        const failure = current.failure;
        switch (failure) {
          case 'client-unavailable':
            return initialize();
          case 'identity-check-failed':
          case 'allowlist-check-failed':
            return retryVerification();
          case 'sign-in-failed':
          case 'sign-out-failed':
          case 'unsupported-auth-event':
            return;
          default:
            return unexpectedResult(failure);
        }
      case 'booting':
      case 'config-error':
      case 'anonymous':
      case 'authenticating':
      case 'signing-out':
      case 'verifying':
      case 'authorized':
      case 'reauthorizing':
        return;
      default:
        return unexpectedResult(current);
    }
  }, [initialize, retryVerification]);

  return { state, signIn, signOut, retry };
}
