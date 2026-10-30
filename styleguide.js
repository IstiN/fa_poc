// Fa 2.0 visual-direction styleguide. Pure data + pure functions are exported for
// tests (node --test tests/styleguide.test.js); DOM wiring only runs in a browser.

export const STORAGE_KEY = 'fa2.styleguide.choice';

const AGENTS = ['agent1', 'agent2', 'agent3', 'agent4', 'agent5', 'agent6'];

export const COLOR_ROLES = [
  ['bg', 'Background', 'App canvas behind everything'],
  ['surface1', 'Surface 1', 'Lists, cards, sheets'],
  ['surface2', 'Surface 2', 'Raised: composer, menus, own bubble'],
  ['surface3', 'Surface 3', 'Pressed / selected / inset fields'],
  ['ink1', 'Ink primary', 'Titles, message text'],
  ['ink2', 'Ink secondary', 'Previews, descriptions'],
  ['ink3', 'Ink tertiary', 'Timestamps, meta, placeholders'],
  ['hairline', 'Hairline', 'Dividers, outlines (decorative)'],
  ['accent', 'Accent', 'Primary action, unread, focus'],
  ['accentInk', 'Accent ink', 'Text and icons on accent'],
  ['accentSoft', 'Accent soft', 'Selected chip, tinted row'],
  ['success', 'Success', 'Approved, done, online'],
  ['warn', 'Warning', 'Needs approval, working'],
  ['danger', 'Danger', 'Deny, delete, failed'],
  ['info', 'Info', 'Links, system notices'],
  ['agent1', 'Agent hue 1', 'Researcher'],
  ['agent2', 'Agent hue 2', 'Release Manager'],
  ['agent3', 'Agent hue 3', 'Code Reviewer'],
  ['agent4', 'Agent hue 4', 'Test Runner'],
  ['agent5', 'Agent hue 5', 'Designer'],
  ['agent6', 'Agent hue 6', 'Ops Sentinel'],
];

// Text tokens that must reach 4.5:1 on every background surface.
export const BODY_TEXT_TOKENS = ['ink1', 'ink2', 'ink3'];
export const BACKGROUND_TOKENS = ['bg', 'surface1', 'surface2', 'surface3'];

