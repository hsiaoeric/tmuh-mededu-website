import { CENTER_OWNER_IDS, type AudienceOwner } from '@/content/contracts/archiveIds';
import { centerById } from '@/data/centers';

type CenterOwner = (typeof CENTER_OWNER_IDS)[number];

function isCenterOwner(owner: string): owner is CenterOwner {
  return CENTER_OWNER_IDS.some((id) => id === owner);
}

/**
 * The `--tone` for an archive item's owner: the center's colour for center-owned items, otherwise
 * `undefined`, which leaves components on `var(--accent)` (the department, the digital materials
 * room, and the trainee programs).
 */
export function ownerTone(owner: AudienceOwner | null | undefined): string | undefined {
  if (owner === null || owner === undefined || !isCenterOwner(owner)) return undefined;
  return centerById(owner)?.color;
}
