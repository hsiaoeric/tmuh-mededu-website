import { useSite } from '@/context/SiteContext';
import { Icon } from '@/components/common/Icon';
import { TmuhLogo } from '@/components/common/TmuhLogo';

/**
 * Address, telephone and crest, ruled off at the foot of a view's closing card.
 *
 * This is what became of the old page `Footer`. The stack has no document end to
 * hang a footer on, so the details ride along on the last card of every view
 * instead, and the persistent HUD carries the brand mark.
 */
export function NxColophon() {
  const { t } = useSite();

  return (
    <div
      style={{
        marginTop: 44,
        paddingTop: 24,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 28,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <TmuhLogo size={36} />
        <div style={{ lineHeight: 1.4 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text)',
            }}
          >
            {t.footBrand}
          </div>
          <div className="nx-tag" style={{ letterSpacing: '.2em' }}>
            {t.footBrandEn}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 560 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 13,
            color: 'var(--body)',
          }}
        >
          <span style={{ width: 14, height: 14, color: 'var(--muted)', flex: 'none' }}>
            <Icon name="pin" />
          </span>
          {t.footAddr}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--body)',
          }}
        >
          <span style={{ width: 14, height: 14, color: 'var(--muted)', flex: 'none' }}>
            <Icon name="phone" />
          </span>
          {t.footTel}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{t.footNote}</p>
      </div>
    </div>
  );
}
