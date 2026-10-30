import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BACKGROUND_TOKENS,
  BODY_TEXT_TOKENS,
  DIRECTION_IDS,
  DIRECTIONS,
  agentHueKeys,
  buildHash,
  contrastRatio,
  contrastReport,
  parseHash,
} from '../styleguide.js';
import { ICONS, ICON_NAMES, appIcon, favicon, icon, logoMark, wordmark } from '../styleguide_icons.js';

test('three complete visual directions exist', () => {
  assert.equal(DIRECTION_IDS.length, 4);
  for (const id of DIRECTION_IDS) {
    const direction = DIRECTIONS[id];
    assert.ok(direction.name);
    assert.ok(direction.tagline);
    assert.ok(direction.personality.length > 80);
    assert.ok(direction.notCheap.length > 80);
    for (const mode of ['light', 'dark']) {
      for (const key of [...BACKGROUND_TOKENS, ...BODY_TEXT_TOKENS, 'hairline', 'accent', 'accentInk', 'accentSoft', 'success', 'warn', 'danger', 'info']) {
        assert.match(direction.modes[mode][key], /^#[0-9A-F]{6}$/i, `${id}.${mode}.${key}`);
      }
      assert.equal(agentHueKeys().length, 6);
    }
  }
});

test('body text reaches WCAG AA on every surface in both modes', () => {
  for (const id of DIRECTION_IDS) {
    for (const mode of ['light', 'dark']) {
      for (const row of contrastReport(id, mode)) {
        assert.ok(row.pass, `${id} ${mode}: ${row.fg} on ${row.bg} is ${row.ratio.toFixed(2)}:1`);
      }
    }
  }
});

test('accent pairs and functional colours stay readable', () => {
  assert.ok(contrastRatio('#FFFFFF', '#1D6B65') > 4.5);
  assert.ok(contrastRatio('#1B1305', '#F2A93B') > 4.5);
});

test('icon set is hand-drawn inline SVG only', () => {
  assert.ok(ICON_NAMES.length >= 24);
  assert.ok(ICON_NAMES.includes('chat'));
  assert.ok(ICON_NAMES.includes('terminal'));
  assert.ok(ICON_NAMES.includes('invite'));
  const rendered = icon('send', 24, 'Send');
  assert.match(rendered, /^<svg[^>]+viewBox="0 0 24 24"/);
  assert.match(rendered, /stroke="currentColor"/);
  assert.doesNotMatch(Object.values(ICONS).join(''), /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test('each direction has a mark, app icon, favicon and wordmark', () => {
  for (const id of DIRECTION_IDS) {
    for (const svg of [logoMark(id), appIcon(id), favicon(id), wordmark(id)]) {
      assert.match(svg, /<svg/);
      assert.ok(svg.includes('</svg>'));
      assert.doesNotMatch(svg, /<img|href="data:/);
    }
  }
});

test('styleguide links are deep-linkable', () => {
  assert.deepEqual(parseHash('#direction=graphite&mode=dark'), { direction: 'graphite', mode: 'dark', font: null });
  assert.deepEqual(parseHash('#direction=glass&mode=dark&font=geist'), { direction: 'glass', mode: 'dark', font: 'geist' });
  assert.equal(parseHash('#direction=nope').direction, null);
  assert.equal(buildHash('porcelain', 'light'), '#direction=porcelain&mode=light');
});
