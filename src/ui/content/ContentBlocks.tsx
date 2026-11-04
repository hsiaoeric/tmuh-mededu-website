import { useEffect, useState, type ReactNode } from 'react';
import { resolvePublishedMediaUrl } from '@/content/adapters/media';
import { useContentMediaLocation } from '@/content/ContentProvider';
import type { PublishedBlock, Run } from '@/content/contracts/blocks';
import { Icon } from '@/ui/Icon';
import { ContentLink } from './ContentLink';
import { useContentCopy } from './copy';
import { fallbackLangProps } from './Localized';
import { VideoFacade } from './VideoFacade';

type HeadingLevel = 2 | 3 | 4 | 5;
type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface ContentBlocksProps {
  readonly blocks: readonly PublishedBlock[];
  /** True when the blocks are the Chinese fallback for an English reader. */
  readonly fallback?: boolean;
  /**
   * The HTML level a block heading of level 2 renders at. A body under the page's `<h1>` keeps the
   * default 2; a body nested inside a section titled by an `<h2>` passes 3, and so on.
   */
  readonly headingLevel?: HeadingLevel;
  /** Title used to name embedded videos, which carry only an id. */
  readonly videoTitle?: string;
  readonly className?: string;
}

/**
 * Renders a published rich-text body as React elements. There is no raw HTML path: text is only
 * ever a child string, and links pass through `ContentLink`, which drops anything that is not an
 * https, http, site-path, mailto, or tel target.
 */
export function ContentBlocks({ blocks, fallback = false, headingLevel = 2, videoTitle, className }: ContentBlocksProps) {
  const copy = useContentCopy();
  let tableCount = 0;
  let videoCount = 0;

  return (
    <div className={['content-blocks', className].filter(Boolean).join(' ')} {...fallbackLangProps({ fallback })}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index} className="content-p"><Runs runs={block.runs} /></p>;
          case 'heading': {
            const level = Math.min(6, headingLevel + (block.level - 2));
            const Tag = `h${level}` as HeadingTag;
            return (
              <Tag key={index} className={`content-heading content-heading-${block.level}`}>
                {block.text}
              </Tag>
            );
          }
          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
              <ListTag key={index} className={`content-list ${block.ordered ? 'content-list-ordered' : ''}`}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}><Runs runs={item} /></li>
                ))}
              </ListTag>
            );
          }
          case 'image':
            return <ContentImage key={index} block={block} />;
          case 'table':
            tableCount += 1;
            return <ContentTable key={index} block={block} label={copy.table(tableCount)} />;
          case 'divider':
            return <hr key={index} className="content-divider" />;
          case 'video': {
            videoCount += 1;
            const base = videoTitle ?? copy.videoFallbackTitle;
            return (
              <VideoFacade
                key={index}
                className="content-video"
                youtubeId={block.youtubeId}
                title={videoCount > 1 ? `${base} (${videoCount})` : base}
              />
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

function Runs({ runs }: { readonly runs: readonly Run[] }) {
  return (
    <>
      {runs.map((run, index) => {
        let node: ReactNode = run.text;
        if (run.strong === true) node = <strong>{node}</strong>;
        if (run.href !== undefined) {
          node = <ContentLink href={run.href} className="content-link">{node}</ContentLink>;
        }
        return <span key={index} className="content-run">{node}</span>;
      })}
    </>
  );
}

type ImageBlock = Extract<PublishedBlock, { type: 'image' }>;

function ContentImage({ block }: { readonly block: ImageBlock }) {
  const copy = useContentCopy();
  const media = useContentMediaLocation();
  const src = resolvePublishedMediaUrl(block.media, media);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  const showImage = src !== '' && failedSrc !== src;

  return (
    <figure className="content-figure">
      {showImage ? (
        <img
          className="content-image"
          src={src}
          alt={block.alt}
          width={block.width}
          height={block.height}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="content-image-missing" role="img" aria-label={block.alt}>
          <Icon name="image" size={22} />
          <span className="tiny" aria-hidden="true">{copy.imageUnavailable}</span>
        </div>
      )}
      {block.caption !== undefined && <figcaption className="content-caption">{block.caption}</figcaption>}
    </figure>
  );
}

type TableBlock = Extract<PublishedBlock, { type: 'table' }>;

function ContentTable({ block, label }: { readonly block: TableBlock; readonly label: string }) {
  return (
    // A labelled, focusable region so keyboard users can scroll a wide table sideways.
    <div className="content-table-scroll scroll-x" role="region" aria-label={label} tabIndex={0}>
      <table className="table content-table">
        {block.header !== undefined && (
          <thead>
            <tr>
              {block.header.map((cell, index) => <th key={index} scope="col">{cell}</th>)}
            </tr>
          </thead>
        )}
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
