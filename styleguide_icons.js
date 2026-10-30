// Fa 2.0 styleguide — hand-authored inline SVG icon set and logos.
// No icon fonts, no raster assets, no generated images: every mark below is
// drawn on a 24 px grid and inherits `currentColor` from the token theme.

export const ICONS = {
  chat: '<path d="M5 6.5h14v9H9.5L5 19.2z"/><path d="M8.5 10h7M8.5 12.8h4"/>',
  compose: '<path d="M6 18.2l.9-3.6L15.9 5.6a1.9 1.9 0 0 1 2.7 2.7L9.6 17.3z"/><path d="M14.4 7.2l2.7 2.7"/>',
  search: '<circle cx="11" cy="11" r="5.5"/><path d="M15.2 15.2L19.5 19.5"/>',
  agent: '<circle cx="12" cy="8.4" r="3.4"/><path d="M5.8 19c.7-3.4 3.2-5.2 6.2-5.2s5.5 1.8 6.2 5.2"/>',
  channel: '<path d="M9.4 5.5L7.2 18.5M15.5 5.5l-2.2 13M5.8 9.7h13M4.7 14.5h13"/>',
  network: '<circle cx="12" cy="5.8" r="2.1"/><circle cx="5.6" cy="17.2" r="2.1"/><circle cx="18.4" cy="17.2" r="2.1"/><path d="M10.7 7.5L6.8 15.4M13.3 7.5l3.9 7.9M7.7 17.2h8.6"/>',
  apps: '<rect x="5" y="5" width="5.6" height="5.6" rx="1.4"/><rect x="13.4" y="5" width="5.6" height="5.6" rx="1.4"/><rect x="5" y="13.4" width="5.6" height="5.6" rx="1.4"/><rect x="13.4" y="13.4" width="5.6" height="5.6" rx="1.4"/>',
  board: '<rect x="5" y="5.5" width="14" height="13" rx="2"/><path d="M9 8.5v7M14.2 8.5v4.4"/>',
  store: '<path d="M5.5 9.2h13l-1 9.3h-11z"/><path d="M9 9.2V7.9a3 3 0 0 1 6 0v1.3"/>',
  activity: '<path d="M5.5 12.2h3.2l2-5.4 3 10.4 2-5h3"/>',
  shield: '<path d="M12 5l6 2.2v4.3c0 3.4-2.4 6-6 7.2-3.6-1.2-6-3.8-6-7.2V7.2z"/><path d="M9.4 12l1.9 1.9 3.4-3.6"/>',
  task: '<rect x="5.5" y="6" width="13" height="12.5" rx="2"/><path d="M8.8 10.2l1.7 1.7 3-3.1M8.8 15.2h6.4"/>',
  model: '<path d="M12 2.5 L14.4 9.6 L21.5 12 L14.4 14.4 L12 21.5 L9.6 14.4 L2.5 12 L9.6 9.6 Z"/>', // Sleek 4-point AI spark icon
  attach: '<path d="M12 5.5v13M5.5 12h13"/>',
  send: '<path d="M5 12l14-6.3-3.4 13.1-4.2-4.6z"/><path d="M11.4 14.2L19 5.7"/>',
  mic: '<rect x="9.7" y="5.2" width="4.6" height="8.6" rx="2.3"/><path d="M7 11.6a5 5 0 0 0 10 0M12 16.6v2.2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12 L20 3 M16 7 l2 2 M18 5 l2 2"/>',
  storage: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6 v6 c0 1.66 3.58 3 8 3 s8 -1.34 8 -3 V6 M4 12 v6 c0 1.66 3.58 3 8 3 s8 -1.34 8 -3 V12"/>',
  settings: '<circle cx="12" cy="12" r="2.7"/><path d="M12 5.2v2M12 16.8v2M5.2 12h2M16.8 12h2M7.2 7.2l1.4 1.4M15.4 15.4l1.4 1.4M16.8 7.2l-1.4 1.4M8.6 15.4l-1.4 1.4"/>',
  invite: '<rect x="5" y="5" width="6" height="6" rx="1"/><rect x="13" y="5" width="6" height="6" rx="1"/><rect x="5" y="13" width="6" height="6" rx="1"/><path d="M13.5 16h5M16 13.5v5"/>',
  terminal: '<rect x="5" y="5.5" width="14" height="13" rx="2"/><path d="M8.6 10l2.2 2.2-2.2 2.2M12.7 14.5h3"/>',
  pin: '<path d="M8 4.8h8l-1 5.4 3 3.4H6l3-3.4z"/><path d="M12 13.6v5.6"/>',
  fullscreen: '<path d="M5.5 9.5v-4h4M18.5 9.5v-4h-4M5.5 14.5v4h4M18.5 14.5v4h-4"/>',
  close: '<path d="M6.8 6.8l10.4 10.4M17.2 6.8L6.8 17.2"/>',
  back: '<path d="M14.5 6L8.5 12l6 6"/>',
  more: '<circle cx="6.2" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="17.8" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5.8v12.4M5.8 12h12.4"/>',
  check: '<path d="M5.8 12.4l4 4L18.2 7.8"/>',
  error: '<circle cx="12" cy="12" r="7"/><path d="M12 8.4v5M12 15.4v.2"/>',
  loading: '<path d="M12 5.8a6.2 6.2 0 1 1-4.8 2.3"/><path d="M12 5.8V8.8"/>',
  file: '<path d="M7 5.5h6.8L17 8.7v9.8H7z"/><path d="M13.6 5.5v3.4H17"/>',
  folder: '<path d="M5.5 8.2h4.4l1.5 1.8h7.1v8.5H5.5z"/>',
  online: '<circle cx="12" cy="12" r="6"/><path d="M9.4 12l1.8 1.8 3.4-3.6"/>',
  working: '<circle cx="12" cy="12" r="6"/><path d="M12 9.2V12l2 1.4"/>',
  offline: '<circle cx="12" cy="12" r="6"/><path d="M8.8 8.8l6.4 6.4"/>',
};

