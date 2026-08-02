import { useEffect, useRef, type CSSProperties } from 'react';
import { useSite } from '@/context/SiteContext';
import {
  type Center,
  CENTER_BRANCHES,
  CENTER_ICON,
  READY_CENTER_PAGES,
} from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { formatPhoneExt } from '@/utils/phone';
import { AdminTeamTree } from './AdminTeamTree';

interface Props {
  center: Center;
  activeBranchId: string | null;
  onBranchSelect: (branchId: string) => void;
  onClose: () => void;
}

const EXTENSIONS: Array<{ name: string; ext: string }> = [
  { name: '王怡文', ext: '3752' },
  { name: '陳均茹', ext: '3757' },
  { name: '江明憲', ext: '3760' },
  { name: '賴哲民 / 張家銘', ext: '3770' },
];

export function CenterDetailPanel({
  center,
  activeBranchId,
  onBranchSelect,
  onClose,
}: Props) {
  const { isZh, lang, enterCenter } = useSite();
  const bodyRef = useRef<HTMLDivElement>(null);
  const branches = CENTER_BRANCHES[center.id];
  const resolvedBranchId = activeBranchId ?? branches[0]?.id ?? null;
  const activeBranch = branches.find((b) => b.id === resolvedBranchId) ?? branches[0];
  const isAdmin = center.id === 'admin';
  const hasPage = READY_CENTER_PAGES.includes(center.id) || !!center.externalUrl;
  const pageCtaStyle: CSSProperties = {
    marginTop: 20,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    background: center.color,
    color: '#fff',
    fontFamily: "'Noto Sans TC', sans-serif",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
  };
  const contactLine = center.ext
    ? `${isZh ? center.contactZh : center.contactEn} · ${formatPhoneExt(center.ext, lang)}`
    : '';

  useEffect(() => {
    if (!activeBranch || !bodyRef.current) return;
    const target = bodyRef.current.querySelector(
      `[data-panel-section="${activeBranch.panelSection}"][data-branch-id="${activeBranch.id}"]`,
    ) as HTMLElement | null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeBranch]);

  const renderSectionContent = () => {
    if (!activeBranch) return null;
    const desc = isZh ? activeBranch.descZh : activeBranch.descEn;
    const label = isZh ? activeBranch.zh : activeBranch.en;

    switch (activeBranch.panelSection) {
      case 'intro':
        return (
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.8,
              color: 'var(--body)',
              borderLeft: `3px solid ${center.color}`,
              paddingLeft: 16,
            }}
          >
            {isAdmin && activeBranch.id === 'leadership'
              ? desc
              : isZh
                ? center.introZh
                : center.introEn}
          </p>
        );
      case 'team':
        return <AdminTeamTree center={center} />;
      case 'contact':
        if (isAdmin && activeBranch.id === 'extensions') {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EXTENSIONS.map((item) => (
                <div
                  key={item.ext}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                  }}
                >
                  <span style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 14, color: 'var(--text)' }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      color: center.color,
                    }}
                  >
                    {isZh ? `分機 ${item.ext}` : `Ext. ${item.ext}`}
                  </span>
                </div>
              ))}
            </div>
          );
        }
        return contactLine ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: '10px 18px',
              borderRadius: 999,
              background: 'var(--teal-50)',
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 14,
              color: 'var(--teal-700)',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'block', width: 15, height: 15 }}>
              <Icon name="phone" />
            </span>
            {contactLine}
          </div>
        ) : (
          <p style={{ fontSize: 14.5, color: 'var(--muted)' }}>{desc}</p>
        );
      case 'detail':
      default:
        return (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 14,
              border: `1px solid color-mix(in srgb,${center.color} 25%,var(--border))`,
              background: `color-mix(in srgb,${center.color} 6%,var(--surface))`,
            }}
          >
            <div
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 800,
                fontSize: 17,
                color: 'var(--text)',
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--body)' }}>{desc}</p>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        marginTop: 34,
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-lift)',
      }}
    >
      <div
        style={{
          padding: '26px 30px',
          background: `linear-gradient(120deg,color-mix(in srgb,${center.color} 16%,var(--surface)),var(--surface))`,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            width: 50,
            height: 50,
            borderRadius: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: center.color,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <Icon name={CENTER_ICON[center.id] as IconName} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 23, color: 'var(--text)' }}>
            {isZh ? center.zh : center.en}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 12,
              letterSpacing: '.05em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            {center.en}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '18px 30px 0', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'min-content', paddingBottom: 14 }}>
          {branches.map((branch) => {
            const on = branch.id === resolvedBranchId;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => onBranchSelect(branch.id)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: `1px solid ${on ? center.color : 'var(--border)'}`,
                  background: on
                    ? `color-mix(in srgb,${center.color} 12%,var(--surface))`
                    : 'var(--surface)',
                  color: on ? center.color : 'var(--body)',
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {branch.icon && (
                  <span style={{ width: 14, height: 14, display: 'block' }}>
                    <Icon name={branch.icon} />
                  </span>
                )}
                {isZh ? branch.zh : branch.en}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={bodyRef} style={{ padding: '24px 30px 30px', maxHeight: 520, overflowY: 'auto' }}>
        {activeBranch && (
          <div
            data-panel-section={activeBranch.panelSection}
            data-branch-id={activeBranch.id}
          >
            {renderSectionContent()}

            {hasPage && (center.externalUrl || activeBranch.pageSection) &&
              (center.externalUrl ? (
                <a
                  href={center.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={pageCtaStyle}
                >
                  {isZh ? '前往官方網站' : 'Visit official website'}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => enterCenter(center.id, activeBranch.pageSection)}
                  style={pageCtaStyle}
                >
                  {isZh ? '進入專頁' : 'Enter center page'}
                  <span style={{ width: 14, height: 14, display: 'block' }}>
                    <Icon name="arrow" />
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
