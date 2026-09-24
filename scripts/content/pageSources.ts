import { buildDeptAwards } from '../../src/data/deptAwards';
import { buildEbm } from '../../src/data/ebm';
import { buildFacdev } from '../../src/data/facdev';
import {
  ALGEE,
  buildAiEcosystem,
  buildHolisticOutcomes,
  holisticFeatures,
  holisticKpis,
} from '../../src/data/holistic';
import {
  buildHolisticResearch,
  HOLISTIC_EDU_PAPERS,
  resolveAuthorName,
} from '../../src/data/holisticPapers';
import type { Lang } from '../../src/i18n';
import { buildPersonView } from './coreSources';
import { DIGITAL_MATERIALS_COPY } from './inlineCopy';

export function buildHonorsSource(lang: Lang) {
  return buildDeptAwards(lang);
}

export function buildDigitalMaterialsSource(lang: Lang) {
  return DIGITAL_MATERIALS_COPY[lang];
}

export function buildFacdevSource(lang: Lang) {
  const source = buildFacdev(lang);
  const { colors: _colors, ...copy } = source;
  return {
    ...copy,
    kpis: source.kpis.map(({ color: _color, delay: _delay, ...kpi }) => kpi),
    services: source.services.map(({ icon: _icon, tone: _tone, ...service }) => service),
    groups: source.groups.map((group) => ({
      name: group.name,
      desc: group.desc,
      lead: buildPersonView(group.lead, lang),
    })),
  };
}

export function buildEbmSource(lang: Lang) {
  const source = buildEbm(lang);
  const { colors: _colors, ...copy } = source;
  return {
    ...copy,
    kpis: source.kpis.map(({ color: _color, delay: _delay, ...kpi }) => kpi),
    awardsLit: source.awardsLit.map(({ tone: _tone, ...award }) => award),
    awardsClin: source.awardsClin.map(({ tone: _tone, ...award }) => award),
    awardsTrans: source.awardsTrans.map(({ tone: _tone, ...award }) => award),
    stages: source.stages.map(({ color: _color, ...stage }) => stage),
    courseGroups: source.courseGroups.map(({ gicon: _gicon, color: _color, ...group }) => group),
  };
}

export function buildHolisticSource(lang: Lang) {
  return {
    kpis: holisticKpis(lang),
    features: holisticFeatures(lang),
    algee: ALGEE.map((step) => {
      const [title, description] = step[lang];
      return { letter: step.letter, title, description };
    }),
    aiEcosystem: buildAiEcosystem(lang),
    outcomes: buildHolisticOutcomes(lang),
  };
}

export function buildHolisticResearchSource(lang: Lang) {
  const research = buildHolisticResearch(lang);
  const clinicalStatIds = ['clinical-papers', 'first-author-papers', 'corresponding-author-papers'] as const;
  return {
    ...research,
    byYear: research.byYear.map((row) => ({ id: `year-${row.year}`, ...row })),
    clinicalStats: research.clinicalStats.map((row, index) => ({ id: clinicalStatIds[index], ...row })),
    papers: HOLISTIC_EDU_PAPERS.map((paper) => ({
      ...paper,
      authors: paper.authors.map((author) => resolveAuthorName(author, lang)),
    })),
  };
}
