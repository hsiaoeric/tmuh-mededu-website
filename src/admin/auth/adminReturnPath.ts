const ADMIN_ORIGIN = 'https://admin.invalid';
const DEFAULT_ADMIN_PATH = '/admin';
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MALFORMED_PERCENT_PATTERN = /%(?![0-9a-f]{2})/i;
const ENCODED_SEPARATOR_PATTERN = /%(?:2f|5c)/i;

export function resolveAdminReturnPath(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    value.includes('\\') ||
    MALFORMED_PERCENT_PATTERN.test(value) ||
    !URL.canParse(value, ADMIN_ORIGIN)
  ) {
    return DEFAULT_ADMIN_PATH;
  }

  const parsed = new URL(value, ADMIN_ORIGIN);
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    parsed.origin !== ADMIN_ORIGIN ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    `${parsed.pathname}${parsed.search}${parsed.hash}` !== value
  ) {
    return DEFAULT_ADMIN_PATH;
  }

  const pathnameEnd = value.search(/[?#]/);
  const rawPathname = pathnameEnd === -1 ? value : value.slice(0, pathnameEnd);
  if (rawPathname !== DEFAULT_ADMIN_PATH && !rawPathname.startsWith('/admin/')) {
    return DEFAULT_ADMIN_PATH;
  }

  let decodedPathname = rawPathname;
  while (decodedPathname.includes('%')) {
    if (
      MALFORMED_PERCENT_PATTERN.test(decodedPathname) ||
      ENCODED_SEPARATOR_PATTERN.test(decodedPathname)
    ) {
      return DEFAULT_ADMIN_PATH;
    }

    try {
      const nextPathname = decodeURIComponent(decodedPathname);
      if (nextPathname === decodedPathname) break;
      decodedPathname = nextPathname;
    } catch (error: unknown) {
      if (error instanceof URIError) return DEFAULT_ADMIN_PATH;
      throw error;
    }
  }

  const pathSegments = decodedPathname.split('/');
  const comparablePathname = decodedPathname.toLowerCase();
  if (
    CONTROL_CHARACTER_PATTERN.test(decodedPathname) ||
    decodedPathname.includes('\\') ||
    pathSegments.some((segment) => segment === '.' || segment === '..') ||
    comparablePathname === '/admin/login' ||
    comparablePathname.startsWith('/admin/login/') ||
    (decodedPathname !== DEFAULT_ADMIN_PATH && !decodedPathname.startsWith('/admin/'))
  ) {
    return DEFAULT_ADMIN_PATH;
  }

  return value;
}
