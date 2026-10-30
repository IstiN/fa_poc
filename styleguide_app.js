// Fa 2.0 styleguide — page rendering and interaction. DOM-only module; the
// token/colour math it imports stays pure and unit-testable in Node.

import {
  DIRECTIONS,
  DIRECTION_IDS,
  COLOR_ROLES,
  contrastReport,
  parseHash,
  buildHash,
  STORAGE_KEY,
  FONT_PRESETS,
  FONT_PRESET_IDS,
} from './styleguide.js';
import {
  icon,
  ICON_NAMES,
  logoMark,
  appIcon,
  favicon,
  wordmark,
  LOGO_NOTES,
} from './styleguide_icons.js';

const FONT_STORAGE_KEY = 'fa2.styleguide.font';
const state = { direction: 'porcelain', mode: 'dark', font: 'system', chosen: null };
const roleNames = Object.fromEntries(COLOR_ROLES.map(([key, name]) => [key, name]));
const agentKeys = ['agent1', 'agent2', 'agent3', 'agent4', 'agent5', 'agent6'];
const compareRows = {
  glass: {
    accent: 'Luminous oceanic cyan with glass refraction',
    type: 'Plus Jakarta Sans + DM Mono',
    motion: 'Fluid, buoyant, spring-glass ripples',
    bestFor: 'Apple-ecosystem lovers, visionOS aesthetic, tactile luxury',
    risk: 'Backdrop blur requires hardware acceleration (easily handled in Flutter via BackdropFilter)',
  },
  nebula: {
    accent: 'Luminous iris-violet on obsidian',
    type: 'Space Grotesk + Inter',
    motion: 'Smooth, atmospheric, zero drag',
    bestFor: 'Night-time focus, deep work, creative agents without eye strain',
    risk: 'Violet accent is distinctive — lovers of traditional blue/amber may take a moment to adapt',
  },
  graphite: {
    accent: 'One sodium-amber signal',
    type: 'IBM Plex Sans + Plex Mono',
    motion: 'Crisp, fast, zero overshoot',
    bestFor: 'Operators running many agents and approvals',
    risk: 'Least decorative — needs perfect spacing to feel premium',
  },
  porcelain: {
    accent: 'Deep lagoon teal',
    type: 'Manrope + DM Mono',
    motion: 'Springy, physical, native feel',
    bestFor: 'Daily consumer messenger on phone',
    risk: 'Springs need restraint or the UI feels toy-like',
  },
};

const token = (key) => DIRECTIONS[state.direction].modes[state.mode][key];
const cssVar = (key) => `var(--${key.replace(/([a-z])([0-9A-Z])/g, '$1-$2').toLowerCase()})`;
const motionSpec = (key) => {
  const [dur, curve, flutter] = DIRECTIONS[state.direction].motion[key];
  return `${dur} ms · ${curve} · Flutter: ${flutter}`;
};
const note = (text) => `<p class="sg-note">${text}</p>`;

function setSection(name, html) {
  const node = document.querySelector(`[data-section="${name}"]`);
  if (node) node.innerHTML = html;
}

function swatch(key) {
  const value = token(key);
  const darkText = ['ink1', 'ink2', 'ink3'].includes(key);
  return `<div class="swatch">
    <span class="swatch__chip" style="background:${value};${darkText ? `border-color:${token('hairline')}` : ''}"></span>
    <b>${roleNames[key] || key}</b><code>${cssVar(key)}</code><small>${value}</small>
  </div>`;
}

function miniMessenger() {
  return `<div class="mini" aria-hidden="true">
    <div class="mini__head">
      ${logoMark(state.direction, 26)}
      <span class="mini__title">Chats</span>
      <span class="mini__spacer"></span>
      ${icon('search', 18, 'Search')}
      ${icon('compose', 18, 'New chat')}
    </div>
    <div class="mini__chips"><span class="chip is-selected">All</span><span class="chip">Unread</span><span class="chip">Agents</span></div>
    <div class="mini__list">
      <div class="chat-row"><span class="avatar" style="--hue:${token('agent1')}"><b>R</b><i class="is-working"></i></span><span class="chat-row__body"><b>Researcher<time>14:02</time></b><small>Compared changelog with merged PRs</small></span><span class="badge">2</span></div>
      <div class="chat-row"><span class="avatar" style="--hue:${token('agent2')}"><b>RM</b><i class="is-online"></i></span><span class="chat-row__body"><b>Release Manager<time>13:58</time></b><small>Release 2.6.0 is ready for approval</small></span></div>
      <div class="chat-row"><span class="avatar avatar--group"><span style="--hue:${token('agent3')}">C</span><span style="--hue:${token('agent4')}">T</span></span><span class="chat-row__body"><b>#release-260-audit<time>13:41</time></b><small>Code Reviewer finished the audit</small></span></div>
    </div>
    <div class="mini__thread">
      <div class="bubble bubble--agent"><b>Researcher</b><p>Two changelog items are missing notes.</p></div>
      <div class="bubble bubble--own"><p>Open a task channel and fix them.</p><time>14:03</time></div>
      <div class="bubble bubble--system">Researcher created #release-260-audit · 4 agents</div>
    </div>
    <div class="mini__composer">${icon('attach', 18, 'Attach')}<span>Message Researcher</span><span class="spacer"></span>${icon('send', 18, 'Send')}</div>
  </div>`;
}

function renderHero() {
  const d = DIRECTIONS[state.direction];
  return `<div class="sg-hero__copy">
    <div class="sg-hero__brand" style="margin-bottom: 20px;">${wordmark(state.direction, 240)}</div>
    <p class="sg-hero__eyebrow"><span class="dot"></span>Direction ${DIRECTION_IDS.indexOf(state.direction) + 1} of ${DIRECTION_IDS.length} · ${state.mode} mode</p>
    <h1>${d.name}</h1>
    <p class="sg-hero__tag">${d.tagline}</p>
    <p>${d.personality}</p>
    <p class="sg-hero__why"><b>Why it does not look cheap.</b> ${d.notCheap}</p>
  </div>
  <div class="sg-stage"><div class="device"><div class="device__screen">
    <div class="device__status"><span>14:02</span><span>Fa</span><span>86%</span></div>
    ${miniMessenger()}
  </div></div></div>`;
}

