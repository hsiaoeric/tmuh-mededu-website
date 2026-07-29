import { useSite } from '@/context/SiteContext';
import { centerById } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import { buildFacdev } from '@/data/facdev';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { PersonCard } from '@/components/common/PersonCard';
import { DeepContact } from '@/components/common/DeepContact';

function FacdevHeroArt() {
  return (
    <svg viewBox="0 0 440 360" role="img" aria-label="Faculty teaching" style={{ width: '100%', maxWidth: 430, height: 'auto', display: 'block' }}>
      <circle cx="58" cy="60" r="5" fill="#C0392B" opacity=".7" />
      <circle cx="404" cy="92" r="6" fill="#0E8073" opacity=".6" />
      <path d="M40 120 l0 16 M32 128 l16 0" stroke="#C0392B" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <path d="M414 254 l0 14 M407 261 l14 0" stroke="#0E8073" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <g>
        <rect x="118" y="58" width="252" height="172" rx="12" fill="#FFFFFF" />
        <rect x="118" y="58" width="252" height="172" rx="12" fill="none" stroke="#E3E6EA" strokeWidth="2" />
        <rect x="118" y="58" width="252" height="30" rx="12" fill="#C0392B" />
        <rect x="118" y="74" width="252" height="14" fill="#C0392B" />
        <rect x="138" y="106" width="120" height="9" rx="4.5" fill="#C8CED6" />
        <rect x="138" y="126" width="174" height="7" rx="3.5" fill="#E3E6EA" />
        <rect x="138" y="142" width="150" height="7" rx="3.5" fill="#E3E6EA" />
        <rect x="270" y="168" width="16" height="34" rx="3" fill="#0E8073" />
        <rect x="292" y="156" width="16" height="46" rx="3" fill="#4A7FD0" />
        <rect x="314" y="176" width="16" height="26" rx="3" fill="#A96B0A" />
        <rect x="336" y="148" width="16" height="54" rx="3" fill="#C0392B" />
        <line x1="138" y1="204" x2="352" y2="204" stroke="#E3E6EA" strokeWidth="2" />
        <path d="M150 230 l-26 70 M338 230 l26 70" stroke="#4A5560" strokeWidth="7" strokeLinecap="round" />
        <path d="M132 286 h60" stroke="#4A5560" strokeWidth="6" strokeLinecap="round" />
      </g>
      <line x1="92" y1="300" x2="168" y2="150" stroke="#232C35" strokeWidth="6" strokeLinecap="round" />
      <circle cx="170" cy="146" r="7" fill="#C0392B" />
      <g transform="translate(360 196)">
        <path d="M0 14 L34 2 L68 14 L34 26 Z" fill="#141A20" />
        <path d="M14 20 v14 c0 5 40 5 40 0 v-14" fill="none" stroke="#141A20" strokeWidth="4" />
        <line x1="68" y1="14" x2="68" y2="34" stroke="#C0392B" strokeWidth="3" />
        <circle cx="68" cy="36" r="4" fill="#C0392B" />
      </g>
      <g>
        <rect x="40" y="306" width="150" height="22" rx="5" fill="#4A7FD0" />
        <rect x="54" y="306" width="8" height="22" fill="#1A63C4" />
        <rect x="48" y="286" width="142" height="22" rx="5" fill="#0E8073" />
        <rect x="62" y="286" width="8" height="22" fill="#6B45B0" />
        <rect x="42" y="266" width="148" height="22" rx="5" fill="#C0392B" />
        <rect x="56" y="266" width="8" height="22" fill="#C0392B" />
      </g>
    </svg>
  );
}

