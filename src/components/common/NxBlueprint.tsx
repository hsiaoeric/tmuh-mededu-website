interface NxBlueprintProps {
  /** Which figure to draw. */
  variant: 'evidence' | 'faculty';
  label: string;
}

/**
 * A hairline technical figure for the center heroes.
 *
 * It replaces the Morandi-palette illustrations the two center pages used to
 * carry: those were soft, rounded and full of pastel fills, which is the exact
 * opposite of the Nexus language. This draws the same subject — a body of
 * evidence, a cohort of teachers — as an instrument-panel schematic in steel
 * hairlines with volt markers, so it belongs to the same system as the rest of
 * the page and re-colours itself with the theme.
 *
 * Colours are set through `style`, not through `stroke=`/`fill=` attributes,
 * because SVG presentation attributes do not resolve custom properties.
 */
export function NxBlueprint({ variant, label }: NxBlueprintProps) {
  const line = { stroke: 'var(--border-strong)', fill: 'none', strokeWidth: 1 };
  const faint = { stroke: 'var(--border)', fill: 'none', strokeWidth: 1 };
  const volt = { stroke: 'var(--volt)', fill: 'none', strokeWidth: 1.5 };
  const voltFill = { fill: 'var(--volt)' };

  return (
    <figure style={{ width: '100%', maxWidth: 420 }}>
      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-label={label}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Registration grid, matching the 80px page grid at this scale. */}
        <g style={faint}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={300} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <line key={`h${i}`} x1={0} y1={i * 80} x2={400} y2={i * 80} />
          ))}
        </g>

        {variant === 'evidence' ? (
          <>
            {/* Stacked evidence tiers, narrowing toward a single conclusion. */}
            <g style={line}>
              <rect x="40" y="222" width="300" height="34" />
              <rect x="80" y="180" width="220" height="34" />
              <rect x="120" y="138" width="140" height="34" />
              <rect x="160" y="96" width="60" height="34" />
            </g>
            {/* The appraisal trace running across the tiers. */}
            <polyline
              style={volt}
              points="52,244 118,244 132,202 202,202 216,160 248,160 262,118 300,118"
            />
            <circle cx="52" cy="244" r="3.5" style={voltFill} />
            <circle cx="300" cy="118" r="4.5" style={voltFill} />
            {/* Measurement callout. */}
            <g style={line}>
              <line x1="330" y1="96" x2="330" y2="256" />
              <line x1="324" y1="96" x2="336" y2="96" />
              <line x1="324" y1="256" x2="336" y2="256" />
            </g>
            <circle cx="190" cy="52" r="22" style={line} />
            <line x1="206" y1="68" x2="228" y2="90" style={line} />
            <line x1="182" y1="52" x2="198" y2="52" style={volt} />
          </>
        ) : (
          <>
            {/* One root, six cultivation groups: the faculty structure as a bus. */}
            <rect x="150" y="34" width="100" height="36" style={line} />
            <line x1="200" y1="70" x2="200" y2="104" style={line} />
            <line x1="44" y1="104" x2="356" y2="104" style={volt} />
            {[44, 106, 168, 230, 292, 354].map((x, i) => (
              <g key={x}>
                <line x1={x} y1="104" x2={x} y2="136" style={line} />
                <rect x={x - 22} y="136" width="44" height="52" style={line} />
                {/* The two groups with the deepest programmes are marked live. */}
                {i === 1 || i === 4 ? (
                  <circle cx={x} cy="162" r="4" style={voltFill} />
                ) : (
                  <circle cx={x} cy="162" r="4" style={line} />
                )}
              </g>
            ))}
            {/* Cohort tally along the base. */}
            <g style={line}>
              <line x1="44" y1="240" x2="356" y2="240" />
              {Array.from({ length: 13 }, (_, i) => 44 + i * 26).map((x, i) => (
                <line key={x} x1={x} y1="240" x2={x} y2={240 - (i % 4) * 9 - 12} />
              ))}
            </g>
            <line x1="44" y1="264" x2="200" y2="264" style={volt} />
          </>
        )}
      </svg>
      <figcaption
        className="nx-tag"
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}
      >
        {label}
      </figcaption>
    </figure>
  );
}
