import { useState } from 'react';
import { useSite } from '@/app/site';
import { centerById } from '@/data/centers';
import type { CenterId } from '@/data/types';
import { Section, SectionHeader } from '@/ui/Section';
import { OrgConstellation } from '@/ui/OrgConstellation';
import { OrgPanel } from '@/ui/OrgPanel';

export function Organisation() {
  const { t, isZh } = useSite();
  // The admin team opens by default — it is the unit that explains the rest.
  const [active, setActive] = useState<CenterId | null>('admin');
  const center = active ? centerById(active) : undefined;

  return (
    <Section id="organisation">
      <SectionHeader
        index="02"
        eyebrow="Organisational Structure"
        title={t.orgTitle}
        desc={
          isZh
            /* `\u2060` is a word joiner: it forbids a break inside 「窗口」 so
               the closing character cannot be stranded on a line of its own. */
            ? '六大功能單位環繞教學部協同運作。點擊任一節點，展開該單位的定位、面向、團隊與聯絡窗\u2060口。'
            : 'Six units orbit the department. Select any node to open its remit, facets, team and contact.'
        }
      />

      <OrgConstellation
        active={active}
        onSelect={(id) => setActive((cur) => (cur === id ? null : id))}
      />

      {center && <OrgPanel center={center} onClose={() => setActive(null)} />}
    </Section>
  );
}
