import type { IconName as RendererIconName } from '@/ui/Icon';

export const ICON_NAMES = [
  'cap', 'skills', 'chart', 'holistic', 'heart', 'research', 'admin', 'book',
  'phone', 'clipboard', 'bulb', 'team', 'brain', 'sprout', 'network', 'award',
  'globe', 'sun', 'moon', 'arrow', 'arrowUpRight', 'arrowDown', 'close', 'menu',
  'plus', 'minus', 'quote', 'pin', 'calendar', 'spark', 'check', 'alert', 'upload',
  'image', 'trash', 'refresh', 'search',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

type IconNamesMatch = [RendererIconName] extends [IconName]
  ? [IconName] extends [RendererIconName] ? true : never
  : never;

export const ICON_NAMES_MATCH_RENDERER: IconNamesMatch = true;