export const ICON_NAMES = Object.keys(ICONS);

export function icon(name, size = 24, label = '') {
  const body = ICONS[name];
  if (!body) return '';
  const attrs = label
    ? ` role="img" aria-label="${label}"`
    : ' aria-hidden="true" focusable="false"';
  return `<svg class="icon icon-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="var(--icon-stroke)" stroke-linecap="var(--icon-cap)" stroke-linejoin="var(--icon-join)"${attrs}>${body}</svg>`;
}

// =========================================================================
// FA LOGO SYSTEM (Official Implementation)
// Approved by owner: Squircle-V4-Minimal for every surface.
// - Standalone Mark: outer squircle + inner >_ • bubble + Fa below
// - Wordmark: canonical mark with a horizontal Fa / AGENT MESSENGER lockup
// - App Icon: the identical silhouette, safe on iOS/macOS and Android
// - Favicon: the identical geometry, simplified only by raster size
// =========================================================================


// Vector path for uppercase "F" (geometric, tall, rounded strokes)
const pathF = (x, y, scale = 1, color = 'var(--ink-1)', sw = '3.5') => `
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <path d="M0 28 V0 H16" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="0" y1="12.5" x2="12" y2="12.5" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
  </g>
`;

// Vector path for lowercase "a" with integrated agent-core dot inside its bowl
const pathA = (x, y, scale = 1, dotColor = 'var(--accent)', ringColor = 'var(--ink-1)') => `
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <circle cx="7" cy="11" r="6.5" fill="none" stroke="${ringColor}" stroke-width="3"/>
    <path d="M13.5 4.5 V17.5" fill="none" stroke="${ringColor}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="7" cy="11" r="3.2" fill="${dotColor}"/>
  </g>
`;

// Terminal chevron + underscore vector paths
const pathPrompt = (x, y, scale = 1, color = 'var(--accent)') => `
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <path d="M0 0 L7 6 L0 12" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="10" y1="12" x2="18" y2="12" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>
  </g>
`;

