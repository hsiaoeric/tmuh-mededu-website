interface LatestCandidate {
  readonly id: string;
  readonly channel: string;
  readonly publishedOn: string;
  readonly pinned: boolean;
}

/**
 * The home page's 最新公告 list: posts in the announcements channel, pinned ones first, then
 * newest first (ties broken by id, newest-looking id first, as the archive adapter does).
 */
export function latestAnnouncements<Post extends LatestCandidate>(posts: readonly Post[], count: number): Post[] {
  return posts
    .filter((post) => post.channel === 'news')
    .sort((left, right) => (
      Number(right.pinned) - Number(left.pinned)
      || right.publishedOn.localeCompare(left.publishedOn)
      || right.id.localeCompare(left.id)
    ))
    .slice(0, count);
}