function renderPalette() {
  const d = DIRECTIONS[state.direction];
  const main = COLOR_ROLES.filter(([key]) => !key.startsWith('agent')).map(([key]) => swatch(key)).join('');
  const agents = agentKeys.map((key) => swatch(key)).join('');
  const report = contrastReport(state.direction, state.mode);
  const failed = report.filter((row) => !row.pass);
  const worst = report.reduce((min, row) => (row.ratio < min.ratio ? row : min), report[0]);
  const rows = report.map((row) => `<tr${row.pass ? '' : ' class="is-bad"'}><td>${roleNames[row.fg]}</td><td>${roleNames[row.bg]}</td><td class="tnum">${row.ratio.toFixed(2)}:1</td><td>${row.pass ? 'Pass' : 'Below 4.5'}</td></tr>`).join('');
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">01</span>Palette</h2>
    <p class="sg-lede">${d.name} uses meaning-bound colour: neutral surfaces for reading, one accent for attention, six stable identity hues for agents.</p></header>
    <div class="sg-grid sg-grid--4 palette-grid">${main}</div>
    <h3 class="sg-h3">Agent identity hues</h3><p class="sg-note">Each endless agent keeps its hue forever, across chats, channels and boards.</p>
    <div class="sg-grid sg-grid--4 palette-grid">${agents}</div>
    <h3 class="sg-h3">Text contrast (WCAG 2.x, computed live)</h3>
    <p class="sg-note">${report.length} checks · ${report.length - failed.length} pass · lowest ${worst.ratio.toFixed(2)}:1 (${roleNames[worst.fg]} on ${roleNames[worst.bg]}).</p>
    <div class="table-wrap"><table class="sg-table"><thead><tr><th>Text</th><th>Background</th><th>Ratio</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderType() {
  const d = DIRECTIONS[state.direction];
  const activeF = FONT_PRESETS[state.font] || FONT_PRESETS.system;
  const rows = d.type.map(([name, family, size, line, weight, tracking, sample]) => `<div class="type-row type-${family}">
    <div class="type-row__meta"><b>${name}</b><span>${activeF.name} · ${size}/${line} · ${weight}</span><span>${tracking} em tracking</span></div>
    <p>${sample}</p>
  </div>`).join('');
  
  const fontCards = FONT_PRESET_IDS.map((fid) => {
    const f = FONT_PRESETS[fid];
    const isAct = fid === state.font;
    return `<div class="sg-card ${isAct ? 'sg-card--active-font' : ''}" style="${isAct ? 'border-color:var(--accent); background:var(--surface-2);' : ''}">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <h4 style="margin:0;">${f.name}</h4>
        <button type="button" class="btn btn--secondary" data-font-button="${fid}" style="min-height:28px; padding:0 10px; font-size:11.5px;${isAct ? 'background:var(--accent); color:var(--accent-ink);' : ''}">${isAct ? 'Active' : 'Apply'}</button>
      </div>
      <p style="font-size:12.5px; color:var(--ink-2); margin:0 0 8px;">${f.note}</p>
      <p class="sg-flutter" style="margin:0;"><b>Flutter:</b> ${f.flutter}</p>
    </div>`;
  }).join('');

  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">02</span>Typography &amp; Font Switcher</h2>
    <p class="sg-lede">Переключай шрифт прямо в шапке (Apple SF, Geist, Jakarta, Inter, Outfit) или по кнопкам ниже — весь интерфейс мгновенно перестраивается с сохранением выверенного кернинга и контраста.</p></header>
    <div class="sg-grid sg-grid--2 sg-mb">${fontCards}</div>
    <h3 class="sg-h3">Шкалы размеров (активный: ${activeF.name})</h3>
    ${rows}
    ${note('Все шрифты протестированы на читаемость в ночных и светлых темах, на мелких кеглях 12-14px и в таймстампах.')}`;
}

function renderShape() {
  const d = DIRECTIONS[state.direction];
  const radii = d.radius.map(([name, value]) => `<div class="shape-cell"><span style="border-radius:${value === 999 ? 999 : value}px">${value === 999 ? 'pill' : value}</span><b>${name}</b></div>`).join('');
  const spaces = [4, 8, 12, 16, 24, 32, 40, 48].map((value) => `<div class="space-cell"><span style="width:${value * 3}px"></span><b>${value}</b></div>`).join('');
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">03</span>Shape, spacing, elevation</h2>
    <p class="sg-lede">${d.elevation}</p></header>
    <div class="sg-grid sg-grid--2"><div class="sg-card"><h4>Radius</h4><div class="shape-grid">${radii}</div></div>
    <div class="sg-card"><h4>4-pt spacing</h4><div class="space-grid">${spaces}</div></div></div>
    <div class="sg-card sg-mt"><h4>Surface layers</h4><div class="layer-stack"><span class="layer l1">Canvas</span><span class="layer l2">Tray / list</span><span class="layer l3">Card / composer</span><span class="layer l4">Sheet / toast</span></div></div>`;
}

function renderIcons() {
  const d = DIRECTIONS[state.direction];
  const grid = ICON_NAMES.map((name) => `<div class="icon-cell">${icon(name, 24)}<span>${name}</span></div>`).join('');
  const sizes = ['compose', 'search', 'apps', 'send'].map((name) => `<div class="icon-size">${[16, 20, 24].map((size) => `<span>${icon(name, size)}<small>${size}</small></span>`).join('')}</div>`).join('');
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">04</span>Iconography &amp; logo</h2>
    <p class="sg-lede">Every icon is hand-drawn inline SVG on a 24 grid. ${d.icon.note}</p></header>
    <div class="sg-grid sg-grid--2"><div class="sg-card"><h4>Logo system</h4><div class="logo-row">${wordmark(d.id)}</div>
      <div class="logo-row">${logoMark(d.id, 56)}${appIcon(d.id, 56)}${favicon(d.id, 16)}<div><b>Mark · app icon · favicon</b><p>${LOGO_NOTES[d.id]}</p></div></div></div>
    <div class="sg-card"><h4>Sizes &amp; states</h4>${sizes}<div class="icon-states"><span class="is-normal">${icon('agent', 24)} normal</span><span class="is-hover">${icon('agent', 24)} hover</span><span class="is-active">${icon('agent', 24)} selected</span><span class="is-disabled">${icon('agent', 24)} disabled</span></div></div></div>
    <div class="sg-card sg-mt"><h4>Full set · ${ICON_NAMES.length} icons</h4><div class="icon-grid">${grid}</div></div>`;
}

function renderComponents() {
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">05</span>Components</h2>
    <p class="sg-lede">The product surface in the active direction. Every control shows its resting, hover, pressed, focus, disabled and busy states.</p></header>
  <div class="sg-grid sg-grid--2">
    <div class="sg-card"><h4>Buttons</h4><div class="sg-row"><button class="btn btn--primary">Approve invite</button><button class="btn btn--secondary">Open board</button><button class="btn btn--ghost">Details</button><button class="btn btn--danger">Deny</button></div>
      <div class="sg-row sg-mt"><span class="sg-state"><button class="btn btn--primary is-hover">Hover</button><small>hover</small></span><span class="sg-state"><button class="btn btn--primary is-pressed">Pressed</button><small>pressed</small></span><span class="sg-state"><button class="btn btn--primary is-focus">Focus</button><small>focus</small></span><span class="sg-state"><button class="btn btn--primary" disabled>Disabled</button><small>disabled</small></span><span class="sg-state"><button class="btn btn--primary is-loading"><span class="spinner"></span>Working</button><small>loading</small></span></div>
      <div class="sg-row sg-mt"><button class="icon-btn">${icon('search', 20, 'Search')}</button><button class="icon-btn">${icon('compose', 20, 'New')}</button><button class="icon-btn">${icon('pin', 20, 'Pin')}</button><button class="icon-btn">${icon('fullscreen', 20, 'Fullscreen')}</button></div></div>
    <div class="sg-card"><h4>Selection</h4><div class="sg-row"><button class="chip">All</button><button class="chip is-selected">Unread</button><button class="chip">Agents</button><button class="chip">Channels</button><button class="chip" disabled>Archived</button></div>
      <div class="sg-mt"><div class="seg" role="radiogroup" aria-label="Example range"><button type="button">My Network</button><button type="button" aria-checked="true">All networks</button></div></div>
      <div class="sg-row sg-mt"><label class="switch"><input type="checkbox" checked><span></span>Working dot</label><label class="check"><input type="checkbox" checked><span></span>Task channel</label><label class="check"><input type="checkbox"><span></span>Auto-archive</label></div></div>
    <div class="sg-card"><h4>Fields</h4><label class="field"><span>Search</span><div class="input">${icon('search', 18)}<input placeholder="Search agents, channels, apps"></div></label>
      <label class="field sg-mt"><span>Task</span><div class="input"><input value="Release 2.6.0 audit"></div></label>
      <label class="field is-error sg-mt"><span>Invite code</span><div class="input"><input value="fa join 12"><small>Invite expired 4 minutes ago.</small></div></label></div>
    <div class="sg-card"><h4>Avatars &amp; Groups (Un-squished)</h4>
      <div class="sg-row">
        <span class="avatar" style="--hue:${token('agent1')}"><b>R</b><i class="is-online"></i></span>
        <span class="avatar" style="--hue:${token('agent2')}"><b>RM</b><i class="is-working"></i></span>
        <span class="avatar" style="--hue:${token('agent3')}"><b>C</b><i class="is-offline"></i></span>
        <!-- Spacious group avatar stack: circles never overlap letters -->
        <span class="avatar avatar--group" title="3 agents">
          <span style="--hue:${token('agent4')}">T</span>
          <span style="--hue:${token('agent5')}">D</span>
          <span style="--hue:${token('agent6')}">O</span>
        </span>
        <span class="badge">12</span>
        <span class="badge badge--quiet">3</span>
        <span class="tag">client-acme</span>
        <span class="tag tag--task">task</span>
      </div>
      <div class="sg-row sg-mt">
        <div class="phase-row">
          <span class="phase-badge is-thinking"><i></i> thinking...</span>
          <span class="phase-badge is-tool"><i></i> exec bash</span>
          <span class="phase-badge is-done"><i></i> completed</span>
          <span class="phase-badge is-failed"><i></i> 429 quota</span>
        </div>
      </div>
    </div>

    <div class="sg-card"><h4>Dropdowns &amp; Selectors</h4>
      <div class="sg-row" style="align-items:flex-start;">
        <!-- Model Selector Dropdown -->
        <div class="dropdown-demo">
          <div class="dropdown-trigger">${icon('model', 18)} <span>Kimi K2.6 (JoinGonka)</span> ${icon('back', 14, '', 'style="transform:rotate(-90deg); margin-left:auto;"')}</div>
          <div class="dropdown-menu-mock">
            <button type="button" class="dropdown-item is-selected">${icon('check', 16)} Kimi K2.6 (JoinGonka)</button>
            <button type="button" class="dropdown-item">${icon('model', 16)} Claude 3.5 Sonnet</button>
            <button type="button" class="dropdown-item">${icon('model', 16)} GPT-4o (OpenAI)</button>
          </div>
        </div>
        <!-- Channel Context Dropdown -->
        <div class="dropdown-demo">
          <div class="dropdown-trigger">${icon('channel', 18)} <span>#release-260-audit</span> ${icon('back', 14, '', 'style="transform:rotate(-90deg); margin-left:auto;"')}</div>
          <div class="dropdown-menu-mock">
            <button type="button" class="dropdown-item is-selected">${icon('check', 16)} #release-260-audit</button>
            <button type="button" class="dropdown-item">${icon('channel', 16)} #general</button>
            <button type="button" class="dropdown-item">${icon('network', 16)} istin-network</button>
          </div>
        </div>
      </div>
    </div>
    <div class="sg-card"><h4>Chat rows</h4><div class="chat-list"><div class="chat-row"><span class="avatar" style="--hue:${token('agent1')}"><b>R</b><i class="is-working"></i></span><span class="chat-row__body"><b>Researcher<time>14:02</time></b><small>Working · compared changelog with merged PRs</small></span><span class="badge">2</span></div><div class="chat-row"><span class="avatar avatar--group"><span style="--hue:${token('agent2')}">RM</span><span style="--hue:${token('agent4')}">T</span></span><span class="chat-row__body"><b>#general <span class="tag">istin-network</span><time>13:58</time></b><small>Test Runner: 42 tests green</small></span></div></div></div>
    <div class="sg-card"><h4>Messages &amp; cards</h4><div class="thread"><div class="bubble bubble--agent"><b>Researcher</b><p>Two changelog items are missing notes.</p></div><div class="bubble bubble--own"><p>Open a task channel and fix them.</p><time>14:03</time></div><div class="bubble bubble--system">Researcher created #release-260-audit · 4 agents</div><div class="tool-card">${icon('terminal', 18)}<div><b>bash · git log --oneline -12</b><small>12 commits · 1.2 s</small></div><span class="tag">done</span></div>
      <div class="approval-card"><div><b>Approval</b><p>Release Manager wants to invite Test Runner from client-acme.</p></div><div class="sg-row"><button class="btn btn--primary">Approve</button><button class="btn btn--danger">Deny</button></div></div></div></div>
    <div class="sg-card"><h4>Composer</h4><div class="composer">${icon('attach', 20, 'Attach')}<input placeholder="Message Researcher"><button class="model-chip">${icon('model', 16)} Auto</button><button class="send" aria-label="Send">${icon('send', 20)}</button></div><div class="sg-row sg-mt"><span class="chip">Model: Auto</span><span class="chip">${icon('apps', 16)} Apps</span></div></div>
    <div class="sg-card"><h4>Apps &amp; Boards (Installed)</h4>
      <div class="app-grid">
        <button class="app-tile">${icon('board', 24)}<b>Morning Board</b><small>3 widgets · pinned</small></button>
        <button class="app-tile">${icon('file', 24)}<b>Export Studio</b><small>PDF · 2.1 MB · ready</small></button>
        <button class="app-tile is-running">${icon('activity', 24)}<b>Release Audit</b><small>running · channel-bound</small></button>
        <button class="app-tile is-add">${icon('plus', 24)}<b>New custom app</b></button>
      </div>
    </div>

    <div class="sg-card" style="grid-column: 1 / -1;">
      <h4>Widget Store &amp; Runtime Catalog (fa_ui)</h4>
      <div class="store-grid">
        <div class="store-card">
          <div class="store-card__header">
            <div class="store-card__icon">${icon('board', 24)}</div>
            <div class="store-card__meta">
              <b>Calendar &amp; Tasks</b>
              <small>v1.4.0 · flutter_js_widget_runtime</small>
            </div>
          </div>
          <p>Two-way calendar widget syncing agent scheduled deliverables with local deadlines.</p>
          <div class="store-card__footer">
            <span class="store-card__price">Core Widget</span>
            <button type="button" class="btn btn--primary store-card__btn">Install</button>
          </div>
        </div>

        <div class="store-card">
          <div class="store-card__header">
            <div class="store-card__icon">${icon('activity', 24)}</div>
            <div class="store-card__meta">
              <b>Trajectory Visualizer</b>
              <small>v2.1.0 · fa_ui</small>
            </div>
          </div>
          <p>Live DAG timeline of agent tool execution, token throughput and decision checkpoints.</p>
          <div class="store-card__footer">
            <span class="store-card__price">System</span>
            <button type="button" class="btn btn--secondary store-card__btn" disabled>Installed</button>
          </div>
        </div>

        <div class="store-card">
          <div class="store-card__header">
            <div class="store-card__icon">${icon('terminal', 24)}</div>
            <div class="store-card__meta">
              <b>Terminal Logs &amp; PTY</b>
              <small>v1.0.2 · LocalShell</small>
            </div>
          </div>
          <p>Interactive ANSI streaming terminal card with background process supervision and stop hooks.</p>
          <div class="store-card__footer">
            <span class="store-card__price">Developer</span>
            <button type="button" class="btn btn--primary store-card__btn">Install</button>
          </div>
        </div>
      </div>
    </div>
    <div class="sg-card"><h4>Sheets, toasts, empty, nav</h4><div class="sheet-mini"><header>Invite agent<code>QR · CLI</code></header><p>Scan on the phone, or run:</p><pre>fa agent join --channel release-260-audit</pre><footer><button class="btn btn--secondary">Copy</button><button class="btn btn--primary">Done</button></footer></div>
      <div class="toast">${icon('check', 20)} Invite approved<span>Undo</span></div>
      <div class="empty">${icon('agent', 40)}<b>No agents yet</b><p>Add your first agent; it joins My Network automatically.</p><button class="btn btn--primary">Add agent</button></div>
      <nav class="bottom-nav"><button class="is-active">${icon('chat', 22)}<span>Chats</span></button><button>${icon('activity', 22)}<span>Activity</span></button><button>${icon('apps', 22)}<span>Apps</span></button></nav></div>
  </div>`;
}

function demoCard(id, title, specKey, flutter, body) {
  return `<div class="demo" data-demo="${id}"><div class="demo__head"><b>${title}</b><span class="demo__spec">${motionSpec(specKey)} · Flutter: ${flutter}</span><button class="btn btn--secondary" type="button" data-replay="${id}">Replay</button></div><div class="demo__stage">${body}</div></div>`;
}


function renderAppsBoards() {
  const d = DIRECTIONS[state.direction];
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">06</span>Apps Grid, Widgets &amp; Boards</h2>
    <p class="sg-lede">Архитектура расширяемой платформы для Flutter: Лаунчер установленных приложений (Apps Grid), Каталог виджетов (Widget Store) и Интерактивные доски (Boards) на десктопе и в адаптивном мобильном стеке.</p></header>

    <!-- SUB-SECTION 1: APPS LAUNCHER GRID -->
    <div class="sg-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <h4 style="margin:0;">1. Apps Launcher (Установленные сервисы)</h4>
        <span class="tag">Launchpad Style</span>
      </div>
      <p style="font-size:12.5px; color:var(--ink-2); margin:0 0 12px;">Быстрый запуск агентов и утилит. Зеленый индикатор обозначает фоновый процесс (running process supervision).</p>
      <div class="apps-launcher-grid">
        <div class="app-launcher-tile">
          <span class="app-running-indicator" title="Running process"></span>
          <div class="app-icon-squircle" style="background: linear-gradient(135deg, #0284C7, #38BDF8);">
            ${icon('board', 26)}
          </div>
          <b>Boards</b>
          <small>Workspaces</small>
        </div>
        <div class="app-launcher-tile">
          <span class="app-running-indicator" title="Running process"></span>
          <div class="app-icon-squircle" style="background: linear-gradient(135deg, #7C3AED, #9366FF);">
            ${icon('activity', 26)}
          </div>
          <b>Trajectory</b>
          <small>Diagnostics</small>
        </div>
        <div class="app-launcher-tile">
          <div class="app-icon-squircle" style="background: linear-gradient(135deg, #059669, #10B981);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <b>Calendar</b>
          <small>Planner</small>
        </div>
        <div class="app-launcher-tile">
          <div class="app-icon-squircle" style="background: linear-gradient(135deg, #D97706, #F59E0B);">
            ${icon('terminal', 24)}
          </div>
          <b>Terminal</b>
          <small>PTY Shell</small>
        </div>
        <div class="app-launcher-tile">
          <div class="app-icon-squircle" style="background: linear-gradient(135deg, #DB2777, #EC4899);">
            ${icon('file', 24)}
          </div>
          <b>Export</b>
          <small>PDF / PPTX</small>
        </div>
        <div class="app-launcher-tile">
          <div class="app-icon-squircle" style="background: linear-gradient(135deg, #4F46E5, #6366F1);">
            ${icon('network', 24)}
          </div>
          <b>Networks</b>
          <small>DAP Fabric</small>
        </div>
        <div class="app-launcher-tile" style="border-style:dashed; background:transparent;">
          <div class="app-icon-squircle" style="background:var(--surface-3); color:var(--ink-3); box-shadow:none;">
            ${icon('plus', 22)}
          </div>
          <b style="color:var(--ink-2);">New App</b>
          <small>Custom JS</small>
        </div>
      </div>
    </div>

    <!-- SUB-SECTION 2: MULTI-WIDGET DASHBOARD / BOARDS (Desktop Grid) -->
    <div class="sg-card sg-mt">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <h4 style="margin:0;">2. Live Widgets Board (Рабочий стол агентов · 12-колоночная сетка)</h4>
        <span class="tag">Morning Board · 3 widgets</span>
      </div>
      <p style="font-size:12.5px; color:var(--ink-2); margin:0 0 12px;">Интерактивная доска, куда агенты выводят результаты, прогресс сборки, чек-листы и потоковые логи.</p>
      <div class="widget-board-grid">
        <!-- Terminal Col 8 -->
        <div class="widget-panel widget-panel--col8">
          <div class="widget-panel__head">
            <div class="widget-panel__title">${icon('terminal', 18)} Release Manager · Live Bash Session <span class="tag tag--task" style="color:var(--success);">PID 54109</span></div>
            <div style="display:flex; gap:6px;">${icon('more', 16)}</div>
          </div>
          <div class="terminal-window">
            <div class="dim-line">[14:02:11] initializing sandbox /tmp/fa-release-check...</div>
            <div><span class="cmd-line">$</span> git status --short</div>
            <div class="dim-line">M  lib/src/release_checker.dart</div>
            <div><span class="cmd-line">$</span> dart analyze --fatal-infos</div>
            <div class="ok-line">Analyzing flutter_agent... No issues found! (0.8s)</div>
            <div><span class="cmd-line">$</span> flutter test test/release_test.dart</div>
            <div class="ok-line">00:04 +12: All tests passed!</div>
          </div>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <div class="sg-card" style="flex:1; padding:8px 12px; margin:0;"><small style="color:var(--ink-3); font-size:10px;">MEM</small><b style="display:block; font-family:var(--font-mono); font-size:16px;">42.8 MB</b></div>
            <div class="sg-card" style="flex:1; padding:8px 12px; margin:0;"><small style="color:var(--ink-3); font-size:10px;">DURATION</small><b style="display:block; font-family:var(--font-mono); font-size:16px;">4.2s</b></div>
            <div class="sg-card" style="flex:1; padding:8px 12px; margin:0;"><small style="color:var(--ink-3); font-size:10px;">TOKENS</small><b style="display:block; font-family:var(--font-mono); font-size:16px;">1,420</b></div>
          </div>
        </div>

        <!-- Milestones Col 4 -->
        <div class="widget-panel widget-panel--col4">
          <div class="widget-panel__head">
            <div class="widget-panel__title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Milestones</div>
            <span style="font-size:11px; color:var(--ink-3);">Oct 30</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:var(--r-sm); background:var(--surface-2); font-size:12px; opacity:0.6; text-decoration:line-through;">
              <input type="checkbox" checked disabled> <span>v2.6.0 changelog verified</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:var(--r-sm); background:var(--surface-2); font-size:12px;">
              <input type="checkbox"> <span style="color:var(--accent); font-weight:700;">Tag commit &amp; publish OIDC</span>
            </div>
          </div>
        </div>

        <!-- Trajectory DAG Col 8 -->
        <div class="widget-panel widget-panel--col8">
          <div class="widget-panel__head">
            <div class="widget-panel__title">${icon('activity', 18)} Trajectory DAG · #release-260-audit</div>
            <span style="font-size:11px; font-family:var(--font-mono); color:var(--ink-2);">Step 4 / 6</span>
          </div>
          <div class="dag-scroll-container">
            <div class="sg-card" style="padding:6px 10px; margin:0; flex-shrink:0;"><b style="font-size:11px;">User Prompt</b></div>
            <span>→</span>
            <div class="sg-card" style="padding:6px 10px; margin:0; flex-shrink:0;"><b style="font-size:11px;">Release Mgr</b></div>
            <span>→</span>
            <div class="sg-card" style="padding:6px 10px; margin:0; flex-shrink:0;"><b style="font-size:11px;">git diff</b></div>
            <span>→</span>
            <div class="sg-card" style="padding:6px 10px; margin:0; flex-shrink:0; border-color:var(--accent); background:var(--accent-soft);"><b style="font-size:11px; color:var(--accent);">Code Reviewer...</b></div>
            <span>→</span>
            <div class="sg-card" style="padding:6px 10px; margin:0; flex-shrink:0; opacity:0.4;"><b style="font-size:11px;">Verdict</b></div>
          </div>
        </div>

        <!-- Active Agents Roster Col 4 -->
        <div class="widget-panel widget-panel--col4">
          <div class="widget-panel__head">
            <div class="widget-panel__title">${icon('agent', 18)} Active Roster</div>
            <span style="font-size:11px; color:var(--success); font-weight:700;">3 Online</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px; padding:4px; font-size:12px;">
              <span class="avatar" style="--hue:${token('agent2')}; width:28px; height:28px; font-size:10px;"><b>RM</b><i class="is-online"></i></span>
              <div style="flex:1;"><b style="font-size:12px;">Release Manager</b></div>
              <span class="tag">active</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding:4px; font-size:12px;">
              <span class="avatar" style="--hue:${token('agent3')}; width:28px; height:28px; font-size:10px;"><b>CR</b><i class="is-working"></i></span>
              <div style="flex:1;"><b style="font-size:12px;">Code Reviewer</b></div>
              <span class="tag tag--task">working</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SUB-SECTION 3: MOBILE ADAPTATION STACK (Launcher vs. Live Board) -->
    <div class="sg-card sg-mt">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <h4 style="margin:0;">3. Mobile Adaptation: Apps Tab vs. Boards Feed</h4>
        <span class="tag">SliverGrid / CustomScrollView</span>
      </div>
      <p style="font-size:12.5px; color:var(--ink-2); margin:0 0 16px;">На смартфоне раздел Apps разделен на два нативных экрана: быстрый запуск (таб My Apps) и вертикальный скролл живых виджетов (таб Boards). Смена происходит через <code>SharedAxisTransition</code>.</p>
      <div class="mobile-board-pair">
        <!-- Phone 1: Mobile Launcher -->
        <div class="mobile-device-card">
          <h4>📱 Mobile: My Apps Launcher <span>SliverGrid (4 col)</span></h4>
          <p style="font-size:12px; color:var(--ink-2); margin:0;">Тап по приложению разворачивает его на весь экран, запущенные процессы подсвечены зеленым бейджем.</p>
          <div style="background:var(--surface-2); padding:10px; border-radius:var(--r-md); display:flex; align-items:center; gap:10px;">
            <span style="width:8px; height:8px; border-radius:50%; background:var(--success); box-shadow:0 0 6px var(--success);"></span>
            <div style="flex:1; font-size:12px;"><b>Release Audit App</b> · running</div>
            <span style="font-size:11px; color:var(--accent);">Open →</span>
          </div>
          <!-- Authentic iOS SpringBoard 4-column App Grid (No boxes around items!) -->
          <div class="ios-springboard">
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #0284C7, #38BDF8);">
                <span class="ios-running-badge" title="Running process"></span>
                ${icon('board', 24)}
              </div>
              <span class="ios-app-label">Boards</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #7C3AED, #9366FF);">
                <span class="ios-running-badge" title="Running process"></span>
                ${icon('activity', 24)}
              </div>
              <span class="ios-app-label">Trajectory</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #059669, #10B981);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span class="ios-app-label">Calendar</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #D97706, #F59E0B);">
                ${icon('terminal', 24)}
              </div>
              <span class="ios-app-label">Terminal</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #DB2777, #EC4899);">
                ${icon('file', 24)}
              </div>
              <span class="ios-app-label">Export</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #4F46E5, #6366F1);">
                ${icon('network', 24)}
              </div>
              <span class="ios-app-label">Networks</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: linear-gradient(135deg, #0284C7, #0EA5E9);">
                ${icon('settings', 24)}
              </div>
              <span class="ios-app-label">Settings</span>
            </div>
            <div class="ios-app-item">
              <div class="ios-app-icon" style="background: var(--surface-3); border: 1.5px dashed var(--hairline); box-shadow:none; color:var(--ink-3);">
                ${icon('plus', 22)}
              </div>
              <span class="ios-app-label" style="color:var(--ink-3);">New App</span>
            </div>
          </div>
        </div>

        <!-- Phone 2: Mobile Widgets Feed -->
        <div class="mobile-device-card">
          <h4>📱 Mobile: Morning Board <span>Vertical Feed</span></h4>
          <p style="font-size:12px; color:var(--ink-2); margin:0;">Виджеты складываются в вертикальную ленту без горизонтальной тесноты и обрезки.</p>
          <div class="sg-card" style="padding:10px; margin:0; background:var(--surface-2);">
            <div style="font-size:11.5px; font-weight:700; margin-bottom:4px;">${icon('terminal', 14)} Bash Output</div>
            <div class="terminal-window" style="height:70px; font-size:11px; padding:6px;">
              <div>$ dart analyze</div>
              <div class="ok-line">No issues found!</div>
            </div>
          </div>
          <div class="sg-card" style="padding:10px; margin:0; background:var(--surface-2);">
            <div style="font-size:11.5px; font-weight:700; margin-bottom:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Milestones</div>
            <div style="font-size:11.5px; color:var(--accent); font-weight:700;">Tag commit &amp; publish OIDC</div>
          </div>
        </div>
      </div>
    </div>
`;
}


function renderSettingsSystem() {
  const d = DIRECTIONS[state.direction];
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">07</span>Settings &amp; Preferences System (flutter_app / fa_ui)</h2>
    <p class="sg-lede">Элементы настроек из <code>flutter_app/lib/ui/screens/settings.dart</code>, адаптированные под дизайн-систему: управление API-ключами, модельные роли, доступ инструментов (MCP/CLI), автоматическая компакция сессий и приватность.</p></header>

    <div class="settings-group-stack">
      <!-- 1. API Keys & Providers Section -->
      <div class="settings-section-card">
        <header>
          <h4>${icon('key', 18)} API Keys &amp; Providers (KeysSection)</h4>
          <span class="tag">Encrypted Keychain</span>
        </header>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>OpenRouter / JoinGonka Token</b>
            <span>Primary inference gateway for Moonshot Kimi-K2.6 &amp; Claude 3.5</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="key-pill-display">sk-or-v1-••••••••4a9f</span>
            <button type="button" class="btn btn--secondary" style="min-height:28px; padding:0 10px; font-size:11.5px;">Edit</button>
          </div>
        </div>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Codemie SSO Connection</b>
            <span>Active team session: <code>istin-corp / enterprise</code></span>
          </div>
          <span class="tag tag--task" style="color:var(--success);">Connected</span>
        </div>
      </div>

      <!-- 2. Model Roles (Fast / Smol / Slow / Reasoning) -->
      <div class="settings-section-card">
        <header>
          <h4>${icon('model', 18)} Model Roles &amp; Defaults (ModelsSettingsPage)</h4>
          <span class="tag">fa config models</span>
        </header>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Main Conversational Model</b>
            <span>Used for direct chat turns and user steering</span>
          </div>
          <div class="dropdown-demo" style="min-width:180px;">
            <div class="dropdown-trigger" style="padding:6px 10px; font-size:12px;">${icon('model', 14)} Kimi K2.6 <span style="font-size:9px; margin-left:auto;">▼</span></div>
          </div>
        </div>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Smol Role (Compaction &amp; Fast Titles)</b>
            <span>Lightweight role used for session summarization</span>
          </div>
          <div class="dropdown-demo" style="min-width:180px;">
            <div class="dropdown-trigger" style="padding:6px 10px; font-size:12px;">${icon('model', 14)} GPT-4o-mini <span style="font-size:9px; margin-left:auto;">▼</span></div>
          </div>
        </div>
      </div>

      <!-- 3. Tools Availability & Approval Gate (ToolsAvailabilitySection) -->
      <div class="settings-section-card">
        <header>
          <h4>${icon('shield', 18)} Tool Approvals &amp; Execution Gate (ToolsAvailabilitySection)</h4>
          <span class="tag">ApprovalMode: write</span>
        </header>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Bash Shell Tool (setsid / killTree)</b>
            <span>Execute terminal commands in project root</span>
          </div>
          <label class="switch"><input type="checkbox" checked><span></span></label>
        </div>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Web Search &amp; Fetch Tools</b>
            <span>Allow agent to search the live web and download pages</span>
          </div>
          <label class="switch"><input type="checkbox" checked><span></span></label>
        </div>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Secret Redaction Pipeline (RedactionSection)</b>
            <span>Auto-mask tokens and API keys in session history (<code>[REDACTED:token]</code>)</span>
          </div>
          <label class="switch"><input type="checkbox" checked><span></span></label>
        </div>
      </div>

      <!-- 4. Session Compaction & Storage (CompactionSection) -->
      <div class="settings-section-card">
        <header>
          <h4>${icon('storage', 18)} Storage &amp; Compaction (CompactionSection)</h4>
          <span class="tag">~/.fah/messages/</span>
        </header>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Auto-Compaction Threshold</b>
            <span>Trigger summary generation when history approaches context limit</span>
          </div>
          <span style="font-family:var(--font-mono); font-size:12px; color:var(--ink-1); font-weight:700;">16,384 tokens reserved</span>
        </div>
        <div class="settings-row-item">
          <div class="settings-row-info">
            <b>Clear Session Cache &amp; Replay Onboarding</b>
            <span>Reset local temporary files without losing durable memory</span>
          </div>
          <button type="button" class="btn btn--danger" style="min-height:28px; padding:0 12px; font-size:11.5px;">Clear Cache</button>
        </div>
      </div>
    </div>
`;
}


function renderAdaptiveMatrix() {
  const d = DIRECTIONS[state.direction];
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">08</span>Adaptive &amp; Responsive UI Transformations (Flutter Architecture)</h2>
    <p class="sg-lede">Детальный контракт трансформации интерфейса на 3 целевых класса устройств во Flutter (<code>LayoutBuilder</code> / <code>MediaQuery</code>): Small Phone (одноколоночный push/pop), Medium Dual/Fold &amp; Tablet (2 колонки + action rail + сплиттер), Large Desktop &amp; Web (3 колонки + постоянные виджеты).</p></header>

    <div class="adaptive-tier-grid">
      <!-- TIER 1: SMALL SCREENS -->
      <div class="tier-card">
        <header>
          <h4>📱 Small Screens (Phone)</h4>
          <span class="tier-tag">&lt; 640px · iPhone / Galaxy</span>
        </header>
        <ul class="tier-list">
          <li><b>Навигация:</b> Нижний <code>BottomNavigationBar</code> (Chats, Activity, Apps). Никаких гамбургер-меню и вложенных drawer.</li>
          <li><b>Экраны:</b> Строгий стек <code>Navigator.push/pop</code>. Один видимый экран за раз: список чатов ИЛИ открытый диалог ИЛИ виджет во весь экран.</li>
          <li><b>Создание:</b> Плавающий <code>FloatingActionButton (+)</code> над нижней панелью для быстрого старта нового чата/канала.</li>
          <li><b>Apps:</b> Таб <b>My Apps</b> отображается как нативный 4-колоночный <code>SliverGrid</code> (iOS SpringBoard). Таб <b>Boards</b> складывается в вертикальную ленту <code>CustomScrollView</code>.</li>
          <li><b>Composer:</b> Плавающий круглый composer с контекстными чипсами над клавиатурой (высота поднимается через <code>viewInsets.bottom</code>).</li>
        </ul>
        <div class="adaptive-schematic">
<span class="dim">┌────────────────────────┐</span>
<span class="dim">│</span> [Chats / Title Bar]    <span class="dim">│</span>
<span class="dim">├────────────────────────┤</span>
<span class="dim">│</span> Single Column View     <span class="dim">│</span>
<span class="dim">│</span> (Chats OR Thread OR App<span class="dim">│</span>
<span class="dim">│</span>                        <span class="dim">│</span>
<span class="dim">├────────────────────────┤</span>
<span class="dim">│</span> <span class="hi">[Chats]  [Activity] [Apps]</span> <span class="dim">│</span>
<span class="dim">└────────────────────────┘</span>
        </div>
      </div>

      <!-- TIER 2: MEDIUM SCREENS -->
      <div class="tier-card">
        <header>
          <h4>📖 Medium (Dual / Fold / Tablet)</h4>
          <span class="tier-tag">640px – 1024px · iPad / Fold</span>
        </header>
        <ul class="tier-list">
          <li><b>2-панельный Master-Detail:</b> Список чатов слева, активный диалог справа. Никаких переходов назад-вперёд.</li>
          <li><b>Action Rail справа:</b> Специальная вертикальная полоса действий (New, Search, Apps, Settings) для хвата большими пальцами.</li>
          <li><b>Draggable Splitter:</b> Центральная полоса-разделитель меняет ширину списка чатов от 280px до 420px.</li>
          <li><b>Apps &amp; Panels:</b> Запущенный App открывается как боковая панель справа (Slide-over) поверх диалога или делит экран 50/50.</li>
          <li><b>Двойной экран (Fold):</b> Шов складки (Hinge) изолирован — список слева от сгиба, диалог справа, контент не ломается пополам.</li>
        </ul>
        <div class="adaptive-schematic">
<span class="dim">┌──────────┬─────────────┬──┐</span>
<span class="dim">│</span> List     <span class="dim">│</span> Conversation<span class="dim">│</span>R <span class="dim">│</span>
<span class="dim">│</span> 320px    <span class="dim">│</span> Thread      <span class="dim">│</span>A <span class="dim">│</span>
<span class="dim">│</span> (Master) <span class="dim">│</span> (Detail)    <span class="dim">│</span>I <span class="dim">│</span>
<span class="dim">│</span>          <span class="dim">│</span>             <span class="dim">│</span>L <span class="dim">│</span>
<span class="dim">└──────────┴─────────────┴──┘</span>
        </div>
      </div>

      <!-- TIER 3: LARGE SCREENS -->
      <div class="tier-card">
        <header>
          <h4>🖥️ Large (Desktop &amp; Web)</h4>
          <span class="tier-tag">&gt; 1024px · Mac / Windows / Web</span>
        </header>
        <ul class="tier-list">
          <li><b>3-колоночный Layout:</b> Полноценный трёхпанельный режим: 1) Список чатов/сетей → 2) Диалог → 3) Закреплённая доска виджетов (Pinned Board).</li>
          <li><b>Live Widgets Board:</b> Правая панель до 480px, где в реальном времени живут терминал, чеклисты, DAG-графы и таймлайн.</li>
          <li><b>Многооконность / Split:</b> Возможность одновременно смотреть переписку двух агентов или чат + потоковый терминал сборки.</li>
          <li><b>Клавиатурные шорткаты:</b> Глобальный <code>Cmd/Ctrl+K</code> (поиск везде), <code>Cmd+N</code> (новый чат), навигация стрелками вверх/вниз по списку.</li>
          <li><b>Composer:</b> Фиксированный максимальный measure текста (60–68ch для удобочитаемости), кнопки переключения модели и прикрепления файлов.</li>
        </ul>
        <div class="adaptive-schematic">
<span class="dim">┌────────┬──────────────┬───────────┐</span>
<span class="dim">│</span> Chats  <span class="dim">│</span> Active Chat  <span class="dim">│</span> Pinned    <span class="dim">│</span>
<span class="dim">│</span> 300px  <span class="dim">│</span> (68ch measure<span class="dim">│</span> Widgets   <span class="dim">│</span>
<span class="dim">│</span>        <span class="dim">│</span>  own/agent)  <span class="dim">│</span> Terminal  <span class="dim">│</span>
<span class="dim">│</span>        <span class="dim">│</span>              <span class="dim">│</span> DAG / Cal <span class="dim">│</span>
<span class="dim">└────────┴──────────────┴───────────┘</span>
        </div>
      </div>
    </div>

    <!-- MIGRATION MATRIX TABLE FOR FLUTTER -->
    <div class="sg-card sg-mt">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h4 style="margin:0;">Матрица миграции компонентов во Flutter (fa_ui / flutter_app)</h4>
        <span class="tag">Implementation Blueprint</span>
      </div>
      <div class="table-wrap">
        <table class="sg-table">
          <thead>
            <tr>
              <th>Элемент UI</th>
              <th>Small (&lt;640px)</th>
              <th>Medium (640–1024px)</th>
              <th>Large (&gt;1024px)</th>
              <th>Виджет во Flutter</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Primary Nav</b></td>
              <td>BottomNavigationBar (3 вкладки)</td>
              <td>Вертикальный NavigationRail</td>
              <td>Sidebar Header Tabs + Profile</td>
              <td><code>NavigationBar</code> / <code>NavigationRail</code></td>
            </tr>
            <tr>
              <td><b>Conversation</b></td>
              <td>Отдельный экран (полный push)</td>
              <td>Правая колонка Master-Detail</td>
              <td>Центральная колонка (макс. 68ch)</td>
              <td><code>AnimatedSwitcher</code> / <code>SharedAxis</code></td>
            </tr>
            <tr>
              <td><b>Apps Grid</b></td>
              <td>iOS SpringBoard (4 колонки)</td>
              <td>Сетка 5-6 колонок</td>
              <td>Плитки с метаданными и статусом</td>
              <td><code>SliverGrid</code> + <code>Card</code></td>
            </tr>
            <tr>
              <td><b>Widgets Board</b></td>
              <td>Вертикальная лента (вкладка Boards)</td>
              <td>Плавающая панель (Slide-over)</td>
              <td>Постоянная 3-я колонка (до 480px)</td>
              <td><code>CustomScrollView</code> / <code>SplitView</code></td>
            </tr>
            <tr>
              <td><b>Composer &amp; Chips</b></td>
              <td>Плавающий над клавиатурой</td>
              <td>Встроенный снизу треда диалога</td>
              <td>Широкий инпут с шорткатами</td>
              <td><code>ChatComposer</code> (fa_ui)</td>
            </tr>
            <tr>
              <td><b>Settings</b></td>
              <td>Push-экран из профиля / Apps</td>
              <td>Диалог / Полноэкранный модал</td>
              <td>Модальное окно или правая панель</td>
              <td><code>Navigator</code> / <code>showGeneralDialog</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
`;
}

function renderMotion() {
  const d = DIRECTIONS[state.direction];
  const demos = [
    demoCard('send', 'Message send', 'base', 'AnimatedSwitcher + Curves.easeOutCubic', `<div class="stage-send"><div class="send-thread"><div class="bubble bubble--own demo-send-bubble">Release 2.6.0 is ready</div></div><div class="composer composer--demo">${icon('attach', 20)}<input placeholder="Message Researcher"><button class="send demo-send-button">${icon('send', 20)}</button></div></div>`),
    demoCard('typing', 'Working indicator', 'fast', 'Curves.easeInOut + repeat(reverse)', `<div class="stage-typing"><span class="avatar" style="--hue:${token('agent1')}"><b>R</b></span><span class="typing"><i></i><i></i><i></i></span><small>Researcher is working</small></div>`),
    demoCard('navigate', 'List to chat', 'emph', 'SharedAxisTransition (horizontal)', `<div class="stage-nav"><div class="nav-pane nav-list"><div class="chat-row"><span class="avatar" style="--hue:${token('agent1')}"><b>R</b></span><span class="chat-row__body"><b>Researcher</b><small>Two items missing notes</small></span></div></div><div class="nav-pane nav-chat"><header>Researcher</header><div class="bubble bubble--agent">Ready.</div></div></div>`),
    demoCard('app', 'App tile to fullscreen app', 'emph', 'OpenContainer (animations package)', `<div class="stage-app"><div class="app-origin app-tile">${icon('board', 24)}<b>Morning Board</b></div><div class="app-full"><header>Morning Board</header><div class="app-full__grid"><span></span><span></span><span></span><span></span></div></div></div>`),
    demoCard('sheet', 'Bottom sheet', 'spring', 'SpringDescription + showModalBottomSheet', `<div class="stage-sheet"><div class="sheet-backdrop"></div><div class="sheet-demo"><header>Invite agent</header><p>QR · CLI · approval by owner</p></div></div>`),
    demoCard('chip', 'Chip selection', 'fast', 'AnimatedContainer + Curves.easeOutCubic', `<div class="stage-chips"><button class="chip">All</button><button class="chip demo-chip">Unread</button></div>`),
    demoCard('approval', 'Approval resolves', 'base', 'AnimatedSize + Curves.easeOutCubic', `<div class="stage-approval"><div class="approval-card demo-approval"><div><b>Approval</b><p>Invite Test Runner from client-acme.</p></div><button class="btn btn--primary">Approve</button></div><div class="demo-approval-done">${icon('check', 18)} Approved · Test Runner joined</div></div>`),
    demoCard('badge', 'Unread count bump', 'spring', 'ScaleTransition with spring', `<div class="stage-badge"><span class="avatar" style="--hue:${token('agent2')}"><b>RM</b></span><span class="badge demo-badge">3</span></div>`),
    demoCard('theme', 'Theme cross-fade', 'emph', 'AnimatedTheme / MaterialApp theme animation', `<div class="stage-theme"><div class="theme-pane theme-a"><b>${d.name}</b><span>${state.mode}</span></div><div class="theme-pane theme-b"><b>${d.name}</b><span>${state.mode === 'light' ? 'dark' : 'light'}</span></div></div>`),
  ].join('');
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">09</span>Motion</h2>
    <p class="sg-lede">${d.motion.personality} Each demo replays with the active direction's tokens; the spec line is the implementation contract, not decoration.</p></header>
    <div class="sg-grid sg-grid--2">${demos}</div>
    ${note('Reduced motion: replays still work, but collapse to opacity-only transitions.')}`;
}

