import { useSite, usePageTitle } from '@/app/site';
import { HonorsDetail } from './home/Honors';

export function HonorsPage() {
  const { isZh } = useSite();
  usePageTitle(isZh ? '品質榮譽' : 'Quality Honors');

  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      <HonorsDetail />
    </div>
  );
}
