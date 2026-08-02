import { useSite } from '@/app/site';
import { Reveal } from '@/motion/Reveal';
import { Parallax } from '@/motion/Parallax';
import { Section, SectionHeader } from '@/ui/Section';
import { Icon, type IconName } from '@/ui/Icon';
import { assetUrl } from '@/utils/asset';

export function About() {
  const { isZh } = useSite();

  const statements: Array<{ icon: IconName; title: string; body: string }> = [
    {
      icon: 'heart',
      title: isZh ? '我們是誰' : 'Who We Are',
      body: isZh
        ? '教學部是串聯臨床照護、人才培育與醫學教育創新的核心平台。'
        : 'The department connects clinical care, talent development, and innovation in medical education.',
    },
    {
      icon: 'skills',
      title: isZh ? '做什麼・服務誰' : 'What We Do',
      body: isZh
        ? '服務醫學生、住院醫師與全院教師，推動師資培育、臨床技能、實證醫學、全人照護與教育研究。'
        : 'We support students, residents, and faculty through development, clinical skills, EBM, holistic care, and education research.',
    },
    {
      icon: 'research',
      title: isZh ? '願景與定位' : 'Vision & Position',
      body: isZh
        ? '以學習者與病人為中心，打造跨職類、可驗證、持續精進的醫學教育體系。'
        : 'A learner- and patient-centered education system that is interprofessional, evidence-driven, and continuously improving.',
    },
  ];

  return (
    <Section id="about">
      <SectionHeader
        index="01"
        eyebrow="About Us"
        title={isZh ? '認識教學部' : 'About the Department'}
        desc={
          isZh
            ? '從人才培育到照護品質，讓教育成為醫療持續進步的力量。'
            : 'Education that advances people, practice, and quality of care.'
        }
      />

      <div className="grid g-editorial" style={{ alignItems: 'start' }}>
        <div className="sticky-col">
          <Reveal variant="clip">
            <figure
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--line-soft)',
              }}
            >
              <Parallax distance={54}>
                <img
                  src={assetUrl('assets/hero.jpg')}
                  alt={isZh ? '臺北醫學大學附設醫院' : 'Taipei Medical University Hospital'}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 5',
                    objectFit: 'cover',
                    transform: 'scale(1.12)',
                    filter: 'saturate(1.08) contrast(1.04)',
                  }}
                />
              </Parallax>
              {/* Jade light, not a duotone: soft-light drops the accent into the
                  shadows only, so the photo keeps its own colour while still
                  belonging to the field behind it. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(200deg, color-mix(in srgb, var(--accent) 62%, transparent), transparent 62%)',
                  mixBlendMode: 'soft-light',
                }}
              />
              {/* Scrim for the caption — the photo is bright now. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(12, 24, 20, 0.55), transparent 34%)',
                }}
              />
              <figcaption
                className="mono"
                style={{
                  position: 'absolute',
                  left: 18,
                  bottom: 16,
                  fontSize: '0.6rem',
                  letterSpacing: '.16em',
                  color: '#fff',
                  textShadow: '0 1px 12px rgba(0,0,0,.6)',
                }}
              >
                TMUH · XINYI, TAIPEI
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="stack" style={{ gap: 0 }}>
          {statements.map((s, i) => (
            <Reveal
              key={s.title}
              variant="up"
              delay={i * 90}
              className="stack gap-2"
              style={{
                padding: 'clamp(24px, 3vw, 40px) 0',
                borderTop: '1px solid var(--line-soft)',
              }}
            >
              <div className="row between baseline gap-2">
                <div className="row gap-2">
                  <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
                    <Icon name={s.icon} size={18} />
                  </span>
                  <h3 className="display d4">{s.title}</h3>
                </div>
                <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--faint)' }}>
                  0{i + 1}
                </span>
              </div>
              <p className="prose measure">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
