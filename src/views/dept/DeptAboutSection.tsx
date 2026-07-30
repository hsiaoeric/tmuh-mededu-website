import { useSite } from '@/context/SiteContext';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';

export function DeptAboutSection() {
  const { isZh } = useSite();
  const cards = [
    {
      id: 'about-who',
      icon: 'heart' as IconName,
      title: isZh ? '我們是誰' : 'Who We Are',
      body: isZh
        ? '教學部是串聯臨床照護、人才培育與醫學教育創新的核心平台。'
        : 'The department connects clinical care, talent development, and innovation in medical education.',
    },
    {
      id: 'about-services',
      icon: 'skills' as IconName,
      title: isZh ? '做什麼・服務誰' : 'What We Do',
      body: isZh
        ? '服務醫學生、住院醫師與全院教師，推動師資培育、臨床技能、實證醫學、全人照護與教育研究。'
        : 'We support students, residents, and faculty through development, clinical skills, EBM, holistic care, and education research.',
    },
    {
      id: 'about-vision',
      icon: 'research' as IconName,
      title: isZh ? '願景與定位' : 'Vision & Position',
      body: isZh
        ? '以學習者與病人為中心，打造跨職類、可驗證、持續精進的醫學教育體系。'
        : 'A learner- and patient-centered education system that is interprofessional, evidence-driven, and continuously improving.',
    },
  ];

  return (
    <section id="about" >
      <SectionHeading
        eyebrow="About Us"
        title={isZh ? '認識教學部' : 'About the Department'}
        desc={isZh ? '從人才培育到照護品質，讓教育成為醫療持續進步的力量。' : 'Education that advances people, practice, and quality of care.'}
      />
      <div className="grid grid-3" style={{ gap: 18, marginTop: 26 }}>
        {cards.map((card, index) => (
          <Reveal
            key={card.id}
            id={card.id}
            delay={index * 80}
            style={{
              padding: '26px 24px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', background: 'var(--teal-50)', marginBottom: 16 }}>
              <Icon name={card.icon} />
            </span>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 19, color: 'var(--text)', marginBottom: 9 }}>
              {card.title}
            </h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--body)' }}>{card.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
