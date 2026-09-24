import type { ReactNode } from 'react';

export function ZhPhrase({ children }: { readonly children: ReactNode }) {
  return <span className="admin-phrase-group" lang="zh-Hant">{children}</span>;
}

export function ZhAtom({ children }: { readonly children: ReactNode }) {
  return <span className="admin-phrase-atom" lang="zh-Hant">{children}</span>;
}

export function ZhCopy({ children }: { readonly children: ReactNode }) {
  return <span className="admin-zh-copy" data-cjk-groups lang="zh-Hant">{children}</span>;
}

export function MixedPhrase({ children, lang }: { readonly children: ReactNode; readonly lang: string }) {
  return <span className="admin-mixed-phrase-group" lang={lang}>{children}</span>;
}

export function NarrowCopy({ children, narrow }: { readonly children: ReactNode; readonly narrow: ReactNode }) {
  return <><span className="admin-default-copy">{children}</span><span className="admin-narrow-copy">{narrow}</span></>;
}
