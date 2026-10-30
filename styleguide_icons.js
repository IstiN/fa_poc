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
  model: '<rect x="7.2" y="7.2" width="9.6" height="9.6" rx="2"/><path d="M10.2 4.5v2.7M13.8 4.5v2.7M10.2 16.8v2.7M13.8 16.8v2.7M4.5 10.2h2.7M4.5 13.8h2.7M16.8 10.2h2.7M16.8 13.8h2.7"/>',
  attach: '<path d="M12 5.5v13M5.5 12h13"/>',
  send: '<path d="M5 12l14-6.3-3.4 13.1-4.2-4.6z"/><path d="M11.4 14.2L19 5.7"/>',
  mic: '<rect x="9.7" y="5.2" width="4.6" height="8.6" rx="2.3"/><path d="M7 11.6a5 5 0 0 0 10 0M12 16.6v2.2"/>',
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

function svgOpen(size, label, className = '') {
  const attrs = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 64 64"${attrs}>`;
}

export function logoMark(direction, size = 64) {
  // Common DNA across all themes: prompt chevron '>_' merged with neural/messenger loop
  // creating an unmistakable, tech-first cyber mark that directly echoes terminal '>_ Fa'.
  if (direction === 'glass') {
    return `${svgOpen(size, 'Fa logo', 'logo-mark')}
      <path d="M12 20 L24 32 L12 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="28" y1="44" x2="38" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <rect x="26" y="16" width="26" height="22" rx="7" fill="color-mix(in srgb, var(--accent) 18%, transparent)" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="39" cy="27" r="3.5" fill="var(--accent)"/>
    </svg>`;
  }
  if (direction === 'graphite') {
    return `${svgOpen(size, 'Fa logo', 'logo-mark')}
      <path d="M10 20 L22 32 L10 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/>
      <line x1="26" y1="44" x2="36" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
      <rect x="30" y="16" width="24" height="20" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="38" y="22" width="8" height="8" fill="var(--accent)"/>
    </svg>`;
  }
  if (direction === 'porcelain') {
    return `${svgOpen(size, 'Fa logo', 'logo-mark')}
      <path d="M12 20 L24 32 L12 44" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="28" y1="44" x2="40" y2="44" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M28 18 h18 a8 8 0 0 1 8 8 v4 a8 8 0 0 1 -8 8 h-6 l-6 5 v-5 h-6 a8 8 0 0 1 -8 -8 v-4 a8 8 0 0 1 8 -8 z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="41" cy="27" r="3.5" fill="var(--accent)"/>
    </svg>`;
  }
  // Nebula (default)
  return `${svgOpen(size, 'Fa logo', 'logo-mark')}
    <path d="M12 20 L24 32 L12 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="28" y1="44" x2="38" y2="44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="28" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="40" cy="28" r="5" fill="var(--accent)"/>
  </svg>`;
}

export function appIcon(direction, size = 64) {
  const radius = direction === 'graphite' ? 12 : direction === 'porcelain' ? 20 : 16;
  const inner = direction === 'graphite'
    ? '<path d="M16 24 L26 32 L16 40" fill="none" stroke="var(--accent-ink)" stroke-width="3.5" stroke-linecap="square"/><line x1="30" y1="40" x2="40" y2="40" stroke="var(--accent-ink)" stroke-width="3.5"/><rect x="36" y="20" width="12" height="12" fill="var(--accent-ink)"/>'
    : '<path d="M16 23 L27 32 L16 41" fill="none" stroke="var(--accent-ink)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="31" y1="41" x2="41" y2="41" stroke="var(--accent-ink)" stroke-width="3.6" stroke-linecap="round"/><circle cx="39" cy="25" r="4.5" fill="var(--accent-ink)"/>';
  return `${svgOpen(size, 'Fa app icon', 'logo-app')}<rect x="2" y="2" width="60" height="60" rx="${radius}" fill="var(--accent)"/>${inner}</svg>`;
}

export function favicon(direction, size = 16) {
  return `${svgOpen(size, 'Fa favicon', 'logo-favicon')}
    <path d="M8 14 L24 32 L8 50" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="30" y1="50" x2="48" y2="50" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>
    <circle cx="44" cy="22" r="7" fill="var(--accent)"/>
  </svg>`;
}

export function wordmark(direction, width = 280) {
  const height = Math.round(width * 0.22);
  const fontDisplay = direction === 'graphite'
    ? "var(--font-mono)"
    : "var(--font-display)";
  return `<svg class="logo-word" width="${width}" height="${height}" viewBox="0 0 280 60" role="img" aria-label="Fa logo">
    <!-- CLI Prompt: >_ -->
    <path d="M8 20 L20 32 L8 44" fill="none" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="24" y1="44" x2="34" y2="44" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Brand Name: Fa -->
    <text x="44" y="44" font-family="${fontDisplay}" font-size="36" font-weight="700" letter-spacing="-1.2" fill="var(--ink-1)">Fa</text>
    <circle cx="94" cy="42" r="4" fill="var(--accent)"/>
    <!-- Subtitle descriptor -->
    <text x="108" y="40" font-family="var(--font-ui)" font-size="11.5" font-weight="700" letter-spacing="2.8" fill="var(--ink-3)">AGENT MESSENGER</text>
  </svg>`;
}

export const LOGO_NOTES = {
  glass: 'CLI prompt >_ fused with frosted refractive portal; echoes terminal roots with visionOS luxury.',
  nebula: 'CLI prompt >_ paired with orbital core; modern cyber-agent messenger for terminal & desktop.',
  graphite: 'Raw CLI prompt >_ and calibrated target cell; engineered for operators and precision tooling.',
  porcelain: 'Rounded prompt >_ connected to tactile speech bubble; friendly, approachable and instantly iconic.',
};
