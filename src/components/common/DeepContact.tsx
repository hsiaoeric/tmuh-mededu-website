import { Icon, type IconName } from './Icon';
import { Reveal } from './Reveal';
import { Eyebrow } from './Eyebrow';

interface DeepContactProps {
  id: string;
  accent: string;
  ink: string;
  inkGradientEnd: string;
  closingIcon: IconName;
  closingIconColor: string;
  closingTitle: string;
  closingBody: string;
  contactTitle: string;
  contactPerson: string;
  contactExt: string;
  contactPlace: string;
  contactQuote: string;
}

/** Closing statement + contact card pair, shared by the EBM & Facdev pages. */
export function DeepContact({
  id,
  accent,
  ink,
  inkGradientEnd,
  closingIcon,
  closingIconColor,
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
        width: 36,
        height: 36,
        borderRadius: 'var(--r-md)',
        background: `color-mix(in srgb,${accent} 13%,transparent)`,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} />
    </span>
  );

  return (
    <section id={id} style={{ maxWidth: 1240, margin: '0 auto', padding: '34px 28px 60px' }}>
      <Reveal className="grid grid-split" style={{ gap: 22, alignItems: 'stretch' }}>
        <div
          style={{
            padding: 32,
            borderRadius: 'var(--r-lg)',
            background: `linear-gradient(140deg,${ink},${inkGradientEnd})`,
            color: 'var(--on-ink)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <span style={{ display: 'block', width: 34, height: 34, color: closingIconColor, marginBottom: 16 }}>
            <Icon name={closingIcon} />
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.55, marginBottom: 14 }}>
            {closingTitle}
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.85, color: 'var(--on-ink-dim)' }}>{closingBody}</p>
        </div>
        <div
          style={{
            padding: 32,
            borderRadius: 'var(--r-lg)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--e-1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Eyebrow color={accent}>Contact</Eyebrow>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--text)', marginBottom: 18 }}>
            {contactTitle}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {iconChip('phone')}
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{contactPerson}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>{contactExt}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {iconChip('pin')}
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, color: 'var(--body)' }}>{contactPlace}</div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1.7,
                color: accent,
                marginTop: 6,
                borderLeft: `3px solid ${accent}`,
                paddingLeft: 14,
              }}
            >
              {contactQuote}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
