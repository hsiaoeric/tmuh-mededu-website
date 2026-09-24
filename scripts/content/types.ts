import type { CmsSourceDocument } from '../../src/content/contracts/registry';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | readonly JsonValue[];

export type JsonObject = {
  readonly [key: string]: JsonValue;
};

export type SourceDocument = CmsSourceDocument;

export type GeneratedArtifacts = {
  readonly snapshot: string;
  readonly sql: string;
};
