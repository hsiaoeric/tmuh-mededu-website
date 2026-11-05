import { classifyLinkHref, isLocalFilePath, type LinkHrefKind } from '@/content/contracts/blocks';

export type HrefKind = LinkHrefKind | 'file';

export type HrefCheck =
  | { readonly status: 'empty' }
  | { readonly status: 'invalid' }
  | { readonly status: 'valid'; readonly kind: HrefKind };

/** What a link or attachment target is, using exactly the published contract's rules. */
export function checkHref(value: string, allowFile: boolean): HrefCheck {
  if (value === '') return { status: 'empty' };
  const kind = classifyLinkHref(value);
  if (kind !== null) return { status: 'valid', kind };
  if (allowFile && isLocalFilePath(value)) return { status: 'valid', kind: 'file' };
  return { status: 'invalid' };
}

export function hrefErrorMessage(check: HrefCheck, allowFile: boolean, isZh: boolean): string | undefined {
  switch (check.status) {
    case 'valid':
      return undefined;
    case 'empty':
      return isZh ? '請輸入連結。' : 'Enter a link.';
    case 'invalid':
      if (allowFile) {
        return isZh
          ? '請輸入 https:// 或 http:// 網址、站內路徑（/ 開頭）、mailto:、tel:，或 files/legacy/ 下的檔案路徑。'
          : 'Enter an https:// or http:// URL, a site path starting with /, mailto:, tel:, or a files/legacy/ file path.';
      }
      return isZh
        ? '請輸入 https:// 或 http:// 網址、站內路徑（/ 開頭）、mailto: 或 tel:。網址不可包含帳號密碼或空白。'
        : 'Enter an https:// or http:// URL, a site path starting with /, mailto:, or tel:. No credentials or spaces.';
  }
}

/** A short note about a valid target, such as a warning for plain http. */
export function hrefHelper(check: HrefCheck, isZh: boolean): string | undefined {
  if (check.status !== 'valid') return undefined;
  switch (check.kind) {
    case 'https':
      return isZh ? '外部網址，於新分頁開啟。' : 'External URL, opens in a new tab.';
    case 'http':
      return isZh ? '注意：未加密的 http 網址。若對方支援，請改用 https://。' : 'Note: unencrypted http URL. Use https:// if the site supports it.';
    case 'internal':
      return isZh ? '本站頁面。' : 'A page on this site.';
    case 'mailto':
      return isZh ? '電子郵件連結。' : 'Email link.';
    case 'tel':
      return isZh ? '電話連結。' : 'Phone link.';
    case 'file':
      return isZh ? '網站內保存的舊網站檔案。' : 'A file kept from the old site.';
  }
}
