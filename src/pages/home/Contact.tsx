import { useSite } from '@/app/site';
import { CENTER_ORDER } from '@/app/routes';
import { centerById } from '@/data/centers';
import { formatPhoneExt, MAIN_PHONE } from '@/utils/phone';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { Icon } from '@/ui/Icon';

export function Contact() {
  const { t, isZh, lang } = useSite();

  const rows = [
    {
      unit: isZh ? '教學部' : 'Dept. of Medical Education',
      person: isZh ? '王怡文' : 'Yi-Wen Wang',
      ext: formatPhoneExt('3752', lang),
      color: 'var(--accent)',
    },
    // Every centre is listed, in CENTER_ORDER. Those whose desk extension is
    // not yet confirmed fall back to the hospital's main line.
    ...CENTER_ORDER.map((id) => {
      const c = centerById(id)!;
      return {
        unit: isZh ? c.zh : c.en,
        person: isZh ? c.contactZh : c.contactEn,
        ext: formatPhoneExt(c.ext, lang) || MAIN_PHONE,
        color: c.color,
      };
    }),
  ];

  return (
    <Section id="contact">
      <SectionHeader
        index="07"
        eyebrow="Contact"
        title={t.contactTitle}
        desc={isZh ? t.footAddr : 'No. 252 Wuxing St., Xinyi Dist., Taipei 110301, Taiwan'}
        aside={
          <a className="tlink" href="tel:+886227372181">
            <Icon name="phone" />
            <span className="mono">{MAIN_PHONE}</span>
          </a>
        }
      />

      <Reveal variant="up" stagger={70} className="stack" style={{ gap: 0 }}>
        {rows.map((r) => (
          <div
            key={r.unit}
            className="row between wrap gap-3"
            style={{
              padding: 'clamp(18px, 2.2vw, 28px) 0',
              borderTop: '1px solid var(--line-soft)',
              ['--tone' as string]: r.color,
            }}
          >
            <div className="row gap-2" style={{ minWidth: 0 }}>
              <span className="dot" />
              <span
                style={{
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontWeight: 500,
                  color: 'var(--ink)',
                }}
              >
                {r.unit}
              </span>
            </div>
            <div className="row gap-3 wrap">
              {r.person && <span className="tiny">{r.person}</span>}
              <a
                className="mono"
                href="tel:+886227372181"
                style={{ fontSize: '0.8rem', color: r.color }}
              >
                {r.ext}
              </a>
            </div>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