export const DIRECTIONS = {
  nebula: {
    id: 'nebula',
    name: 'Nebula',
    tagline: 'Deep space obsidian — calm iris-violet glow, soft layered surfaces, zero eye strain.',
    personality:
      'Engineered specifically for night-time and dark-first focus: deep obsidian canvas (#0B0C10) paired with a muted, luminous iris-violet accent (#9366FF) instead of eye-burning saturated orange. Displays set in Space Grotesk, UI in Inter, data in JetBrains Mono. Soft atmospheric surfaces with razor 1px borders, smooth pill chips, and calibrated low-fatigue agent hues. Creative and modern without screaming.',
    notCheap:
      'Avoiding harsh neon saturation: every accent and state color is softened to prevent eye strain during long sessions while maintaining strict WCAG AA contrast (all text >= 5:1). Dark surfaces layer naturally without blurry glows.',
    fonts: {
      display: { family: 'Space Grotesk', css: "'Space Grotesk', system-ui, sans-serif", flutter: 'GoogleFonts.spaceGrotesk()' },
      ui: { family: 'Inter', css: "'Inter', system-ui, sans-serif", flutter: 'GoogleFonts.inter()' },
      mono: { family: 'JetBrains Mono', css: "'JetBrains Mono', ui-monospace, monospace", flutter: 'GoogleFonts.jetBrainsMono()' },
    },
    type: [
      ['Display', 'display', 42, 46, 700, -0.03, 'Release 2.6.0 is ready'],
      ['Title', 'display', 26, 32, 600, -0.02, '#release-260-audit'],
      ['Headline', 'ui', 18, 24, 600, -0.01, 'Release Manager'],
      ['Body', 'ui', 15, 22, 400, 0, 'I compared the changelog with merged PRs; two items are missing notes.'],
      ['Label', 'ui', 13, 18, 600, 0.01, 'Approve · Deny · Open board'],
      ['Caption', 'ui', 12, 16, 500, 0.01, 'My Network · 2 min ago'],
      ['Mono', 'mono', 13, 20, 400, 0, 'fa agent join --channel release-260-audit'],
    ],
    radius: [['xs', 4], ['sm', 8], ['md', 12], ['lg', 16], ['xl', 22], ['pill', 999]],
    icon: { stroke: 1.5, cap: 'round', join: 'round', note: '1.5 px, clean rounded geometric lines with soft terminals.' },
    motion: {
      personality: 'Smooth and effortless. Atmospheric transitions with gentle deceleration.',
      fast: [140, 'cubic-bezier(0.2, 0.9, 0.3, 1)', 'Curves.easeOutCubic'],
      base: [220, 'cubic-bezier(0.2, 0.9, 0.3, 1)', 'Curves.easeOutCubic'],
      emph: [320, 'cubic-bezier(0.25, 1, 0.4, 1)', 'Curves.fastOutSlowIn'],
      spring: [280, 'cubic-bezier(0.2, 1.1, 0.4, 1)', 'SpringDescription(mass: 1, stiffness: 450, damping: 30)'],
    },
    elevation: 'Obsidian depth hierarchy (#0B -> #11 -> #18) with subtle 1px luminous hairline borders and soft ambient depth.',
    modes: {
      dark: {
        bg: '#0B0C10', surface1: '#11131A', surface2: '#181B24', surface3: '#1E212D',
        ink1: '#F0F2F8', ink2: '#9BA3B8', ink3: '#8892A8', hairline: '#242838',
        accent: '#9366FF', accentInk: '#0B0C10', accentSoft: '#241B42',
        success: '#10B981', warn: '#F59E0B', danger: '#EF4444', info: '#60A5FA',
        agent1: '#9366FF', agent2: '#38BDF8', agent3: '#34D399', agent4: '#F472B6', agent5: '#FBBF24', agent6: '#A78BFA',
      },
      light: {
        bg: '#F4F5F9', surface1: '#FFFFFF', surface2: '#EAEBF2', surface3: '#DFE1EC',
        ink1: '#0C0E14', ink2: '#474D5E', ink3: '#5C6377', hairline: '#D1D5E4',
        accent: '#6D28D9', accentInk: '#FFFFFF', accentSoft: '#EDE9FE',
        success: '#047857', warn: '#B45309', danger: '#B91C1C', info: '#1D4ED8',
        agent1: '#6D28D9', agent2: '#0284C7', agent3: '#059669', agent4: '#DB2777', agent5: '#D97706', agent6: '#7C3AED',
      },
    },
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite',
    tagline: 'A precision instrument — dark-first, hairline-exact, one sodium-amber signal.',
    personality:
      'Built like a measuring instrument: graphite surfaces stepped in exact 4 % increments, 1 px hairlines, IBM Plex Sans for UI and IBM Plex Mono with tabular figures for every number, time and token count. The only colour that is not grey is the amber signal — it means "your attention is needed". Fits operators and engineers who run many agents in parallel, read logs, and approve tool calls quickly.',
    notCheap:
      'Cheap dark UIs are pure black with neon. Graphite is a tuned warm-neutral charcoal ramp, tabular numerals that never jitter, aligned 4-pt baselines, and a single signal colour with a strict meaning. Precision is the luxury.',
    fonts: {
      display: { family: 'IBM Plex Sans', css: "'IBM Plex Sans', system-ui, sans-serif", flutter: 'GoogleFonts.ibmPlexSans()' },
      ui: { family: 'IBM Plex Sans', css: "'IBM Plex Sans', system-ui, sans-serif", flutter: 'GoogleFonts.ibmPlexSans()' },
      mono: { family: 'IBM Plex Mono', css: "'IBM Plex Mono', ui-monospace, monospace", flutter: 'GoogleFonts.ibmPlexMono()' },
    },
    type: [
      ['Display', 'display', 40, 44, 500, -0.025, 'Release 2.6.0 is ready'],
      ['Title', 'display', 24, 30, 500, -0.015, '#release-260-audit'],
      ['Headline', 'ui', 17, 24, 600, -0.005, 'Release Manager'],
      ['Body', 'ui', 15, 22, 400, 0, 'I compared the changelog with merged PRs; two items are missing notes.'],
      ['Label', 'ui', 13, 18, 500, 0.01, 'Approve · Deny · Open board'],
      ['Caption', 'mono', 11.5, 16, 400, 0.02, 'MY NETWORK · 14:02:31'],
      ['Mono', 'mono', 13, 20, 400, 0, 'fa agent join --channel release-260-audit'],
    ],
    radius: [['xs', 2], ['sm', 4], ['md', 6], ['lg', 8], ['xl', 12], ['pill', 999]],
    icon: { stroke: 1.25, cap: 'square', join: 'miter', note: '1.25 px, square caps, mitred joins — drafted, not drawn.' },
    motion: {
      personality: 'Crisp and precise. Fast in, no overshoot, motion only where state changes.',
      fast: [100, 'cubic-bezier(0.2, 0, 0, 1)', 'Easing.standard (M3)'],
      base: [160, 'cubic-bezier(0.2, 0, 0, 1)', 'Easing.standard (M3)'],
      emph: [240, 'cubic-bezier(0.3, 0, 0, 1)', 'Easing.emphasizedDecelerate (M3)'],
      spring: [200, 'cubic-bezier(0.25, 1, 0.5, 1)', 'SpringDescription(mass: 1, stiffness: 700, damping: 53) · no overshoot'],
    },
    elevation: 'No shadows in dark mode: elevation is a lighter surface step plus a top hairline highlight. Light mode adds one 1 px ambient shadow.',
    modes: {
      dark: {
        bg: '#0E0F11', surface1: '#151619', surface2: '#1C1E22', surface3: '#25282D',
        ink1: '#E9EBEE', ink2: '#A8AEB7', ink3: '#8B929C', hairline: '#2B2F35',
        accent: '#F2A93B', accentInk: '#1B1305', accentSoft: '#2E2414',
        success: '#5FC28E', warn: '#FF8F5A', danger: '#FF6F6A', info: '#86B6F0',
        agent1: '#86B6F0', agent2: '#F2A93B', agent3: '#5FC28E', agent4: '#D79AC0', agent5: '#6FCFC6', agent6: '#C9B37A',
      },
      light: {
        bg: '#F2F3F5', surface1: '#FAFAFB', surface2: '#FFFFFF', surface3: '#E5E7EB',
        ink1: '#0F1114', ink2: '#454A52', ink3: '#5A6069', hairline: '#D4D7DC',
        accent: '#9A5A00', accentInk: '#FFFFFF', accentSoft: '#F6E6CC',
        success: '#1E7046', warn: '#A2470F', danger: '#B22A25', info: '#255C9E',
        agent1: '#2F64A6', agent2: '#9A5A00', agent3: '#1E7046', agent4: '#9A4677', agent5: '#18777A', agent6: '#6E5E2B',
      },
    },
  },
  porcelain: {
    id: 'porcelain',
    name: 'Porcelain',
    tagline: 'Soft tactile — calm cool neutrals, layered tinted surfaces, springy touch.',
    personality:
      'Cool porcelain neutrals with a deep lagoon-teal accent. Depth comes from stacked tinted surfaces and generous continuous radii rather than shadows; touch responds with small springs, like pressing glazed ceramic. Manrope gives a friendly but disciplined UI voice, DM Mono handles data. Fits a mass-market messenger: people who live with a few endless agents on their phone every day.',
    notCheap:
      'It avoids the glassmorphism trap: no blur-everything, no gradients. Quality comes from a tuned cool ramp where every surface is slightly tinted toward the accent, consistent 8-pt radii steps, and motion physics that feel native on iOS and Android.',
    fonts: {
      display: { family: 'Manrope', css: "'Manrope', system-ui, sans-serif", flutter: 'GoogleFonts.manrope()' },
      ui: { family: 'Manrope', css: "'Manrope', system-ui, sans-serif", flutter: 'GoogleFonts.manrope()' },
      mono: { family: 'DM Mono', css: "'DM Mono', ui-monospace, monospace", flutter: 'GoogleFonts.dmMono()' },
    },
    type: [
      ['Display', 'display', 42, 48, 700, -0.03, 'Release 2.6.0 is ready'],
      ['Title', 'display', 26, 32, 700, -0.02, '#release-260-audit'],
      ['Headline', 'ui', 18, 24, 600, -0.01, 'Release Manager'],
      ['Body', 'ui', 16, 24, 500, -0.005, 'I compared the changelog with merged PRs; two items are missing notes.'],
      ['Label', 'ui', 14, 20, 600, 0, 'Approve · Deny · Open board'],
      ['Caption', 'ui', 12.5, 16, 500, 0.005, 'My Network · 2 min ago'],
      ['Mono', 'mono', 13, 20, 400, 0, 'fa agent join --channel release-260-audit'],
    ],
    radius: [['xs', 6], ['sm', 10], ['md', 14], ['lg', 20], ['xl', 28], ['pill', 999]],
    icon: { stroke: 1.75, cap: 'round', join: 'round', note: '1.75 px, rounded caps and joins — soft and legible at 16 px.' },
    motion: {
      personality: 'Springy and physical. Elements are thrown and caught; a little overshoot on presentation, none on dismissal.',
      fast: [180, 'cubic-bezier(0.34, 1.36, 0.64, 1)', 'SpringDescription(mass: 1, stiffness: 520, damping: 30)'],
      base: [320, 'cubic-bezier(0.34, 1.3, 0.64, 1)', 'SpringDescription(mass: 1, stiffness: 380, damping: 26)'],
      emph: [460, 'cubic-bezier(0.2, 0, 0, 1)', 'Curves.easeInOutCubicEmphasized'],
      spring: [520, 'cubic-bezier(0.3, 1.45, 0.55, 1)', 'SpringDescription(mass: 1, stiffness: 260, damping: 20) · slight overshoot'],
    },
    elevation: 'Depth by layering: canvas → tinted tray → white card. One soft, large, low-opacity shadow only on floating sheets and toasts.',
    modes: {
      light: {
        bg: '#ECEFF2', surface1: '#F6F8FA', surface2: '#FFFFFF', surface3: '#E1E6EB',
        ink1: '#12171C', ink2: '#46505B', ink3: '#5A6571', hairline: '#D5DCE3',
        accent: '#1D6B65', accentInk: '#FFFFFF', accentSoft: '#D3E7E4',
        success: '#2A7A4C', warn: '#8C5C00', danger: '#B3261E', info: '#2B5F9C',
        agent1: '#3B78AD', agent2: '#B9662F', agent3: '#3E8C5D', agent4: '#8E62A6', agent5: '#B8546F', agent6: '#2F8890',
      },
      dark: {
        bg: '#0F1317', surface1: '#161B20', surface2: '#1D2329', surface3: '#262E35',
        ink1: '#E9EEF2', ink2: '#AEB8C2', ink3: '#909BA6', hairline: '#2C353D',
        accent: '#72C6BB', accentInk: '#062420', accentSoft: '#173431',
        success: '#78C99A', warn: '#E4B866', danger: '#F2928A', info: '#8DB8EC',
        agent1: '#83B4E2', agent2: '#E59E6E', agent3: '#7FC99B', agent4: '#C2A0D9', agent5: '#E795AA', agent6: '#73C4CB',
      },
    },
  },
  glass: {
    id: 'glass',
    name: 'Liquid Glass',
    tagline: 'Apple-inspired liquid glass — frosted acrylic surfaces, refraction borders, luminous cyan aura.',
    personality:
      'The modern Apple visionOS / iOS aesthetic reimagined for an AI messenger: translucent frosted glass panels (backdrop-filter: blur(24px) saturate(1.8)), specular edge highlights, fluid spring physics, and a luminous oceanic cyan accent (#38BDF8). Light and color gently refract through conversation layers. SF-style typography with SF Pro / Inter display, Plus Jakarta Sans for UI, and DM Mono. High-tech, fluid and breathtakingly tactile without being blurry or illegible.',
    notCheap:
      'Not 2015-style flat blur soup: depth is achieved through layered acrylic refractive indices, crisp 1px specular gradient hairlines, and strict dark-mode contrast where every piece of text is guaranteed 5+:1 contrast against frosted glass.',
    fonts: {
      display: { family: 'Plus Jakarta Sans', css: "'Plus Jakarta Sans', system-ui, sans-serif", flutter: 'GoogleFonts.plusJakartaSans()' },
      ui: { family: 'Plus Jakarta Sans', css: "'Plus Jakarta Sans', system-ui, sans-serif", flutter: 'GoogleFonts.plusJakartaSans()' },
      mono: { family: 'DM Mono', css: "'DM Mono', ui-monospace, monospace", flutter: 'GoogleFonts.dmMono()' },
    },
    type: [
      ['Display', 'display', 42, 48, 700, -0.03, 'Release 2.6.0 is ready'],
      ['Title', 'display', 26, 32, 600, -0.02, '#release-260-audit'],
      ['Headline', 'ui', 18, 24, 600, -0.01, 'Release Manager'],
      ['Body', 'ui', 15, 23, 400, 0, 'I compared the changelog with merged PRs; two items are missing notes.'],
      ['Label', 'ui', 13.5, 19, 600, 0.005, 'Approve · Deny · Open board'],
      ['Caption', 'ui', 12, 16, 500, 0.01, 'My Network · 2 min ago'],
      ['Mono', 'mono', 13, 20, 400, 0, 'fa agent join --channel release-260-audit'],
    ],
    radius: [['xs', 6], ['sm', 10], ['md', 16], ['lg', 22], ['xl', 30], ['pill', 999]],
    icon: { stroke: 1.5, cap: 'round', join: 'round', note: '1.5 px, fluid rounded contours with smooth continuous curves.' },
    motion: {
      personality: 'Liquid and buoyant. Spring dynamics with subtle fluid inertia and glass refraction ripples.',
      fast: [160, 'cubic-bezier(0.2, 1.2, 0.4, 1)', 'SpringDescription(mass: 1, stiffness: 500, damping: 28)'],
      base: [260, 'cubic-bezier(0.2, 1.15, 0.4, 1)', 'SpringDescription(mass: 1, stiffness: 380, damping: 26)'],
      emph: [400, 'cubic-bezier(0.18, 1, 0.32, 1)', 'Curves.easeOutQuart'],
      spring: [340, 'cubic-bezier(0.2, 1.25, 0.4, 1)', 'SpringDescription(mass: 1, stiffness: 320, damping: 22) · fluid rebound'],
    },
    elevation: 'Translucent acrylic layering with backdrop blur, specular top-edge highlights (inset 0 1px 0 rgba(255,255,255,0.12)), and deep ambient refraction.',
    modes: {
      dark: {
        bg: '#080A10', surface1: '#0F1320', surface2: '#161B2C', surface3: '#1E243A',
        ink1: '#F0F4FC', ink2: '#9FB0D0', ink3: '#889ABE', hairline: '#222D46',
        accent: '#38BDF8', accentInk: '#080A10', accentSoft: '#14263C',
        success: '#34D399', warn: '#FBBF24', danger: '#F87171', info: '#60A5FA',
        agent1: '#38BDF8', agent2: '#818CF8', agent3: '#34D399', agent4: '#F472B6', agent5: '#FBBF24', agent6: '#2DD4BF',
      },
      light: {
        bg: '#F0F4F8', surface1: '#FFFFFF', surface2: '#E5ECF4', surface3: '#D6E0EC',
        ink1: '#0B1322', ink2: '#3E4C66', ink3: '#505F7D', hairline: '#C4D2E4',
        accent: '#0277BD', accentInk: '#FFFFFF', accentSoft: '#E1F1FB',
        success: '#027A48', warn: '#B54708', danger: '#C42129', info: '#0E64B8',
        agent1: '#0277BD', agent2: '#4F46E5', agent3: '#027A48', agent4: '#DB2777', agent5: '#B54708', agent6: '#0D9488',
      },
    },
  },
};
export const DIRECTION_IDS = Object.keys(DIRECTIONS);

