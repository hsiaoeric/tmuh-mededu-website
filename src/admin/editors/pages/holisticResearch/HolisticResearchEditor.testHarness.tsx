import { useState } from 'react';
import { SiteProvider } from '@/app/site';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type EditableCmsPayloadByKind,
} from '@/content/contracts/registry';
import { HolisticResearchEditor } from './HolisticResearchEditor';

export type HolisticResearchPayload = EditableCmsPayloadByKind['holistic_research'];

export function holisticResearchFixture(): HolisticResearchPayload {
  const document = snapshot.find((candidate) => candidate.kind === 'holistic_research');
  if (document === undefined) throw new TypeError('Missing holistic_research fixture');
  if (document.stable_key !== 'registry') throw new TypeError('holistic_research stable key changed');
  return CMS_PAYLOAD_REGISTRY.holistic_research.editableSchema.parse(document.payload);
}

type HarnessProps = {
  readonly initial?: HolisticResearchPayload;
  readonly initialText?: string;
};

export function HolisticResearchEditorHarness({ initial = holisticResearchFixture(), initialText }: HarnessProps) {
  const [editorText, setEditorText] = useState(initialText ?? JSON.stringify(initial, null, 2));
  const [emissions, setEmissions] = useState(0);
  const handleChange = (nextEditorText: string): void => {
    setEmissions((count) => count + 1);
    setEditorText(nextEditorText);
  };
  return (
    <SiteProvider>
      <HolisticResearchEditor editorText={editorText} onEditorTextChange={handleChange} />
      <button
        type="button"
        onClick={() => {
          const parsed = CMS_PAYLOAD_REGISTRY.holistic_research.editableSchema.parse(JSON.parse(editorText));
          const firstZh = parsed.zh.papers[0];
          const firstEn = parsed.en.papers[0];
          if (firstZh === undefined || firstEn === undefined) return;
          setEditorText(JSON.stringify({
            ...parsed,
            zh: {
              ...parsed.zh,
              papers: [{ ...firstZh, title: `${firstZh.title}（外部修訂）` }, ...parsed.zh.papers.slice(1)],
            },
            en: {
              ...parsed.en,
              papers: [{ ...firstEn, title: `${firstZh.title}（外部修訂）` }, ...parsed.en.papers.slice(1)],
            },
          }, null, 2));
        }}
      >
        外部同長修訂
      </button>
      <output data-testid="holistic-research-editor-text">{editorText}</output>
      <output data-testid="holistic-research-emissions">{emissions}</output>
      <output data-testid="holistic-research-stable-key">registry</output>
    </SiteProvider>
  );
}

export function readHarnessPayload(element: HTMLElement): HolisticResearchPayload {
  return CMS_PAYLOAD_REGISTRY.holistic_research.editableSchema.parse(
    JSON.parse(element.textContent ?? '{}'),
  );
}

export function compactHolisticResearchFixture(): HolisticResearchPayload {
  const fixture = holisticResearchFixture();
  const compactLocale = (locale: 'zh' | 'en') => {
    const papers = fixture[locale].papers
      .filter((paper, index, all) => all.findIndex((candidate) => candidate.year === paper.year) === index)
      .slice(0, 2);
    const years = new Set(papers.map((paper) => paper.year));
    return {
      ...fixture[locale],
      byYear: fixture[locale].byYear.filter((row) => years.has(row.year)).map((row) => ({
        ...row,
        edu: papers.filter((paper) => paper.year === row.year).length,
      })),
      clinicalStats: fixture[locale].clinicalStats.slice(0, 2),
      papers: papers.map((paper) => ({
      ...paper,
      authors: paper.authors.slice(0, 2),
      })),
    };
  };
  return { zh: compactLocale('zh'), en: compactLocale('en') };
}
