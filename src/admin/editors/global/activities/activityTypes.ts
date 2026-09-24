import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';

export type ActivitiesPayload = EditableCmsPayloadByKind['activities'];
export type ActivityScope = keyof ActivitiesPayload['zh'];
export type Activity = ActivitiesPayload['zh'][ActivityScope][number];
export type ActivityField = keyof Activity;
export type LocalActivityField = Exclude<ActivityField, 'id' | 'sortDate' | 'link'>;
