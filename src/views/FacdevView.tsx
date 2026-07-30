import { useSite } from '@/context/SiteContext';
import { centerById } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import { buildFacdev } from '@/data/facdev';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { PersonCard } from '@/components/common/PersonCard';
import { DeepContact } from '@/components/common/DeepContact';
import { NxHero } from '@/components/common/NxHero';
import { NxCardHead } from '@/components/common/NxCardHead';
import { NxBlueprint } from '@/components/common/NxBlueprint';
import { ZCard } from '@/zdepth/ZCard';

export function FacdevView() {
  const { lang, t, isZh } = useSite();
  const fd = buildFacdev(lang);
  const { clay, sage } = fd.colors;
  const members = (centerById('faculty_dev')?.people ?? []).map((p) => resolvePerson(p, clay, lang));

  return (
    <>
      <ZCard id="top" label={isZh ? '01 / 教師發展中心' : '01 / FACULTY DEVELOPMENT'} center>
        <NxHero
          chip={fd.eyebrow}
          title={fd.heroTitle}
          sub={fd.heroTag}
          ornament={false}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
              gap: 40,
              alignItems: 'end',
              marginTop: 36,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))',
                gap: 0,
                borderTop: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
              }}
            >
              {fd.kpis.map((k, i) => (
                <Reveal
                  key={i}
                  delay={k.delay}
                  style={{
                    padding: '14px 14px 16px',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: 28,
                      color: 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span data-count={k.num} data-suffix={k.suffix}>
                      0
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
                    {k.label}
                  </div>
                </Reveal>
              ))}
            </div>
            <NxBlueprint variant="faculty" label="FIG. 01 / CULTIVATION STRUCTURE" />
          </div>
        </NxHero>
      </ZCard>

      <ZCard id="fd-about" label={isZh ? '02 / 中心簡介' : '02 / ABOUT'}>
        <NxCardHead num="02" kicker={fd.aboutEyebrow} title={fd.aboutTitle} />
        <Reveal className="grid grid-sidebar" style={{ gap: 40, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--body)', borderLeft: `2px solid ${clay}`, paddingLeft: 18, marginBottom: 16 }}>{fd.aboutBody}</p>
            <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--muted)' }}>{fd.aboutBody2}</p>
          </div>
          <div style={{ display: 'grid', gap: 0, borderTop: '1px solid var(--border)' }}>
            {fd.kpis.map((k, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 4px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: k.color, minWidth: 64, fontVariantNumeric: 'tabular-nums' }}>{k.num}{k.suffix}</div>
                <div style={{ fontSize: 14, color: 'var(--body)' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </ZCard>

      <ZCard id="fd-members" label={isZh ? '03 / 中心成員' : '03 / MEMBERS'}>
        <NxCardHead num="03" kicker="CENTER MEMBERS" title={fd.membersTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 16, maxWidth: 760 }}>
          {members.map((p, i) => (
            <PersonCard key={i} person={p} profileColor={p.accent} />
          ))}
        </div>
      </ZCard>

      <ZCard id="fd-services" label={isZh ? '04 / 四大核心業務' : '04 / CORE SERVICES'}>
        <NxCardHead
          num="04"
          kicker={fd.servicesEyebrow}
          title={fd.servicesTitle}
          desc={fd.servicesDesc}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(248px,1fr))', gap: 18 }}>
          {fd.services.map((s, i) => (
            <Reveal key={i} style={{ position: 'relative', padding: '28px 24px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: s.tone }} />
              <span style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb,${s.tone} 14%,transparent)`, color: s.tone, marginBottom: 16 }}>
                <span style={{ width: 24, height: 24 }}>
                  <Icon name={s.icon as IconName} />
                </span>
              </span>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 10, lineHeight: 1.4 }}>{s.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--body)' }}>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard id="fd-groups" label={isZh ? '05 / 六大培育小組' : '05 / CULTIVATION GROUPS'}>
        <NxCardHead
          num="05"
          kicker={fd.groupsEyebrow}
          title={fd.groupsTitle}
          desc={fd.groupsDesc}
        />
        <Reveal style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 11,
              padding: '13px 24px',
              background: 'var(--volt)',
              color: 'var(--volt-ink)',
            }}
          >
            <span style={{ width: 22, height: 22 }}>
              <Icon name="cap" />
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17 }}>{fd.groupRoot}</span>
          </div>
          <div style={{ width: 1, height: 26, background: 'var(--border-strong)' }} />
          <div style={{ width: '100%', maxWidth: 1040, height: 1, background: 'var(--border-strong)' }} />
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
          {fd.groups.map((g, i) => {
            const lead = resolvePerson(g.lead, g.tone, lang);
            return (
              <Reveal key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 18, background: 'var(--border)' }} />
                <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: `linear-gradient(135deg,color-mix(in srgb,${g.tone} 14%,var(--surface)),var(--surface))` }}>
                    <span style={{ width: 9, height: 24, background: g.tone, flex: 'none' }} />
                    <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 17, color: 'var(--text)', lineHeight: 1.3 }}>{g.name}</h3>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                      <div style={{ position: 'relative', width: 54, height: 54, borderRadius: '50%', padding: 2, background: `linear-gradient(140deg,${g.tone},transparent 70%)`, flex: 'none' }}>
                        {lead.hasPhoto ? (
                          <img src={lead.photoSrc} alt={lead.fullname} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: lead.objectPosition, borderRadius: '50%', border: '2px solid var(--surface)' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18, color: '#fff', background: `linear-gradient(140deg,${g.tone},color-mix(in srgb,${g.tone} 55%,#000))` }}>
                            {lead.initials}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: g.tone }}>{fd.groupLeadLabel}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, color: 'var(--text)', lineHeight: 1.25 }}>{lead.fullname}</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--muted)' }}>{lead.role}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--body)' }}>{g.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </ZCard>

      <ZCard id="fd-news" label={isZh ? '06 / 最新動態' : '06 / UPDATES'}>
        <div className="grid grid-split" style={{ gap: 22 }}>
          {[
            { eyebrow: fd.newsEyebrow, title: fd.newsTitle, icon: 'bell' as IconName, tone: clay },
            { eyebrow: fd.actEyebrow, title: fd.actTitle, icon: 'calendar' as IconName, tone: sage },
          ].map((col, i) => (
            <Reveal key={i} delay={i * 90} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 34, height: 34, background: `color-mix(in srgb,${col.tone} 13%,transparent)`, color: col.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 18, height: 18 }}>
                    <Icon name={col.icon} />
                  </span>
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: col.tone }}>{col.eyebrow}</div>
                  <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 24, color: 'var(--text)' }}>{col.title}</h2>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 200, padding: '34px 26px', border: '1.5px dashed var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ width: 40, height: 40, background: `color-mix(in srgb,${col.tone} 13%,transparent)`, color: col.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <span style={{ width: 21, height: 21 }}>
                    <Icon name={col.icon} />
                  </span>
                </span>
                <span style={{ display: 'inline-block', padding: '3px 13px', fontSize: 12, fontWeight: 600, color: col.tone, background: `color-mix(in srgb,${col.tone} 12%,transparent)`, marginBottom: 12 }}>{fd.reservedTag}</span>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 340 }}>{fd.reservedNote}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard
        id="fd-contact"
        label={isZh ? '07 / 聯絡窗口' : '07 / CONTACT'}
        tone="dark"
        center
      >
        <DeepContact
          num="07"
          accent={clay}
          closingIcon="cap"
          closingTitle={fd.closingTitle}
          closingBody={fd.closingBody}
          contactTitle={t.contactTitle}
          contactPerson={fd.contactPerson}
          contactExt={fd.contactExt}
          contactPlace={fd.contactPlace}
          contactQuote={fd.contactQuote}
        />
      </ZCard>
    </>
  );
}