// Canonical owner-approved mark: Squircle-V4-Minimal. The outer shape is an
// iOS/macOS-like squircle; the message bubble owns only >_ • and Fa sits
// below it. Keep every surface on this one geometry instead of growing
// direction-specific logo variants.
function squircleV4(className, direction, size, label) {
  const isGraphite = direction === 'graphite';
  const outerRadius = isGraphite ? 18 : 22;
  const outerFill = direction === 'glass'
    ? 'color-mix(in srgb, var(--accent) 9%, var(--surface-1))'
    : 'var(--surface-1)';
  const bubbleFill = direction === 'glass'
    ? 'color-mix(in srgb, var(--surface-2) 84%, transparent)'
    : 'var(--surface-2)';

  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 84 84" role="img" aria-label="${label}">
    <rect x="4" y="4" width="76" height="76" rx="${outerRadius}" fill="${outerFill}" stroke="var(--hairline)" stroke-width="1.5"/>
    <path d="M20 20 H64 A8 8 0 0 1 72 28 V42 A8 8 0 0 1 64 50 H38 L26 58 V50 H20 A8 8 0 0 1 12 42 V28 A8 8 0 0 1 20 20 Z" fill="${bubbleFill}" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>
    ${pathPrompt(28, 28, 0.86)}
    <circle cx="50" cy="34" r="3.5" fill="var(--agent-2, var(--accent))"/>
    ${pathF(31, 54, 0.55)}
    ${pathA(43, 58, 0.58)}
  </svg>`;
}

export function logoMark(direction, size = 64) {
  return squircleV4('logo-mark', direction, size, 'Fa logo — Squircle V4 Minimal');
}

export function appIcon(direction, size = 64) {
  return squircleV4('logo-app', direction, size, 'Fa app icon — Squircle V4 Minimal');
}

export function favicon(direction, size = 16) {
  return squircleV4('logo-favicon', direction, size, 'Fa favicon — Squircle V4 Minimal');
}

export function wordmark(direction, width = 310) {
  const height = Math.round(width * 0.22);
  return `<svg class="logo-word" width="${width}" height="${height}" viewBox="0 0 310 68" role="img" aria-label="Fa agent messenger — Squircle V4 Minimal">
    <g transform="translate(1,-10) scale(0.78)">
      <rect x="4" y="4" width="76" height="76" rx="22" fill="var(--surface-1)" stroke="var(--hairline)" stroke-width="1.5"/>
      <path d="M20 20 H64 A8 8 0 0 1 72 28 V42 A8 8 0 0 1 64 50 H38 L26 58 V50 H20 A8 8 0 0 1 12 42 V28 A8 8 0 0 1 20 20 Z" fill="var(--surface-2)" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>
      ${pathPrompt(28, 28, 0.86)}
      <circle cx="50" cy="34" r="3.5" fill="var(--agent-2, var(--accent))"/>
      ${pathF(31, 54, 0.55)}
      ${pathA(43, 58, 0.58)}
    </g>
    ${pathF(82, 20, 1.0)}
    ${pathA(105, 28, 1.0)}
    <line x1="139" y1="18" x2="139" y2="50" stroke="var(--hairline)" stroke-width="1.2"/>
    <text x="154" y="39" font-family="var(--font-ui)" font-size="11.5" font-weight="700" letter-spacing="2.2" fill="var(--ink-3)">AGENT MESSENGER</text>
  </svg>`;
}

export const LOGO_NOTES = {
  glass: 'Squircle-V4-Minimal: frosted message bubble, luminous >_ • and the Fa signature below.',
  nebula: 'Squircle-V4-Minimal with an iris agent pulse and the same calm, readable silhouette.',
  graphite: 'Squircle-V4-Minimal with engineered radii and precise terminal geometry.',
  porcelain: 'Squircle-V4-Minimal in a tactile ceramic finish; one friendly, iconic silhouette.',
};
