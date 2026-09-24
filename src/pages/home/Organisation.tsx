import { useState } from 'react';
import { publicCenterById, type PublicCenter } from '@/app/publicCenters';
import { useSite } from '@/app/site';
import type { CenterId } from '@/data/types';
import { Section, SectionHeader } from '@/ui/Section';
import { OrgConstellation } from '@/ui/OrgConstellation';
import { OrgPanel } from '@/ui/OrgPanel';

export function Organisation({ centers }: { readonly centers: readonly PublicCenter[] }) {
  const { t } = useSite();
  // The admin team opens by default — it is the unit that explains the rest.
  const [active, setActive] = useState<CenterId | null>('admin');
  const center = active === null ? undefined : publicCenterById(centers, active);

  return (
    <Section id="organisation">
      <SectionHeader
        index="02"
        eyebrow="Organisational Structure"
        title={t.orgTitle}
        desc={t.orgDesc}
      />

      <OrgConstellation
        centers={centers}
        active={active}
        onSelect={(id) => setActive((cur) => (cur === id ? null : id))}
      />

      {center && <OrgPanel center={center} onClose={() => setActive(null)} />}
    </Section>
  );
}
