import { useSite } from '@/app/site';
import { MAIN_PHONE } from '@/utils/phone';
import { Section, SectionHeader } from '@/ui/Section';
import { Icon } from '@/ui/Icon';

export function Contact() {
  const { t, isZh } = useSite();

  return (
    <Section id="contact">
      <SectionHeader
        index="06"
        eyebrow="Contact"
        title={t.contactTitle}
        desc={
          <>
            {isZh
              ? `${t.footAddr}（第一醫療大樓七樓）`
              : 'No. 252 Wuxing St., Xinyi Dist., Taipei 110301, Taiwan (7F, Medical Building I)'}
            <br />
            {isZh
              ? '服務時間：週一至週五 09:00 – 18:00'
              : 'Office hours: Monday – Friday, 9:00 am – 6:00 pm'}
          </>
        }
        aside={
          <a className="tlink" href="tel:+886227372181">
            <Icon name="phone" />
            <span className="mono">{MAIN_PHONE}</span>
          </a>
        }
      />
    </Section>
  );
}
