import { classifyLinkHref } from '../../../src/content/contracts/blocks';
import { legacyLocationFromHref, type LegacyLocation } from './paths';

/** `scripts/content/legacy/https-upgrades.json`: the committed result of `--probe-https`. */
export type HttpsUpgrades = {
  readonly version: 1;
  /** Lowercase host → whether `https://` answered for it when probed. */
  readonly hosts: Readonly<Record<string, { readonly https: boolean; readonly detail: string }>>;
};

export const EMPTY_HTTPS_UPGRADES: HttpsUpgrades = { version: 1, hosts: {} };

/**
 * Undoes the old editor's damage to a pasted href: HTML entities that were escaped twice
 * (`&amp;amp;`), zero-width spaces, surrounding whitespace, and a scheme typed in front of a
 * full URL (`http://https://library…`). Non-ASCII characters are percent-encoded so the result
 * is a plain ASCII URL.
 */
export function repairHref(raw: string): string {
  let value = raw.replace(/[​-‍⁠﻿]/g, '').trim();
  while (/&amp;/i.test(value)) value = value.replace(/&amp;/gi, '&');
  value = value.replace(/^(?:https?:\/\/)+(https?:\/\/)/i, '$1');
  value = value.replace(/^(https?):\/\/\//i, '$1://');
  value = value.replace(/\s+/g, (space) => (space === ' ' ? '%20' : encodeURIComponent(space)));
  return value.replace(/[^\x00-\x7F]+/g, (text) => encodeURIComponent(text));
}

export function httpHost(href: string): string | undefined {
  const match = /^http:\/\/([^/?#:]+)/i.exec(href);
  return match?.[1]?.toLowerCase();
}

/** True for hosts a public probe can never answer for (private IPv4 ranges, localhost). */
export function isPrivateHost(host: string): boolean {
  if (host === 'localhost') return true;
  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [a, b] = octets as [number, number, number, number];
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export type LinkOutcome =
  | { readonly status: 'internal'; readonly href: string; readonly from: string }
  | { readonly status: 'external'; readonly href: string }
  | { readonly status: 'upgraded'; readonly href: string; readonly from: string }
  | { readonly status: 'http'; readonly href: string }
  | { readonly status: 'repaired'; readonly href: string; readonly from: string }
  | { readonly status: 'dropped'; readonly from: string; readonly reason: string };

export type LinkResolverOptions = {
  /** The mirror file (relative to the mirror root) the link was found on. */
  readonly pageRelativeFile: string;
  /** Maps an old-site location to its new site path, or undefined when nothing replaces it. */
  readonly resolveLegacy: (location: LegacyLocation) => string | undefined;
  readonly httpsUpgrades: HttpsUpgrades;
};

/**
 * Decides what an old href becomes. Old-site links (relative, or absolute on the old host) are
 * rewritten to new paths through the redirect table; `http://` links are upgraded only when the
 * committed probe result says the host serves HTTPS, and are otherwise kept as plain `http`.
 */
export function resolveLegacyHref(raw: string, options: LinkResolverOptions): LinkOutcome {
  const from = raw;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.startsWith('#') || /^javascript:/i.test(trimmed)) {
    return { status: 'dropped', from, reason: 'no destination' };
  }
  const repaired = repairHref(trimmed);
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(repaired);
  const location = !isAbsolute || /^https?:\/\/tmuh-education\.tmuh\.org\.tw(?:[/:?#]|$)/i.test(repaired)
    ? legacyLocationFromHref(repaired, options.pageRelativeFile)
    : undefined;
  if (location !== undefined) {
    const target = options.resolveLegacy(location);
    return target === undefined
      ? { status: 'dropped', from, reason: 'old-site page with no replacement' }
      : { status: 'internal', href: target, from };
  }
  if (!isAbsolute) return { status: 'dropped', from, reason: 'unresolvable relative link' };
  const host = httpHost(repaired);
  if (host !== undefined) {
    const probe = options.httpsUpgrades.hosts[host];
    if (probe?.https === true) {
      const upgraded = repaired.replace(/^http:/i, 'https:');
      if (classifyLinkHref(upgraded) === 'https') return { status: 'upgraded', href: upgraded, from };
    }
  }
  const kind = classifyLinkHref(repaired);
  if (kind === null) return { status: 'dropped', from, reason: 'not a safe link' };
  if (kind === 'http') return { status: 'http', href: repaired };
  if (repaired !== trimmed) return { status: 'repaired', href: repaired, from };
  return { status: 'external', href: repaired };
}

export function outcomeHref(outcome: LinkOutcome): string | null {
  return outcome.status === 'dropped' ? null : outcome.href;
}