export function FacdevView() {
  const { lang, t } = useSite();
  const fd = buildFacdev(lang);
  const { clay, claySoft, sage, ink } = fd.colors;
  const members = (centerById('faculty_dev')?.people ?? []).map((p) => resolvePerson(p, clay, lang));

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* HERO */}
      <section id="top" style={{ maxWidth: 1240, margin: '0 auto', padding: '46px 28px 26px' }}>
        <Reveal
          style={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 'none',
            background: ink,
          }}
        >
          {/* Soft radial colour blobs were removed; the hero is a flat field. */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${clay},${claySoft} 50%,${sage})` }} />
          <div style={{ position: 'relative', padding: 'clamp(34px,5vw,64px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 36, alignItems: 'center' }}>
              <div>
                <Eyebrow color={claySoft} style={{ marginBottom: 18 }}>{fd.eyebrow}</Eyebrow>
                <h1 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 'clamp(32px,4.4vw,54px)', lineHeight: 1.18, color: '#fff' }}>{fd.heroTitle}</h1>
                <p style={{ fontSize: 16.5, lineHeight: 1.6, color: '#EDEFF2', maxWidth: 560, marginTop: 22 }}>{fd.heroTag}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FacdevHeroArt />
              </div>
            </div>
            <div className="grid grid-4" style={{ gap: 14, marginTop: 30 }}>
              {fd.kpis.map((k, i) => (
                <Reveal key={i} delay={k.delay} style={{ padding: '16px 14px', borderRadius: 2, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 34, color: '#fff' }}>
                    <span data-figure="">{k.num.toLocaleString('en-US')}{k.suffix}</span>
                  </div>
                  <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 12.5, color: '#E6E9ED', marginTop: 4, lineHeight: 1.4 }}>{k.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ABOUT + KPI list */}
      <section id="fd-about" style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 28px 16px' }}>
        <Reveal className="grid grid-sidebar" style={{ gap: 40, alignItems: 'center' }}>
          <div>
            <Eyebrow color={clay} style={{ marginBottom: 10 }}>{fd.aboutEyebrow}</Eyebrow>
            <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)', lineHeight: 1.3, marginBottom: 18 }}>{fd.aboutTitle}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', borderLeft: `3px solid ${clay}`, paddingLeft: 18, marginBottom: 16 }}>{fd.aboutBody}</p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{fd.aboutBody2}</p>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {fd.kpis.map((k, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 2, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 30, color: k.color, minWidth: 64 }}>{k.num}{k.suffix}</div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 14.5, color: 'var(--body)' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* MEMBERS */}
      <section id="fd-members" style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 28px 14px' }}>
        <Reveal style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 5, height: 22, borderRadius: 2, background: clay }} />
          {fd.membersTitle}
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 16, maxWidth: 760 }}>
          {members.map((p, i) => (
            <PersonCard key={i} person={p} profileColor={p.accent} />
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="fd-services" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 18px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <Eyebrow color={clay}>{fd.servicesEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)' }}>{fd.servicesTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 640, margin: '12px auto 0' }}>{fd.servicesDesc}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(248px,1fr))', gap: 18 }}>
          {fd.services.map((s, i) => (
            <Reveal key={i} style={{ position: 'relative', padding: '28px 24px', borderRadius: 2, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: s.tone }} />
              <span style={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb,${s.tone} 14%,transparent)`, color: s.tone, marginBottom: 16 }}>
                <span style={{ width: 24, height: 24 }}>
                  <Icon name={s.icon as IconName} />
                </span>
              </span>
              <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 10, lineHeight: 1.4 }}>{s.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--body)' }}>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* GROUPS (org tree) */}
      <section id="fd-groups" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 18px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <Eyebrow color={clay}>{fd.groupsEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)' }}>{fd.groupsTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 680, margin: '12px auto 0' }}>{fd.groupsDesc}</p>
        </Reveal>
        <Reveal style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '14px 26px', borderRadius: 2, background: `linear-gradient(135deg,${ink},#232C35)`, color: '#fff', boxShadow: 'none' }}>
            <span style={{ width: 24, height: 24, color: claySoft }}>
              <Icon name="cap" />
            </span>
            <span style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18 }}>{fd.groupRoot}</span>
          </div>
          <div style={{ width: 2, height: 26, background: 'var(--border)' }} />
          <div style={{ width: '100%', maxWidth: 1040, height: 2, background: 'var(--border)' }} />
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
          {fd.groups.map((g, i) => {
            const lead = resolvePerson(g.lead, g.tone, lang);
            return (
              <Reveal key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 18, background: 'var(--border)' }} />
                <div style={{ width: '100%', borderRadius: 2, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: `linear-gradient(135deg,color-mix(in srgb,${g.tone} 14%,var(--surface)),var(--surface))` }}>
                    <span style={{ width: 9, height: 24, borderRadius: 2, background: g.tone, flex: 'none' }} />
                    <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 17, color: 'var(--text)', lineHeight: 1.3 }}>{g.name}</h3>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                      <div style={{ position: 'relative', width: 54, height: 54, borderRadius: '50%', padding: 2, background: `linear-gradient(140deg,${g.tone},transparent 70%)`, flex: 'none' }}>
                        {lead.hasPhoto ? (
                          <img src={lead.photoSrc} alt={lead.fullname} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: lead.objectPosition, borderRadius: '50%', border: '2px solid var(--surface)' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', background: `linear-gradient(140deg,${g.tone},color-mix(in srgb,${g.tone} 55%,#000))` }}>
                            {lead.initials}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: g.tone }}>{fd.groupLeadLabel}</div>
                        <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text)', lineHeight: 1.25 }}>{lead.fullname}</div>
                        <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11.5, color: 'var(--muted)' }}>{lead.role}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--body)' }}>{g.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* NEWS + ACTIVITIES (reserved) */}
      <section id="fd-news" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 12px' }}>
        <div className="grid grid-split" style={{ gap: 22 }}>
          {[
            { eyebrow: fd.newsEyebrow, title: fd.newsTitle, icon: 'bell' as IconName, tone: clay },
            { eyebrow: fd.actEyebrow, title: fd.actTitle, icon: 'calendar' as IconName, tone: sage },
          ].map((col, i) => (
            <Reveal key={i} delay={i * 90} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 34, height: 34, borderRadius: 2, background: `color-mix(in srgb,${col.tone} 13%,transparent)`, color: col.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 18, height: 18 }}>
                    <Icon name={col.icon} />
                  </span>
                </span>
                <div>
                  <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: col.tone }}>{col.eyebrow}</div>
                  <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 24, color: 'var(--text)' }}>{col.title}</h2>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 200, padding: '34px 26px', borderRadius: 2, border: '1.5px dashed var(--border)', background: 'var(--surface-2)' }}>
                <span style={{ width: 40, height: 40, borderRadius: 2, background: `color-mix(in srgb,${col.tone} 13%,transparent)`, color: col.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <span style={{ width: 21, height: 21 }}>
                    <Icon name={col.icon} />
                  </span>
                </span>
                <span style={{ display: 'inline-block', padding: '3px 13px', borderRadius: 2, fontSize: 12, fontWeight: 600, color: col.tone, background: `color-mix(in srgb,${col.tone} 12%,transparent)`, marginBottom: 12 }}>{fd.reservedTag}</span>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 340 }}>{fd.reservedNote}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CLOSING + CONTACT */}
      <DeepContact
        id="fd-contact"
        accent={clay}
        ink={ink}
        inkGradientEnd="#232C35"
        closingIcon="cap"
        closingIconColor={claySoft}
        closingTitle={fd.closingTitle}
        closingBody={fd.closingBody}
        contactTitle={t.contactTitle}
        contactPerson={fd.contactPerson}
        contactExt={fd.contactExt}
        contactPlace={fd.contactPlace}
        contactQuote={fd.contactQuote}
      />
    </div>
  );
}