// ---------- colour math (WCAG 2.x) ----------
export function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastReport(directionId, mode) {
  const tokens = DIRECTIONS[directionId].modes[mode];
  const rows = [];
  for (const fg of BODY_TEXT_TOKENS) {
    for (const bg of BACKGROUND_TOKENS) {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      rows.push({ fg, bg, ratio, pass: ratio >= 4.5, kind: 'text' });
    }
  }
  rows.push({ fg: 'accentInk', bg: 'accent', ratio: contrastRatio(tokens.accentInk, tokens.accent), kind: 'text' });
  for (const fg of ['accent', 'success', 'warn', 'danger', 'info']) {
    rows.push({ fg, bg: 'surface1', ratio: contrastRatio(tokens[fg], tokens.surface1), kind: 'text' });
  }
  for (const row of rows) row.pass = row.ratio >= 4.5;
  return rows;
}

export function cssVariablesFor(directionId, mode) {
  const tokens = DIRECTIONS[directionId].modes[mode];
  return Object.entries(tokens).map(([key, value]) => `--${kebab(key)}: ${value};`);
}

export function kebab(key) {
  return key.replace(/([a-z])([0-9A-Z])/g, '$1-$2').toLowerCase();
}

export function parseHash(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const direction = DIRECTION_IDS.includes(params.get('direction')) ? params.get('direction') : null;
  const modeParam = params.get('mode');
  const mode = modeParam === 'dark' || modeParam === 'light' ? modeParam : null;
  return { direction, mode };
}

export function buildHash(direction, mode) {
  return `#direction=${direction}&mode=${mode}`;
}

export function agentHueKeys() {
  return AGENTS.slice();
}
