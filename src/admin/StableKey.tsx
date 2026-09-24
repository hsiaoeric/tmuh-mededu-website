import { Fragment } from 'react';

export function StableKey({ value }: { readonly value: string }) {
  const segments = value.split(/([_-])/u);

  return (
    <code className="admin-stable-key mono" aria-label={value}>
      {segments.map((segment, index) => (
        <Fragment key={`${index}-${segment}`}>
          {segment}
          {(segment === '_' || segment === '-') && index < segments.length - 1 ? <wbr /> : null}
        </Fragment>
      ))}
    </code>
  );
}
