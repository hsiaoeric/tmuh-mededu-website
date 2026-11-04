import { useMemo, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { useSite } from '@/app/site';
import { pickLocalized, type LocalizedPick } from '@/content/adapters/archive';
import { useContentCopy } from './copy';

type Fallback = { readonly fallback: boolean };

/**
 * The `lang` attribute for text that fell back to Chinese in the English UI. Setting it keeps the
 * `:lang(zh-Hant)` display twins (size, weight, measure) working on that element, and lets screen
 * readers switch voice.
 */
export function fallbackLangProps(value: Fallback | null | undefined): { lang?: 'zh-Hant' } {
  return value?.fallback === true ? { lang: 'zh-Hant' } : {};
}

/** `pickLocalized` for the current site language, plus the attribute to spread on the element. */
export function useLocalizedText(value: { readonly zh: string; readonly en?: string }) {
  const { lang } = useSite();
  return useMemo(() => {
    const picked = pickLocalized(value, lang);
    return { ...picked, langProps: fallbackLangProps(picked) };
  }, [lang, value]);
}

/**
 * A small "Chinese only" tag. Renders only in the English UI and only when the content beside it
 * fell back to Chinese, so callers can place it unconditionally.
 */
export function ChineseOnlyTag({ fallback, style }: { readonly fallback: boolean; readonly style?: CSSProperties }) {
  const { lang } = useSite();
  const copy = useContentCopy();
  if (lang !== 'en' || !fallback) return null;
  return (
    <span className="content-zh-only" lang="en" style={style}>
      {copy.chineseOnly}
    </span>
  );
}

interface LocalizedTextProps {
  readonly value: LocalizedPick;
  readonly as?: ElementType;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly id?: string;
  /** Append the "Chinese only" tag inside the element, after the text. */
  readonly tag?: boolean;
  readonly children?: ReactNode;
}

/** Renders an already-picked localized string, marking Chinese fallback with `lang="zh-Hant"`. */
export function LocalizedText({ value, as: Tag = 'span', className, style, id, tag = false, children }: LocalizedTextProps) {
  return (
    <Tag className={className} style={style} id={id} {...fallbackLangProps(value)}>
      {value.text}
      {children}
      {tag && value.fallback && (
        <>
          {' '}
          <ChineseOnlyTag fallback />
        </>
      )}
    </Tag>
  );
}
