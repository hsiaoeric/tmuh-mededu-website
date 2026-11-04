import { readFileSync, writeFileSync } from 'node:fs';
import { stableStringify } from '../json';
import { EMPTY_HTTPS_UPGRADES, isPrivateHost, type HttpsUpgrades } from './links';

export const HTTPS_UPGRADES_FILE = new URL('./https-upgrades.json', import.meta.url);

export function readHttpsUpgrades(): HttpsUpgrades {
  try {
    const parsed = JSON.parse(readFileSync(HTTPS_UPGRADES_FILE, 'utf8')) as HttpsUpgrades;
    return parsed.version === 1 && typeof parsed.hosts === 'object' ? parsed : EMPTY_HTTPS_UPGRADES;
  } catch {
    return EMPTY_HTTPS_UPGRADES;
  }
}

export function writeHttpsUpgrades(upgrades: HttpsUpgrades): void {
  writeFileSync(HTTPS_UPGRADES_FILE, stableStringify(upgrades), 'utf8');
}

/** Hosts the importer must never contact: the old site and the hospital site behind it. */
const NEVER_PROBE = /(?:^|\.)tmuh\.org\.tw$/i;

async function probeHost(host: string): Promise<{ https: boolean; detail: string }> {
  if (isPrivateHost(host)) return { https: false, detail: 'private address; not probed' };
  if (NEVER_PROBE.test(host)) return { https: false, detail: 'hospital host; not probed (unreachable from the import environment)' };
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const response = await fetch(`https://${host}/`, { method, redirect: 'manual', signal: AbortSignal.timeout(15_000) });
      const location = response.headers.get('location') ?? '';
      if (/^http:\/\//i.test(location)) return { https: false, detail: `HTTPS redirects back to ${location.slice(0, 80)}` };
      if (response.status < 500 && response.status !== 405) return { https: true, detail: `HTTPS ${method} answered ${response.status}` };
      if (method === 'GET') return { https: false, detail: `HTTPS answered ${response.status}` };
    } catch (error: unknown) {
      if (method === 'GET') {
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : String(error);
        return { https: false, detail: `HTTPS failed: ${cause}`.slice(0, 160) };
      }
    }
  }
  return { https: false, detail: 'HTTPS did not answer' };
}

/**
 * Asks each `http://` host whether it also serves HTTPS and records the answer. Runs only behind
 * `--probe-https`; ordinary imports read the committed file and stay offline. Under the agent
 * proxy, set `NODE_USE_ENV_PROXY=1` so Node's fetch uses it.
 */
export async function probeHttpsUpgrades(hosts: readonly string[], previous: HttpsUpgrades): Promise<HttpsUpgrades> {
  const result: Record<string, { https: boolean; detail: string }> = { ...previous.hosts };
  for (const host of [...new Set(hosts)].sort()) {
    result[host] = await probeHost(host);
  }
  return { version: 1, hosts: result };
}
