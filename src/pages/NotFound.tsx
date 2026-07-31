import { Link } from 'react-router-dom';
import { useSite, usePageTitle } from '@/app/site';
import { SplitLines } from '@/motion/SplitLines';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';

export function NotFound() {
  const { isZh } = useSite();
  usePageTitle(isZh ? '找不到頁面' : 'Page not found');

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
        <span className="eyebrow">404</span>
        <SplitLines as="h1" className="display d2" immediate>
          {isZh ? '這個頁面不存在' : 'This page does not exist'}
        </SplitLines>
        <Reveal variant="up" delay={200}>
          <p className="lede measure">
            {isZh
              ? '您要找的內容可能已經移動或尚未建置。回到教學部首頁，從組織架構開始探索。'
              : 'The page may have moved or is not built yet. Head back to the department home and start from the structure.'}
          </p>
        </Reveal>
        <Reveal variant="up" delay={300}>
          <Link className="btn btn-solid" to="/" style={{ alignSelf: 'flex-start' }}>
            {isZh ? '返回首頁' : 'Back home'}
            <Icon name="arrow" />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
