import { Icon, type IconName } from './Icon';
import { Reveal } from './Reveal';
import { NxColophon } from './NxColophon';

interface DeepContactProps {
  /** Card number in the view's stack, for the head. */
  num: string;
  accent: string;
  closingIcon: IconName;
  closingTitle: string;
  closingBody: string;
  contactTitle: string;
  contactPerson: string;
  contactExt: string;
  contactPlace: string;
  contactQuote: string;
}

/**
 * The closing card shared by the EBM and Faculty Development pages: a parting
 * statement, the contact details, and the colophon that used to be the page
 * footer.
 *
 * It renders the *contents* of a card, not the card — the view wraps it in a
 * dark `ZCard`, which is what supplies the carbon ground the crosshairs and
 * volt markers are drawn against.
 */
export function DeepContact({
  num,
  accent,
  closingIcon,
  closingTitle,
  closingBody,
  contactTitle,
  contactPerson,
  contactExt,
  contactPlace,
  contactQuote,
}: DeepContactProps) {
  const iconChip = (name: IconName) => (
    <span
      style={{
        width: 34,
        height: 34,
        flex: 'none',
        border: '1px solid rgba(244,245,246,.3)',
        color: 'var(--volt)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} />
    </span>
  );

  return (
    <>
      <div className="nx-grid-bg" aria-hidden="true" />
      <div className="nx-crosshair-v" style={{ left: '60%' }} aria-hidden="true" />
      <div className="nx-crosshair-h" style={{ top: '40%' }} aria-hidden="true" />
      <div className="nx-node" style={{ left: '60%', top: '40%' }} aria-hidden="true" />

      <div style={{ position: 'relative' }}>
        <Reveal style={{ marginBottom: 32, maxWidth: 720 }}>
          <span className="nx-tag" style={{ color: 'var(--volt)' }}>
            {num} / CONTACT
          </span>
          <span
            style={{
              display: 'block',
              width: 30,
              height: 30,
              color: 'var(--volt)',
              margin: '20px 0 18px',
            }}
          >
            <Icon name={closingIcon} />
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 'clamp(24px,3.2vw,40px)',
              lineHeight: 1.14,
              letterSpacing: '-0.03em',
              color: 'var(--titanium)',
              marginBottom: 16,
            }}
          >
            {closingTitle}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(244,245,246,.72)', maxWidth: 660 }}>
            {closingBody}
          </p>
        </Reveal>

        <Reveal className="grid grid-split" style={{ gap: 0, alignItems: 'stretch' }}>
          <div
            style={{
              padding: '26px 28px',
              border: '1px solid rgba(244,245,246,.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <span className="nx-tag" style={{ color: 'var(--volt-soft)' }}>
              {contactTitle}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {iconChip('phone')}
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--titanium)' }}>
                  {contactPerson}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--volt-soft)' }}>
                  {contactExt}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {iconChip('pin')}
              <div style={{ fontSize: 14, color: 'rgba(244,245,246,.78)' }}>{contactPlace}</div>
            </div>
          </div>
          <div
            style={{
              padding: '26px 28px',
              border: '1px solid rgba(244,245,246,.18)',
              borderLeft: `2px solid ${accent}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 19,
                lineHeight: 1.6,
                letterSpacing: '-0.02em',
                color: 'var(--titanium)',
              }}
            >
              {contactQuote}
            </p>
          </div>
        </Reveal>

        <NxColophon />
      </div>
    </>
  );
}
