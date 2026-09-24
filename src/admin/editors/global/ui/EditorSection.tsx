import type { ReactNode } from 'react';

type EditorSectionProps = {
  readonly id: string;
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

export function EditorSection({ id, title, description, actions, children }: EditorSectionProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className="admin-editor-section admin-surface" aria-labelledby={titleId}>
      <header className="admin-editor-section-header">
        <div className="admin-section-heading">
          <h2 id={titleId} tabIndex={-1}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="admin-editor-section-actions">{actions}</div> : null}
      </header>
      <div className="admin-editor-section-content">{children}</div>
    </section>
  );
}
