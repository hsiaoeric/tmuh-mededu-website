import { Link } from 'react-router-dom';
import { useSite, usePageTitle } from '@/app/site';
import { SplitLines } from '@/motion/SplitLines';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';

/**
 * The studio's own content is still being gathered, so the page states that
 * plainly rather than shipping an empty shell.
 */
export function DigitalMaterialsPage() {
  const { isZh } = useSite();
  usePageTitle(isZh ? '數位教材室' : 'Digital Learning Materials Studio');

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
        <span className="eyebrow">Digital Learning Materials</span>
        <SplitLines as="h1" className="display d2 title-measure" immediate>
          {isZh ? '數位教材室' : 'Digital Learning Materials Studio'}
        </SplitLines>

        <Reveal variant="up" delay={200}>
          <div className="panel stack gap-2" style={{ maxWidth: 560 }}>
            <span className="row gap-2" style={{ color: 'var(--accent)' }}>
              <Icon name="clipboard" size={16} />
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>
                {isZh ? '網頁建置中' : 'Page under construction'}
              </span>
            </span>
            <p className="tiny">
              {isZh
                ? '本頁內容仍在彙整中，完成後將於此發布。'
                : 'The content of this page is still being gathered and will be published here once ready.'}
            </p>
          </div>
        </Reveal>

        <Reveal variant="up" delay={300}>
          <Link className="btn btn-ghost" to="/" style={{ alignSelf: 'flex-start' }}>
            {isZh ? '返回教學部' : 'Back to the department'}
            <Icon name="arrow" />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