function renderCompare() {
  const rows = DIRECTION_IDS.map((id) => {
    const d = DIRECTIONS[id];
    const c = compareRows[id];
    return `<tr${id === state.direction ? ' class="is-current"' : ''}><td><b>${d.name}</b>${id === state.direction ? '<span class="tag">viewing</span>' : ''}</td><td>${d.tagline}</td><td>${c.accent}</td><td>${c.type}</td><td>${c.motion}</td><td>${c.bestFor}</td><td>${c.risk}</td></tr>`;
  }).join('');
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">10</span>Compare &amp; choose</h2>
    <p class="sg-lede">Recommended: <b>Porcelain</b> for the mass-market messenger — it is the most tactile and scales best to a phone-first audience. Choose <b>Liquid Glass</b> for Apple-grade frosted acrylic luxury, <b>Nebula</b> for night-time deep work, or <b>Graphite</b> for an operator console.</p></header>
    <div class="table-wrap"><table class="sg-table sg-table--compare"><thead><tr><th>Direction</th><th>Personality</th><th>Accent</th><th>Type</th><th>Motion</th><th>Best for</th><th>Risk</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderAll() {
  setSection('hero', renderHero());
  setSection('palette', renderPalette());
  setSection('type', renderType());
  setSection('shape', renderShape());
  setSection('icons', renderIcons());
  setSection('components', renderComponents());
  setSection('apps-boards', renderAppsBoards());
  setSection('settings-system', renderSettingsSystem());
  setSection('adaptive-matrix', renderAdaptiveMatrix());
  setSection('motion', renderMotion());
  setSection('compare', renderCompare());
}

function renderSwitcher() {
  const host = document.querySelector('[data-role="direction-switch"]');
  host.innerHTML = DIRECTION_IDS.map((id) => `<button type="button" role="radio" aria-checked="${id === state.direction}" data-direction-button="${id}">${DIRECTIONS[id].name}</button>`).join('');
  
  const fontHost = document.querySelector('[data-role="font-switch"]');
  if (fontHost) {
    fontHost.innerHTML = FONT_PRESET_IDS.map((id) => `<button type="button" role="radio" aria-checked="${id === state.font}" data-font-button="${id}" title="${FONT_PRESETS[id].note}">${FONT_PRESETS[id].tag}</button>`).join('');
  }

  const mode = document.querySelector('[data-role="mode-toggle"]');
  mode.textContent = state.mode === 'light' ? 'Dark' : 'Light';
  mode.setAttribute('aria-pressed', String(state.mode === 'dark'));
  const choose = document.querySelector('[data-role="choose"]');
  choose.dataset.chosen = String(state.chosen === state.direction);
  choose.textContent = state.chosen === state.direction ? 'Chosen' : 'Choose this direction';
}

function apply(next, updateHash = true) {
  state.direction = DIRECTION_IDS.includes(next.direction) ? next.direction : 'porcelain';
  state.mode = next.mode === 'dark' ? 'dark' : 'light';
  state.font = FONT_PRESET_IDS.includes(next.font) ? next.font : (state.font || 'system');
  const root = document.documentElement;
  root.dataset.direction = state.direction;
  root.dataset.mode = state.mode;
  root.dataset.font = state.font;
  root.classList.add('sg-theming');
  renderSwitcher();
  renderAll();
  if (updateHash) history.replaceState(null, '', buildHash(state.direction, state.mode, state.font));
}

function toast(message) {
  const host = document.querySelector('[data-role="toast-host"]');
  const node = document.createElement('div');
  node.className = 'sg-toast';
  node.innerHTML = `${icon('check', 18)} <span>${message}</span>`;
  host.replaceChildren(node);
  node.classList.add('is-visible');
  setTimeout(() => node.classList.remove('is-visible'), 2600);
}

function replay(demo) {
  demo.classList.remove('playing');
  void demo.offsetWidth;
  demo.classList.add('playing');
}

function init() {
  state.chosen = localStorage.getItem(STORAGE_KEY);
  const fromHash = parseHash(location.hash);
  const storedChoice = state.chosen && DIRECTIONS[state.chosen] ? state.chosen : null;
  const storedFont = localStorage.getItem(FONT_STORAGE_KEY);
  apply({ direction: fromHash.direction || storedChoice || 'porcelain', mode: fromHash.mode || 'dark', font: fromHash.font || storedFont || 'system' }, false);
  history.replaceState(null, '', buildHash(state.direction, state.mode));

  document.addEventListener('click', (event) => {
    const directionButton = event.target.closest('[data-direction-button]');
    if (directionButton) {
      apply({ direction: directionButton.dataset.directionButton, mode: state.mode, font: state.font });
      return;
    }
    const fontButton = event.target.closest('[data-font-button]');
    if (fontButton) {
      const f = fontButton.dataset.fontButton;
      localStorage.setItem(FONT_STORAGE_KEY, f);
      apply({ direction: state.direction, mode: state.mode, font: f });
      toast(`Шрифт переключен на ${FONT_PRESETS[f].name}`);
      return;
    }
    if (event.target.closest('[data-role="mode-toggle"]')) {
      apply({ direction: state.direction, mode: state.mode === 'light' ? 'dark' : 'light' });
      return;
    }
    if (event.target.closest('[data-role="choose"]')) {
      state.chosen = state.direction;
      localStorage.setItem(STORAGE_KEY, state.direction);
      renderSwitcher();
      toast(`${DIRECTIONS[state.direction].name} saved as your direction`);
      return;
    }
    const replayButton = event.target.closest('[data-replay]');
    if (replayButton) replay(replayButton.closest('.demo'));
  });

  window.addEventListener('hashchange', () => {
    const parsed = parseHash(location.hash);
    if (parsed.direction || parsed.mode || parsed.font) apply({ direction: parsed.direction || state.direction, mode: parsed.mode || state.mode, font: parsed.font || state.font }, false);
  });
}

if (typeof document !== 'undefined' && document.querySelector('[data-role="direction-switch"]')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
