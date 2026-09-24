import { useState } from 'react';
import { CENTER_ORDER } from '@/app/routes';
import { useSite } from '@/app/site';
import { publicCenterById, publicCenterExternalUrl, usePublicCenters } from '@/app/publicCenters';
import { CENTER_ICON } from '@/data/centers';
import type { DepartmentKpiId } from '@/data/kpis';
import type { RawPerson } from '@/data/people';
import { usePublicContentDocument } from '@/content';
import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import { Counter } from '@/motion/Counter';
import { Reveal } from '@/motion/Reveal';
import { CenterLink } from '@/ui/CenterLink';
import { Icon } from '@/ui/Icon';
import { PersonCard } from '@/ui/Person';
import { Section, SectionHeader } from '@/ui/Section';

type CmsPerson = PublishedCmsPayloadByKind['people']['zh']['memberGroups'][number]['people'][number];
type GlanceMember = { readonly key: string; readonly person: RawPerson };

export function departmentMemberKey(person: CmsPerson, occurrence: number): string {
  return `${JSON.stringify([
    person.name,
    person.roleKey,
    person.department,
    person.slug,
    person.hubId,
    person.email,
  ])}:${occurrence}`;
}

function membersFor(
  groups: readonly { readonly id: string; readonly people: readonly RawPerson[] }[],
  id: DepartmentKpiId,
): readonly GlanceMember[] {
  if (id === 'education_centers') return [];
  const group = groups.find((candidate) => candidate.id === id);
  if (group === undefined) throw new TypeError(`Missing member group: ${id}`);
  return group.people.map((person, index) => ({
    key: `${person.identity ?? person.en}:${index}`,
    person,
  }));
}

export function Glance() {
  const { t, isZh, lang } = useSite();
  const [open, setOpen] = useState<DepartmentKpiId | null>(null);
  const kpis = usePublicContentDocument('kpis', 'department', lang).value.items;
  const people = usePublicContentDocument('people', 'directory', lang).value;
  const centers = usePublicCenters(lang);
  const selected = open === null ? undefined : kpis.find((kpi) => kpi.id === open);
  const members = open === null ? [] : membersFor(people.memberGroups, open);

  return (
    <Section id="glance" tight>
      <SectionHeader index="04" eyebrow={t.kpiEyebrow} title={t.kpiTitle} />
      <div className="grid g4">
        {kpis.map((kpi) => {
          const on = open === kpi.id;
          return (
            <Reveal key={kpi.id} variant="up" delay={kpi.delay}>
              <button
                className="stat-cell"
                style={{ ['--tone' as string]: kpi.color, width: '100%', textAlign: 'left', cursor: 'pointer', borderTopColor: on ? kpi.color : undefined, transition: 'border-color .4s ease' }}
                onClick={() => setOpen((current) => (current === kpi.id ? null : kpi.id))}
                aria-expanded={on}
                data-cursor={isZh ? '展開' : 'Open'}
              >
                <div className="stat">
                  <div className="stat-num"><Counter to={kpi.num} />{kpi.suffix && <span className="stat-suffix">{kpi.suffix}</span>}</div>
                  <div className="row between gap-2">
                    <span className="stat-label">{kpi.label}</span>
                    <span style={{ color: kpi.color, display: 'inline-flex' }}><Icon name={on ? 'minus' : 'plus'} size={15} /></span>
                  </div>
                  <span className="stat-sub">{kpi.en}</span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
      {selected === undefined ? null : (
        <div className="panel stack gap-3" style={{ marginTop: 30 }} key={selected.id}>
          <span className="eyebrow">{selected.panelTitle}</span>
          {selected.panelDescription === undefined ? null : <p className="panel-lede">{selected.panelDescription}</p>}
          {members.length === 0 ? null : (
            <Reveal variant="up" stagger={60} className="grid grid-people">
              {members.map((member) => <PersonCard key={member.key} person={member.person} accent={selected.color} hideRole />)}
            </Reveal>
          )}
          {selected.id !== 'education_centers' ? null : (
            <Reveal variant="up" stagger={60} className="grid auto-fit">
              {CENTER_ORDER.map((id, index) => {
                const center = publicCenterById(centers, id);
                const externalUrl = publicCenterExternalUrl(center, isZh);
                const external = externalUrl !== undefined;
                return (
                  <CenterLink key={id} id={id} externalUrl={externalUrl} className="card card-hover stack gap-2" style={{ ['--tone' as string]: center.color }} data-cursor={external ? (isZh ? '官網' : 'Site') : isZh ? '進入' : 'Enter'}>
                    <span className="row between baseline gap-2">
                      <span style={{ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: center.color, background: `color-mix(in srgb, ${center.color} 12%, transparent)` }}><Icon name={CENTER_ICON[id]} size={17} /></span>
                      <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--faint)' }}>0{index + 1}</span>
                    </span>
                    <span lang={isZh ? 'zh-Hant' : 'en'} style={{ fontFamily: "'Noto Sans TC',sans-serif", fontWeight: 500, color: 'var(--ink)' }}>{isZh ? center.zh : center.en}</span>
                    <span className="mono" style={{ fontSize: '0.63rem', letterSpacing: '.1em', color: 'var(--faint)' }}>{isZh ? center.en : center.zh}</span>
                    <p className="tiny">{isZh ? center.introZh : center.introEn}</p>
                    <span className="tlink" style={{ color: center.color, marginTop: 'auto' }}>{external ? (isZh ? '前往官網' : 'Official site') : isZh ? '前往專頁' : 'Visit page'}<Icon name="arrowUpRight" /></span>
                  </CenterLink>
                );
              })}
            </Reveal>
          )}
        </div>
      )}
    </Section>
  );
}
