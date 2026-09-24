import { useState } from 'react';
import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { mapStructuredEditorIssues } from '@/admin/editors/shared';
import { CMS_PAYLOAD_REGISTRY, type EditableCmsPayloadByKind } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import { HolisticEditor } from './HolisticEditor';

export type HolisticPayload = EditableCmsPayloadByKind['holistic'];

export function holisticFixture(): HolisticPayload {
  const source = snapshot.find((candidate) => candidate.kind === 'holistic');
  if (source === undefined) throw new TypeError('Missing holistic fixture');
  return CMS_PAYLOAD_REGISTRY.holistic.schema.parse(structuredClone(source.payload));
}

export function compactHolisticFixture(): HolisticPayload {
  const payload = holisticFixture();
  return {
    zh: {
      ...payload.zh,
      kpis: payload.zh.kpis.slice(0, 2),
      features: payload.zh.features.slice(0, 1),
      algee: payload.zh.algee.slice(0, 1),
      aiEcosystem: {
        ...payload.zh.aiEcosystem,
        flow: payload.zh.aiEcosystem.flow.slice(0, 1),
        problems: payload.zh.aiEcosystem.problems.slice(0, 1),
      },
      outcomes: { ...payload.zh.outcomes, symposiums: payload.zh.outcomes.symposiums.slice(0, 1) },
    },
    en: {
      ...payload.en,
      kpis: payload.en.kpis.slice(0, 2),
      features: payload.en.features.slice(0, 1),
      algee: payload.en.algee.slice(0, 1),
      aiEcosystem: {
        ...payload.en.aiEcosystem,
        flow: payload.en.aiEcosystem.flow.slice(0, 1),
        problems: payload.en.aiEcosystem.problems.slice(0, 1),
      },
      outcomes: { ...payload.en.outcomes, symposiums: payload.en.outcomes.symposiums.slice(0, 1) },
    },
  };
}

type ControlledHolisticEditorProps = {
  readonly initial?: HolisticPayload;
  readonly result?: StructuredEditorCommitResult;
};

export function ControlledHolisticEditor({
  initial = compactHolisticFixture(),
  result = { status: 'emitted' },
}: ControlledHolisticEditorProps) {
  const [payload, setPayload] = useState(initial);
  const commit = (next: HolisticPayload): StructuredEditorCommitResult => {
    if (result.status === 'emitted') setPayload(next);
    return result;
  };
  return (
    <>
      <HolisticEditor
        payload={payload}
        issues={mapStructuredEditorIssues([])}
        onChange={commit}
      />
      <button type="button" onClick={() => setPayload({
        ...payload,
        zh: { ...payload.zh, kpis: [...payload.zh.kpis].reverse() },
        en: { ...payload.en, kpis: [...payload.en.kpis].reverse() },
      })}>外部反轉 KPI</button>
      <output data-testid="holistic-payload">{JSON.stringify(payload)}</output>
    </>
  );
}
