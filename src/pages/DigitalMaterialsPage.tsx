import { Link } from 'react-router-dom';
import { useSite, usePageTitle } from '@/app/site';
import { usePublicContentDocument } from '@/content';
import { SplitLines } from '@/motion/SplitLines';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';

/**
 * The studio's own content is still being gathered, so the page states that
 * plainly rather than shipping an empty shell.
 */
export function DigitalMaterialsPage() {
  const { lang } = useSite();
  const content = usePublicContentDocument('digital_materials', 'page', lang).value;
  usePageTitle(content.title);

  return (
    <div
      style={{
        minHeight: '78vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 'var(--nav-h)',
      }}
    >
      <div className="shell stack gap-3">
        <span className="eyebrow">{content.eyebrow}</span>
        <SplitLines as="h1" className="display d2 title-measure" immediate>
          {content.title}
        </SplitLines>

        <Reveal variant="up" delay={200}>
          <div className="panel stack gap-2" style={{ maxWidth: 560 }}>
            <span className="row gap-2" style={{ color: 'var(--accent)' }}>
              <Icon name="clipboard" size={16} />
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>
                {content.status}
              </span>
            </span>
            <p className="tiny">
              {content.body}
            </p>
          </div>
        </Reveal>

        <Reveal variant="up" delay={300}>
          <Link className="btn btn-ghost" to="/" style={{ alignSelf: 'flex-start' }}>
            {content.backLabel}
            <Icon name="arrow" />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
