import type { ReactNode } from 'react';
import { usePublicContentDocument } from '@/content';
import { SiteProvider } from './site';

export function PublicSiteProvider({ children }: { readonly children: ReactNode }) {
  const zh = usePublicContentDocument('site_copy', 'global', 'zh').value;
  const en = usePublicContentDocument('site_copy', 'global', 'en').value;

  return (
    <SiteProvider
      siteStrings={{ zh: zh.strings, en: en.strings }}
      siteInline={{ zh: zh.inline, en: en.inline }}
    >
      {children}
    </SiteProvider>
  );
}
