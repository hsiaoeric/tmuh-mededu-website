export const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * A domain-warped fBm field. Three nested warps turn plain noise into the
 * filament-and-cell structure the design is named after; the ridged term
 * (`veins`) is what reads as tissue rather than as smoke.
 */
export const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uPointer;
  uniform float uScroll;
  uniform vec3  uA;
  uniform vec3  uB;
  uniform vec3  uC;
  uniform float uStrength;
  uniform float uIntro;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p = rot * p * 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
    p.y += uScroll * 0.30;

    float t = uTime * 0.028;

    // Three-stage domain warp. Low frequencies keep the structures large and
    // slow — this is a backdrop for body copy, not a texture in its own right.
    vec2 q = vec2(fbm(p * 0.62 + t), fbm(p * 0.62 + vec2(3.2, 1.7) - t));
    vec2 r = vec2(fbm(p * 0.74 + 1.5 * q + vec2(1.7, 9.2) + t * 1.25),
                  fbm(p * 0.74 + 1.5 * q + vec2(8.3, 2.8) - t * 1.05));
    float f = fbm(p * 0.70 + 1.9 * r);

    // Ridged term — the filaments.
    float veins = 1.0 - abs(sin(f * 2.4 + t * 1.4));
    veins = pow(clamp(veins, 0.0, 1.0), 4.5);

    // Cursor warmth.
    float d = distance(p, uPointer);
    float bloom = exp(-d * d * 4.0);

    // The accent mix stays tiny: against a near-black base even a 10% mix
    // toward bright jade doubles the luminance and starts fighting the type.
    vec3 col = mix(uA, uB, smoothstep(-0.9, 1.1, f));
    col = mix(col, uC, veins * 0.045 * uStrength + bloom * 0.05 * uStrength);

    float cells = smoothstep(0.35, 1.0, fbm(p * 1.7 - r * 0.9 + t * 0.55));
    col += uC * cells * 0.010 * uStrength;

    float vig = smoothstep(1.5, 0.1, length(p));
    col *= mix(0.88, 1.0, vig);

    // Intro wipe from the centre outward on first paint.
    col = mix(uA, col, smoothstep(0.0, 1.0, uIntro * 1.6 - length(p) * 0.35));

    gl_FragColor = vec4(col, 1.0);
  }
`;
