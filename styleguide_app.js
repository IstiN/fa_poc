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
    <p class="sg-hero__eyebrow"><span class="dot"></span>Direction ${DIRECTION_IDS.indexOf(state.direction) + 1} of 3 · ${state.mode} mode</p>
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
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">06</span>Motion</h2>
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
  return `<header class="sg-head"><h2 class="sg-h2"><span class="sg-h2__num">07</span>Compare &amp; choose</h2>
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
