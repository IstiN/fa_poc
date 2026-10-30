import {
  DEMO_NETWORK_INVITE, MY_NETWORK_ID, buildChannelInvite, filterConversations, findConversation, getMessages,
  humanStatus, isLocalConversation, listClock, listFilters, networkById, rowMeta, searchAll,
} from './model.js';

const ICON_PATHS = {
  compose: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  send: '<path d="M5 12h13"/><path d="M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H6"/><path d="M11 6l-6 6 6 6"/>',
  apps: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  chats: '<path d="M4 5h16v11H9l-5 4z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  chevron: '<path d="M7 10l5 5 5-5"/>',
  dot: '<circle cx="12" cy="12" r="6" fill="currentColor"/>',
};

export function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name] ?? ''}</svg>`;
}

const SECTION_LABELS = {
  chats: 'Chats', activity: 'Activity', inbox: 'Inbox', directory: 'Directory',
  agents: 'Agents', apps: 'Apps', more: 'More', networks: 'Networks',
};

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const selected = (condition) => condition ? ' selected' : '';
const active = (condition) => condition ? ' active' : '';
const current = (condition) => condition ? ' aria-current="page"' : '';
const checked = (condition) => condition ? ' checked' : '';

function networkName(data, id) {
  return networkById(data, id)?.name ?? 'Unknown network';
}

function conversationTitle(found) {
  if (!found) return 'Nothing selected';
  return found.kind === 'channel' ? `#${found.item.name}` : found.item.name ?? found.item.title;
}

function conversationNetwork(found) {
  return found?.kind === 'quick' ? MY_NETWORK_ID : found?.item.networkId;
}

function eventById(data, id) {
  return data.events.find((event) => event.id === id);
}

function appById(data, id) {
  return data.apps.find((app) => app.id === id);
}

function statusLabel(status) {
  return ({ needs: 'Needs you', failed: 'Failed', running: 'Running', unread: 'Unread', done: 'Done', later: 'Later' })[status] ?? status;
}

export function appContextLabel(state, data) {
  const context = state.appPanel?.context;
  if (!context) return 'No context';
  if (context.kind === 'network') return networkName(data, context.id);
  const found = findConversation(data, context.id);
  return found ? `${conversationTitle(found)} · ${networkName(data, conversationNetwork(found))}` : 'Missing context';
}

function primarySections(state) {
  return state.variant === 'a' ? ['chats', 'activity', 'apps'] : ['inbox', 'chats', 'agents', 'apps'];
}

function sectionButtons(state) {
  return primarySections(state).map((section) => `<button type="button" class="${active(state.section === section)}" data-action="nav-root" data-section="${section}"${current(state.section === section)}>${SECTION_LABELS[section]}</button>`).join('');
}

function sidebarTitle(state) {
  if (state.variant === 'a' && state.section === 'directory') return 'Networks';
  return SECTION_LABELS[state.section] ?? 'Fa';
}

function renderSidebar(state, data) {
  return `<aside class="sidebar" aria-label="${sidebarTitle(state)} list">
    <div class="sidebar-head">
      <button type="button" class="profile-button" data-action="settings" aria-label="Profile and settings" title="Profile and settings">Fa</button>
      <h1 class="sidebar-title">${sidebarTitle(state)}</h1>
      <button type="button" class="search-field" data-action="command" aria-label="Search everything" title="Search everything (Cmd/Ctrl K)">${icon('search')}<span>Search</span><kbd>⌘K</kbd></button>
      <button type="button" class="new-button" data-action="chat-create-menu" aria-label="New chat, agent, channel or network" title="New">${icon('compose')}<span>New</span></button>
    </div>
    <nav class="section-tabs" aria-label="Product sections">${sectionButtons(state)}</nav>
    ${renderList(state, data)}
  </aside>`;
}

function renderList(state, data) {
  if (state.section === 'chats') return renderConversationList(state, data);
  if (state.section === 'activity' || state.section === 'inbox') return renderEventList(state, data);
  if (state.section === 'directory' || state.section === 'agents') return renderDirectoryList(state, data);
  if (state.section === 'apps') return renderAppList(state, data);
  return renderMoreList(state);
}

function renderFilterChips(state, data) {
  const { chips, network } = listFilters(data, { filter: state.listFilter ?? 'all', folder: state.folder });
  return `<div class="filter-chips" role="toolbar" aria-label="Filter chats">
    ${chips.map((chip) => `<button type="button" class="chip" data-action="list-filter" data-filter="${chip.id}" aria-pressed="${chip.active}">${chip.label}</button>`).join('')}
    ${network ? `<button type="button" class="chip network-chip" data-action="network-filter" aria-haspopup="dialog" aria-label="Network filter: ${esc(network.label)}">${esc(network.label)}${icon('chevron', 'icon chevron')}</button>` : ''}
  </div>`;
}

function renderConversationList(state, data) {
  const filter = state.listFilter ?? 'all';
  const sections = filterConversations(data, { filter, folder: state.folder });
  const now = listClock(data);
  const count = sections.reduce((sum, section) => sum + section.items.length, 0);
  const addAgentRow = filter === 'agents'
    ? `<div class="list-item add-row"><button type="button" class="item-open" data-action="new-agent"><span class="avatar">${icon('plus')}</span><span class="item-copy"><span class="item-title">Add agent</span><span class="item-preview">Joins My Network automatically</span></span></button></div>`
    : '';
  const firstRun = filter === 'all' && !count && state.folder === 'all';
  const emptyText = { all: 'No conversations in this network.', unread: 'No unread conversations.', agents: 'No agents yet.', channels: 'No channels in this network.' }[filter];
  return `${renderFilterChips(state, data)}
    <div class="list-scroll" data-testid="conversation-list">
      ${firstRun ? `<div class="empty-state first-run-empty"><span class="empty-symbol">${icon('chats')}</span><h2>No chats yet</h2><p>Start a local Quick chat or add your first persistent agent. It will join My Network automatically.</p><div class="empty-actions"><button type="button" class="primary" data-action="new-chat">Start a chat</button><button type="button" data-action="new-agent">Add agent</button></div></div>` : `${addAgentRow}${sections.map((section) => `<div class="list-section">${section.label}</div>${section.items.map((found) => renderConversationRow(state, data, found, now)).join('')}`).join('') || `<div class="empty-state">${emptyText}</div>`}`}
      ${filter === 'all' && count ? `<div class="list-footer"><button type="button" class="link" data-action="list-filter" data-filter="agents">Browse all ${data.agents.length} agents and ${data.channels.length} channels</button></div>` : ''}
    </div>`;
}

function renderConversationRow(state, data, found, now = listClock(data)) {
  const { item } = found;
  const meta = rowMeta(data, found, now);
  const tags = [
    meta.networkTag ? `<span class="row-tag">${esc(meta.networkTag)}</span>` : '',
    meta.taskTag ? '<span class="row-tag">task</span>' : '',
    meta.archived ? '<span class="row-tag">archived</span>' : '',
  ].join('');
  return `<div class="list-item conversation-row${selected(state.selectedId === item.id && state.section === 'chats')}">
    <button type="button" class="item-open" data-action="open-conversation" data-id="${esc(item.id)}">
      <span class="avatar${meta.kind === 'channel' ? ' square' : ''}">${esc(meta.avatar)}${meta.working ? `<span class="presence" title="Working">${icon('dot', 'icon dot')}</span>` : ''}</span>
      <span class="item-copy">
        <span class="item-title-line"><span class="item-title">${esc(meta.title)}</span>${tags}<span class="item-time">${esc(meta.time)}</span></span>
        <span class="item-preview-line"><span class="item-preview">${meta.working ? 'Working… · ' : ''}${esc(meta.preview)}</span>${meta.unread ? `<span class="unread-badge" aria-label="${meta.unread} unread">${meta.unread}</span>` : ''}</span>
      </span>
    </button>
  </div>`;
}

function filteredEvents(state, data) {
  return data.events.filter((event) => {
    if (state.activityFilter === 'all') return true;
    if (state.activityFilter === 'needs') return event.status === 'needs' || event.status === 'failed';
    return event.status === state.activityFilter;
  });
}

function renderEventList(state, data) {
  const events = filteredEvents(state, data);
  const groups = [
    ['Needs you', events.filter((event) => event.status === 'needs' || event.status === 'failed')],
    ['Running', events.filter((event) => event.status === 'running')],
    ['Unread', events.filter((event) => event.status === 'unread')],
    ['Results', events.filter((event) => event.status === 'done')],
    ['Later', events.filter((event) => event.status === 'later')],
  ];
  return `<div class="list-tools">
      <select data-change="activity-filter" aria-label="Activity filter">
        ${[['all', 'All activity'], ['needs', 'Needs you'], ['running', 'Running'], ['unread', 'Unread'], ['done', 'Results'], ['later', 'Later']].map(([value, label]) => `<option value="${value}"${selected(state.activityFilter === value)}>${label}</option>`).join('')}
      </select>
      <span class="count-label">${events.length}</span>
    </div>
    <div class="list-scroll" data-testid="event-list">
      ${events.length ? '' : state.emptyPreview ? '<div class="empty-state first-run-empty"><span class="empty-symbol">✓</span><h2>All caught up</h2><p>No approvals, running tasks or unread results. New agent activity will appear here.</p><button type="button" data-action="nav-root" data-section="chats">Open chats</button></div>' : '<div class="empty-state">Nothing here. This filter is clear.</div>'}
      ${groups.filter(([, items]) => items.length).map(([label, items]) => `<section><div class="list-section">${label}</div>${items.map((event) => renderEventRow(state, data, event)).join('')}</section>`).join('')}
    </div>`;
}

function renderEventRow(state, data, event) {
  const quickAction = event.status === 'needs'
    ? `<button type="button" class="small" data-action="approve-event" data-id="${event.id}">Approve</button>`
    : event.status === 'failed'
      ? `<button type="button" class="small" data-action="retry-event" data-id="${event.id}">Retry</button>`
      : event.status === 'running'
        ? `<button type="button" class="small" data-action="complete-task" data-id="${event.id}">Finish</button>`
        : event.status === 'unread'
          ? `<button type="button" class="small" data-action="mark-event-read" data-id="${event.id}">Read</button>`
          : '';
  return `<div class="list-item event-item${selected(state.selectedEventId === event.id && (state.section === 'activity' || state.section === 'inbox'))}">
    <button type="button" class="item-open" data-action="open-event" data-id="${event.id}">
      <span class="item-kind">${event.status === 'failed' ? '!' : event.status === 'done' ? '✓' : '●'}</span>
      <span class="item-copy">
        <span class="item-title-line"><span class="item-title">${esc(event.title)}</span></span>
        <span class="item-preview">${esc(event.summary)}</span>
        <span class="item-meta">${esc(networkName(data, event.networkId))} · ${esc(event.time)} · ${statusLabel(event.status)}</span>
      </span>
      ${event.unread ? '<span class="item-badge">●</span>' : ''}
    </button>
    ${quickAction ? `<div class="row-actions">${quickAction}</div>` : ''}
  </div>`;
}

function renderDirectoryList(state, data) {
  const tab = state.section === 'agents' ? 'agents' : state.variant === 'a' ? 'networks' : state.directoryTab;
  const query = state.directoryQuery.toLocaleLowerCase();
  const network = state.directoryNetwork;
  let rows = '';
  let count = 0;
  if (tab === 'agents') {
    const agents = data.agents.filter((agent) => (network === 'all' || agent.networkId === network) && `${agent.name} ${agent.purpose}`.toLocaleLowerCase().includes(query));
    count = agents.length;
    rows = agents.map((agent) => renderConversationRow(state, data, { kind: 'agent', item: agent })).join('');
  } else if (tab === 'channels') {
    const channels = data.channels.filter((channel) => (network === 'all' || channel.networkId === network) && `${channel.name} ${channel.purpose}`.toLocaleLowerCase().includes(query));
    count = channels.length;
    rows = channels.map((channel) => renderConversationRow(state, data, { kind: 'channel', item: channel })).join('');
  } else {
    const networks = data.networks.filter((item) => item.name.toLocaleLowerCase().includes(query));
    count = networks.length;
    rows = networks.map((item) => {
      const agentCount = data.agents.filter((agent) => agent.networkId === item.id).length;
      const channelCount = data.channels.filter((channel) => channel.networkId === item.id).length;
      return `<div class="list-item${selected(state.selectedNetworkId === item.id)}"><button type="button" class="item-open" data-action="open-network" data-id="${item.id}"><span class="item-kind">N</span><span class="item-copy"><span class="item-title">${esc(item.name)}</span><span class="item-preview">${agentCount} agents · ${channelCount} channels</span><span class="item-meta">${item.id === MY_NETWORK_ID ? 'Default home for new agents' : 'Additional network'}</span></span></button></div>`;
    }).join('');
  }
  return `<div class="list-tools">
      ${state.section === 'directory' && state.variant === 'a' ? '<button type="button" class="small" data-action="nav-root" data-section="chats">← Chats</button><span class="count-label">Networks you belong to</span><button type="button" class="small" data-action="networks">Create / Join</button>' : state.section === 'directory' ? `<div class="section-tabs" style="flex:1">${['agents', 'channels', 'networks'].map((item) => `<button type="button" class="${active(tab === item)}" data-action="directory-tab" data-tab="${item}">${item[0].toUpperCase() + item.slice(1)}</button>`).join('')}</div>` : '<span class="count-label">Persistent agents</span>'}
    </div>
    <div class="list-tools">
      <form data-form="directory-search"><input name="query" value="${esc(state.directoryQuery)}" placeholder="Search directory" aria-label="Search directory"><button type="submit" class="small">Go</button></form>
    </div>
    ${tab === 'networks' ? '' : `<div class="list-tools">
      <select data-change="directory-network" aria-label="Network filter"><option value="all">All networks</option>${data.networks.map((item) => `<option value="${item.id}"${selected(network === item.id)}>${esc(item.name)}</option>`).join('')}</select>
      <span class="count-label">${count}</span>
    </div>`}
    <div class="list-scroll" data-testid="directory-list">${rows || '<div class="empty-state">No directory results.</div>'}</div>`;
}

function filteredApps(state, data) {
  const query = (state.appQuery ?? '').trim().toLocaleLowerCase();
  return data.apps.filter((app) => {
    const inFilter = state.appFilter === 'all' || (state.appFilter === 'favorites' && app.favorite) || (state.appFilter === 'recent' && app.recent) || (state.appFilter === 'running' && app.running);
    return inFilter && (!query || `${app.name} ${app.description}`.toLocaleLowerCase().includes(query));
  });
}

function renderAppTabs(state) {
  const tab = state.appsTab ?? 'my';
  return `<nav class="apps-tabs" aria-label="Apps sections">${[['my', 'My Apps'], ['boards', 'My Boards'], ['store', 'Widget Store']].map(([value, label]) => `<button type="button" class="${active(tab === value)}" data-action="apps-tab" data-tab="${value}">${label}</button>`).join('')}</nav>`;
}

function renderAppTiles(apps) {
  return `<div class="app-launcher-grid">${apps.map((app) => `<button type="button" class="app-tile" data-action="open-app" data-id="${app.id}"><span class="app-tile-icon">${esc(app.name.slice(0, 1))}</span><span class="app-tile-name">${esc(app.name)}</span><span class="app-tile-meta">${app.running ? 'Running' : app.favorite ? 'Favorite' : 'Installed'}</span></button>`).join('') || '<div class="empty-state">No installed apps match this search.</div>'}</div>`;
}

function renderBoardCards(data) {
  if (!data.boards.length) return `<div class="empty-state first-run-empty"><span class="empty-symbol">▦</span><h2>No boards yet</h2><p>Create a personal layout and add widgets from My Apps or Widget Store.</p><button type="button" class="primary" data-action="new-board">Create your first board</button></div>`;
  return `<div class="board-grid">${data.boards.map((board) => `<button type="button" class="board-card" data-action="open-board" data-id="${board.id}"><span class="board-card-icon">▦</span><strong>${esc(board.name)}</strong><span>${esc(board.description)}</span><small>${board.appIds.length} widgets · Open board</small></button>`).join('')}</div>`;
}

function renderStore(state, data) {
  const query = (state.appQuery ?? '').trim().toLocaleLowerCase();
  const widgets = data.widgetCatalog.filter((widget) => !query || `${widget.name} ${widget.description} ${widget.category}`.toLocaleLowerCase().includes(query));
  return `<div class="store-grid">${widgets.map((widget) => {
    const installed = data.apps.find((app) => app.catalogId === widget.id);
    return `<article class="store-card"><span class="app-tile-icon">${esc(widget.name.slice(0, 1))}</span><div><strong>${esc(widget.name)}</strong><p>${esc(widget.description)}</p><small>${esc(widget.category)}</small></div><button type="button" class="small" data-action="${installed ? 'open-app' : 'install-widget'}" data-id="${installed?.id ?? widget.id}">${installed ? 'Open' : 'Add'}</button></article>`;
  }).join('') || '<div class="empty-state">No store widgets match this search.</div>'}</div>`;
}

function renderAppLauncherContent(state, data) {
  const tab = state.appsTab ?? 'my';
  if (tab === 'boards') return `<section class="apps-section"><div class="section-heading"><div><strong>My Boards</strong><p>Your widget layouts, separate from the catalog.</p></div><button type="button" class="small" data-action="new-board">+ New board</button></div>${renderBoardCards(data)}</section>`;
  if (tab === 'store') return `<section class="apps-section"><div class="section-heading"><div><strong>Widget Store</strong><p>Browse and install widgets into My Apps.</p></div></div>${renderStore(state, data)}</section>`;
  const apps = filteredApps(state, data);
  const running = data.apps.find((app) => app.running);
  const empty = data.apps.length === 0
    ? `<div class="empty-state first-run-empty"><span class="empty-symbol">□</span><h2>No apps yet</h2><p>Create a custom app or install your first widget from the store.</p><div class="empty-actions"><button type="button" class="primary" data-action="new-app">New app</button><button type="button" data-action="apps-tab" data-tab="store">Browse Widget Store</button></div></div>`
    : renderAppTiles(apps);
  return `<section class="apps-section"><div class="section-heading"><div><strong>My Apps</strong><p>Installed apps and running widgets.</p></div><button type="button" class="small" data-action="new-app">+ New app</button></div>${running ? `<button type="button" class="running-widget" data-action="open-app" data-id="${running.id}"><span><strong>${esc(running.name)}</strong><small>Running in the background</small></span><span class="status-line">Open widget</span></button>` : ''}${empty}</section>`;
}

function renderAppList(state, data) {
  const tab = state.appsTab ?? 'my';
  return `<div class="list-tools"><form data-form="app-search"><input name="query" value="${esc(state.appQuery ?? '')}" placeholder="Search apps and widgets…" aria-label="Search apps"><button type="submit" class="small">Go</button></form></div>
    <div class="app-nav-desktop list-scroll"><div class="list-section">Apps</div>${[['my', 'My Apps', `${data.apps.length} installed`], ['boards', 'My Boards', `${data.boards.length} personal boards`], ['store', 'Widget Store', `${data.widgetCatalog.length} available widgets`]].map(([value, label, meta]) => `<div class="list-item${selected(tab === value && state.appFilter !== 'running')}"><button type="button" class="item-open" data-action="apps-tab" data-tab="${value}"><span class="item-kind">${value === 'my' ? 'A' : value === 'boards' ? 'B' : 'W'}</span><span class="item-copy"><span class="item-title">${label}</span><span class="item-preview">${meta}</span></span></button></div>`).join('')}<div class="list-section">Activity</div><div class="list-item${selected(state.appFilter === 'running')}"><button type="button" class="item-open" data-action="apps-running"><span class="item-kind">●</span><span class="item-copy"><span class="item-title">Running</span><span class="item-preview">${data.apps.filter((app) => app.running).length} active widgets</span></span></button></div></div>
    <div class="app-launcher-mobile">${renderAppTabs(state)}<div class="list-scroll">${renderAppLauncherContent(state, data)}</div></div>`;
}

function renderMoreList(state) {
  const rows = [
    ['D', 'Directory', 'Agents, channels and networks', 'open-directory', ''],
    ['N', 'Networks', 'My Network and five additional networks', 'open-networks', ''],
    ['A', 'Activity', 'Approvals, running tasks and results', 'open-activity', ''],
    ['?', 'UX notes', 'What this wireframe is testing', 'notes', ''],
    ['↺', 'Reset demo', 'Restore all generated data and preferences', 'reset-demo', ''],
  ];
  return `<div class="list-scroll"><div class="list-section">More</div>${rows.map(([symbol, title, preview, action, id]) => `<div class="list-item"><button type="button" class="item-open" data-action="${action}" data-id="${id}"><span class="item-kind">${symbol}</span><span class="item-copy"><span class="item-title">${title}</span><span class="item-preview">${preview}</span></span></button></div>`).join('')}</div>`;
}

function renderMain(state, data) {
  if (state.section === 'chats') return renderChat(state, data);
  if (state.section === 'activity' || state.section === 'inbox') return renderEventDetail(state, data);
  if (state.section === 'directory' || state.section === 'agents') {
    return state.selectedNetworkId ? renderNetworkDetail(state, data) : renderDirectoryOverview(state, data);
  }
  if (state.section === 'apps') return renderAppsOverview(state, data);
  return renderMoreOverview(state);
}

function headerBack() {
  return `<button type="button" class="mobile-back icon-button" data-action="back-list" aria-label="Back to list">${icon('back')}</button>`;
}

function renderChat(state, data) {
  const found = findConversation(data, state.selectedId);
  if (!found) return `<main class="main">${renderEmpty(state, 'Choose a conversation')}</main>`;
  const { kind, item } = found;
  const title = conversationTitle(found);
  const messages = getMessages(data, item.id);
  const runningEvent = kind === 'channel' ? data.events.find((event) => event.channelId === item.id && event.status === 'running') : null;
  const meta = rowMeta(data, found);
  const subtitle = humanStatus(data, found);
  const supportsModel = isLocalConversation(found);
  const currentModel = item.model ?? 'Auto';
  const modelControl = supportsModel ? `<button type="button" class="model-trigger" data-action="model-picker" data-id="${item.id}" title="Change model" aria-label="Model: ${esc(currentModel)}">${esc(currentModel)}</button>` : '';
  return `<main class="main">
    <header class="content-head">
      ${headerBack()}
      <span class="avatar${kind === 'channel' ? ' square' : ''}">${esc(meta.avatar)}${meta.working ? `<span class="presence">${icon('dot', 'icon dot')}</span>` : ''}</span>
      <div class="title-block"><h1>${esc(title)}</h1><div class="subtitle">${esc(subtitle)}</div></div>
      <div class="head-actions">
        ${runningEvent ? `<button type="button" class="small desktop-optional" data-action="complete-task" data-id="${runningEvent.id}">Finish task</button>` : ''}
        <button type="button" class="icon-button" data-action="conversation-details" data-id="${item.id}" aria-label="Details" title="Details">${icon('info')}</button>
      </div>
    </header>
    ${item.archived ? '<div class="notice">Archived · history is retained and searchable</div>' : ''}
    <div class="messages" data-testid="messages">
      ${messages.map((message, index) => `${kind === 'agent' && index === 2 ? '<div class="topic-marker">Earlier topic</div>' : ''}${renderMessage(item, kind, message)}`).join('')}
    </div>
    ${item.archived
      ? '<div class="archived-composer">Read-only archive. Restore or link it from Details.</div>'
      : `<div class="composer-zone"><div class="command-tips" data-testid="command-tips" hidden>${supportsModel ? '<button type="button" data-action="chat-command" data-command="model"><strong>/model</strong><span>Change this agent\'s model</span></button>' : ''}<button type="button" data-action="chat-command" data-command="apps"><strong>/apps</strong><span>Open the app launcher</span></button><button type="button" data-action="chat-command" data-command="new"><strong>/new</strong><span>Compose another chat</span></button></div><div class="composer-chips" aria-label="Quick composer actions">${supportsModel ? `<button type="button" data-action="chat-command" data-command="model">Model: ${esc(currentModel)}</button>` : ''}<button type="button" data-action="chat-command" data-command="apps">Apps</button></div><form class="composer" data-form="send-message" data-id="${item.id}"><button type="button" class="icon-button attach" data-action="quick-apps" aria-label="Attach files or open apps" title="Attach · Apps, Files">${icon('plus')}</button><input name="message" data-chat-input autocomplete="off" placeholder="Message ${esc(title)}" aria-label="Message ${esc(title)}" required>${modelControl}<button type="submit" class="primary send" aria-label="Send">${icon('send')}<span>Send</span></button></form></div>`}
  </main>`;
}

function renderMessage(item, kind, message) {
  if (message.from === 'system') return `<div class="message system">${esc(message.text)}</div>`;
  const from = message.from === 'user' ? 'You' : kind === 'channel' ? item.creatorName : item.name ?? 'Quick agent';
  const showFrom = kind === 'channel' && message.from !== 'user';
  return `<div class="message ${message.from === 'user' ? 'user' : 'agent'}">${showFrom ? `<div class="message-from">${esc(from)}</div>` : `<span class="sr-only">${esc(from)}: </span>`}<div class="message-text">${esc(message.text)}</div></div>`;
}

function renderEventDetail(state, data) {
  const event = eventById(data, state.selectedEventId);
  if (!event) return `<main class="main">${renderEmpty(state, 'Choose an activity item')}</main>`;
  const source = event.sourceId ? findConversation(data, event.sourceId) : null;
  const app = event.appId ? appById(data, event.appId) : null;
  return `<main class="main">
    <header class="content-head">${headerBack()}<div class="title-block"><h1>${esc(event.title)}</h1><div class="subtitle">${esc(networkName(data, event.networkId))} · ${statusLabel(event.status)}</div></div><span class="status-line">${statusLabel(event.status)}</span></header>
    <div class="content-scroll"><div class="content-narrow">
      <h2>${esc(event.title)}</h2><p>${esc(event.summary)}</p>
      <div class="detail-grid"><div class="detail-cell"><div class="label">Status</div><div class="value">${statusLabel(event.status)}</div></div><div class="detail-cell"><div class="label">Network</div><div class="value">${esc(networkName(data, event.networkId))}</div></div><div class="detail-cell"><div class="label">Type</div><div class="value">${esc(event.type)}</div></div><div class="detail-cell"><div class="label">Time</div><div class="value">${esc(event.time)}</div></div></div>
      ${event.pendingInvite ? '<div class="wire-panel dashed">No membership or network access changes until this request is explicitly approved.</div>' : ''}
      <div class="action-row">
        ${event.status === 'needs' ? `<button type="button" class="primary" data-action="approve-event" data-id="${event.id}">Approve</button><button type="button" data-action="decline-event" data-id="${event.id}">Later</button>` : ''}
        ${event.status === 'failed' ? `<button type="button" class="primary" data-action="retry-event" data-id="${event.id}">Retry</button>` : ''}
        ${event.status === 'running' ? `<button type="button" class="primary" data-action="complete-task" data-id="${event.id}">${event.type === 'task' ? 'Complete task' : 'Mark finished'}</button>` : ''}
        ${event.status === 'unread' ? `<button type="button" data-action="mark-event-read" data-id="${event.id}">Mark read</button>` : ''}
        ${source ? `<button type="button" data-action="open-source" data-id="${event.id}">Open source</button>` : ''}
        ${event.channelId && event.sourceId !== event.channelId ? `<button type="button" data-action="open-event-channel" data-id="${event.id}">Open task channel</button>` : ''}
        ${app ? `<button type="button" data-action="open-app" data-id="${app.id}">Open ${esc(app.name)}</button>` : ''}
      </div>
      <div class="wire-panel"><strong>Why this is in ${state.variant === 'c' ? 'Inbox' : 'Activity'}</strong><p class="help">The user can react to the event, open its source or let background work continue without browsing every agent and channel.</p></div>
    </div></div>
  </main>`;
}

function renderDirectoryOverview(state, data) {
  if (state.variant === 'a') {
    return `<main class="main"><header class="content-head">${headerBack()}<div class="title-block"><h1>Networks</h1><div class="subtitle">${data.networks.length} networks</div></div></header><div class="content-scroll"><div class="content-narrow"><h2>Manage networks</h2><p>My Network is the default home of every new agent. Other networks are created or joined explicitly; cross-network access always needs approval.</p><div class="action-row"><button type="button" class="primary" data-action="new-network">Create a network</button><button type="button" data-action="join-network">Join a network</button><button type="button" data-action="new-agent">Add agent → My Network</button></div><div class="wire-panel dashed">Agents and channels are browsed in Chats with the Agents and Channels filters.</div></div></div></main>`;
  }
  return `<main class="main"><header class="content-head"><div class="title-block"><h1>Directory</h1><div class="subtitle">Full inventory without putting every row into Chats</div></div></header><div class="content-scroll"><div class="content-narrow"><h2>${data.agents.length} agents · ${data.channels.length} channels · ${data.networks.length} networks</h2><p>Search or filter the list. Opening an agent or channel takes you to the same endless conversation, not a new session.</p><div class="action-row"><button type="button" class="primary" data-action="new-agent">Add agent → My Network</button><button type="button" data-action="new-channel">Group agents / Create channel</button><button type="button" data-action="command">Search everything</button></div><div class="wire-panel dashed">My Network is the default home of every new persistent agent. Other networks are joined explicitly.</div></div></div></main>`;
}

function renderNetworkDetail(state, data) {
  const network = networkById(data, state.selectedNetworkId);
  if (!network) return `<main class="main">${renderEmpty(state, 'Network not found')}</main>`;
  const agents = data.agents.filter((agent) => agent.networkId === network.id);
  const channels = data.channels.filter((channel) => channel.networkId === network.id);
  return `<main class="main"><header class="content-head">${headerBack()}<div class="title-block"><h1>${esc(network.name)}</h1><div class="subtitle">${agents.length} agents · ${channels.length} channels</div></div><button type="button" class="small" data-action="new-channel" data-network-id="${network.id}">+ Channel</button></header><div class="content-scroll"><div class="content-narrow">${network.id === MY_NETWORK_ID ? '<div class="notice">Default home · every new persistent agent joins automatically</div>' : '<div class="notice">Additional network · membership and access are explicit</div>'}<div class="action-row"><button type="button" class="primary" data-action="new-agent">Add agent → My Network</button><button type="button" data-action="new-channel" data-network-id="${network.id}">Create channel</button></div><h3>Members</h3><div class="wire-panel">${agents.slice(0, 8).map((agent) => `<div class="wire-row"><button type="button" class="link" data-action="open-conversation" data-id="${agent.id}">${esc(agent.name)}</button><span class="muted">${agent.status}</span></div>`).join('')}${agents.length > 8 ? `<div class="help">${agents.length - 8} more in Directory</div>` : ''}</div><h3>Channels</h3><div class="wire-panel">${channels.slice(0, 8).map((channel) => `<div class="wire-row"><button type="button" class="link" data-action="open-conversation" data-id="${channel.id}">#${esc(channel.name)}</button><span class="muted">${channel.creatorType === 'agent' ? `by ${esc(channel.creatorName)}` : 'user'}${channel.archived ? ' · archived' : ''}</span></div>`).join('')}</div></div></div></main>`;
}

function renderAppsOverview(state, data) {
  return `<main class="main"><header class="content-head">${headerBack()}<div class="title-block"><h1>Apps</h1><div class="subtitle">My Apps · My Boards · Widget Store</div></div><button type="button" class="small" data-action="quick-apps">Quick open</button></header><div class="content-scroll"><div class="content-narrow app-launcher-main">${renderAppTabs(state)}${renderAppLauncherContent(state, data)}<div class="wire-panel dashed">Installed apps, personal boards and the store are separate. App context changes only explicitly.</div></div></div></main>`;
}

function renderMoreOverview(state) {
  return `<main class="main"><header class="content-head"><div class="title-block"><h1>${state.variant === 'a' ? 'A · Fa Messenger' : 'C · Fa Pulse'}</h1><div class="subtitle">Clickable UX wireframe</div></div></header><div class="content-scroll"><div class="content-narrow"><h2>${state.variant === 'a' ? 'Conversation-first' : 'Activity-first'}</h2><p>${state.variant === 'a' ? 'Chats is the default. Agents, quick chats and channels share one messenger-like list.' : 'Inbox is the default. It surfaces work that needs attention while agents and channels remain searchable.'}</p><div class="action-row"><button type="button" data-action="notes">UX notes</button><button type="button" data-action="reset-demo">Reset demo</button></div></div></div></main>`;
}

function renderEmpty(state, title) {
  if (state.emptyPreview) {
    const activity = state.section === 'inbox' || state.section === 'activity';
    return `${headerBack()}<div class="empty-state first-run-empty"><span class="empty-symbol">${activity ? '✓' : '↗'}</span><h1>${activity ? 'All caught up' : 'Start your first conversation'}</h1><p>${activity ? 'Approvals, task results and unread activity will appear here.' : 'A Quick chat stays lightweight. A persistent agent keeps one endless conversation and joins My Network automatically.'}</p><div class="empty-actions">${activity ? '<button type="button" class="primary" data-action="nav-root" data-section="chats">Open chats</button>' : '<button type="button" class="primary" data-action="new-chat">New chat</button><button type="button" data-action="new-agent">Add agent</button>'}</div></div>`;
  }
  return `${headerBack()}<div class="empty-state"><h1>${esc(title)}</h1><p>Use Search or quick actions to start.</p><div class="empty-actions"><button type="button" data-action="new-chat">New chat</button><button type="button" data-action="new-agent">Add agent</button></div></div>`;
}

function renderAppSurface(state, data, overlay = false) {
  const app = appById(data, state.appPanel?.appId);
  if (!app) return '';
  return `<section class="${overlay ? 'app-overlay' : 'app-panel'}" aria-label="${esc(app.name)} app">
    <header class="app-head"><div class="title-block"><h1>${esc(app.name)}</h1><div class="subtitle">${app.running ? 'Running app' : 'App'} · independent surface</div></div><div class="head-actions">${overlay ? '<button type="button" data-action="exit-fullscreen">Exit full</button>' : '<button type="button" data-action="fullscreen-app">Full</button>'}<button type="button" data-action="pin-app" aria-pressed="${state.appPanel.pinned}">${state.appPanel.pinned ? 'Unpin' : 'Pin'}</button><button type="button" data-action="close-app">Close</button></div></header>
    <div class="app-context"><span class="muted">Context</span><button type="button" data-action="app-context">${esc(appContextLabel(state, data))} · Change</button></div>
    <div class="app-content">${renderAppContent(state, data, app)}</div>
    <div class="app-footer">No silent context switch when the conversation changes.</div>
  </section>`;
}

function renderAppContent(state, data, app) {
  if (app.id === 'app:files') return `<div class="wire-panel"><input placeholder="Search files" aria-label="Search files"><div class="wire-row"><span>release-notes.md</span><button type="button" class="small" data-action="demo-action" data-message="File attached to the current app context">Use</button></div><div class="wire-row"><span>release-2.60.pdf</span><button type="button" class="small" data-action="demo-action" data-message="File attached to the current app context">Use</button></div><div class="wire-row"><span>metrics.csv</span><button type="button" class="small" data-action="demo-action" data-message="File attached to the current app context">Use</button></div></div>`;
  if (app.id === 'app:mail') return `<div class="wire-panel"><div class="wire-row"><span><strong>Security digest</strong><br><span class="muted">5 important threads</span></span><button type="button" class="small" data-action="demo-action" data-message="Digest opened">Open</button></div><div class="wire-row"><span><strong>GitHub notifications</strong><br><span class="muted">12 messages</span></span><button type="button" class="small" data-action="demo-action" data-message="Digest opened">Open</button></div></div>`;
  if (app.id === 'app:export') return `<div class="wire-panel"><strong>Presentation export</strong><p class="help">The export can finish in the background and return to Inbox.</p><div class="progress"><span style="width:68%"></span></div><p class="help">68% · running</p><button type="button" data-action="complete-task" data-id="event:app-export">Mark export finished</button></div>`;
  if (app.id === 'app:analytics') return `<div class="wire-panel"><div class="wire-row"><span>Tasks completed</span><strong>42</strong></div><div class="wire-row"><span>Waiting for approval</span><strong>${data.events.filter((event) => event.status === 'needs').length}</strong></div><div class="wire-row"><span>Active task channels</span><strong>${data.channels.filter((channel) => channel.taskBound && !channel.archived).length}</strong></div></div>`;
  if (app.id === 'app:settings') return `<div class="wire-panel"><label class="check"><input type="checkbox" checked>Keep favorite Apps in quick actions</label><label class="check"><input type="checkbox" checked>Restore pinned panel on this device</label><label class="check"><input type="checkbox">Show low-priority network activity</label></div>`;
  return `<div class="wire-panel dashed" style="min-height:45%;display:grid;place-items:center">Preview surface<br><span class="muted">Generated content appears here</span></div><div class="action-row"><button type="button" data-action="demo-action" data-message="Preview refreshed">Refresh</button><button type="button" data-action="demo-action" data-message="Preview sent to agent">Send to agent</button></div>`;
}

function renderBottomNav(state) {
  const sections = state.variant === 'a'
    ? ['chats', 'activity', 'apps']
    : ['inbox', 'chats', 'apps', 'more'];
  return `<nav class="bottom-nav" aria-label="Mobile navigation">${sections.map((section) => `<button type="button" class="${active(state.section === section || (section === 'more' && ['directory', 'agents'].includes(state.section)) || (section === 'chats' && state.variant === 'a' && state.section === 'directory'))}" data-action="nav-root" data-section="${section}"${current(state.section === section)}>${SECTION_LABELS[section]}</button>`).join('')}</nav>`;
}

function renderQuickFab() {
  return `<button type="button" class="quick-fab" data-action="chat-create-menu" aria-label="New chat, agent, channel or network" title="New">${icon('compose')}</button>`;
}

function renderFoldSplitter() {
  return '<div class="fold-splitter" data-fold-splitter role="separator" aria-label="Resize chat list" aria-orientation="vertical"><span></span></div>';
}

const RAIL_ICONS = { chats: 'chats', inbox: 'activity', activity: 'activity', agents: 'chats', apps: 'apps' };

function renderFoldActionRail(state) {
  return `<aside class="fold-action-rail" aria-label="Navigation rail"><div class="rail-status"><strong>Fa</strong><span>online</span></div>${primarySections(state).map((section) => `<button type="button" class="${active(state.section === section)}" data-action="nav-root" data-section="${section}"${current(state.section === section)}>${icon(RAIL_ICONS[section])}<span>${SECTION_LABELS[section]}</span></button>`).join('')}<div class="rail-spacer"></div><button type="button" data-action="settings" aria-label="Profile and settings">${icon('settings')}<span>Settings</span></button><div class="rail-network">My<br>Network</div></aside>`;
}

function modalFrame(title, body, wide = false) {
  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="modal-head"><h2>${esc(title)}</h2><button type="button" class="small" data-action="close-modal" aria-label="Close">×</button></header><div class="modal-body">${body}</div></section></div>`;
}

function renderQuickActions() {
  const actions = [
    ['Q', 'New chat', 'Choose agents or start a local Quick chat', 'new-chat'],
    ['A', 'Add agent', 'Automatically joins My Network', 'new-agent'],
    ['#', 'Group agents / Create channel', 'Persistent team or task-bound group', 'new-channel'],
    ['N', 'Networks', 'Create a network or join with an invite', 'networks'],
  ];
  return actions.map(([symbol, title, help, action]) => `<div class="list-item"><button type="button" class="item-open" data-action="${action}"><span class="item-kind">${symbol}</span><span class="item-copy"><span class="item-title">${title}</span><span class="item-preview">${help}</span></span></button></div>`).join('');
}

export function renderCommandResults(state, data) {
  if (!state.commandQuery.trim()) return `<div class="list-section">Quick actions</div>${renderQuickActions()}`;
  const results = searchAll(data, state.commandQuery);
  if (!results.length) return '<div class="empty-state">No results. Try another name.</div>';
  return `<div class="list-section">${results.length} results</div>${results.map((result) => `<div class="list-item"><button type="button" class="item-open" data-action="command-open" data-type="${result.type}" data-id="${esc(result.id)}"><span class="item-kind">${result.type === 'channel' ? '#' : result.type === 'network' ? 'N' : result.type === 'app' ? '□' : result.type === 'quick' ? 'Q' : 'A'}</span><span class="item-copy"><span class="item-title">${esc(result.title)}</span><span class="item-preview">${esc(result.subtitle)}</span><span class="item-meta">${result.type}</span></span></button></div>`).join('')}`;
}

export function renderAgentSuggestions(state, data) {
  if (state.modal?.type !== 'new-chat') return '';
  const draft = state.modal.draft;
  const query = (state.modal.query ?? '').trim().toLocaleLowerCase();
  const matching = data.agents
    .filter((agent) => !draft.recipientIds.includes(agent.id))
    .filter((agent) => !query || `${agent.name} ${agent.purpose} ${networkName(data, agent.networkId)}`.toLocaleLowerCase().includes(query))
    .sort((left, right) => Number(right.networkId === MY_NETWORK_ID) - Number(left.networkId === MY_NETWORK_ID) || Number(right.recent) - Number(left.recent) || left.name.localeCompare(right.name));
  const candidates = query
    ? matching.slice(0, 12)
    : [...matching.filter((agent) => agent.networkId === MY_NETWORK_ID).slice(0, 7), ...matching.filter((agent) => agent.networkId !== MY_NETWORK_ID).slice(0, 5)];
  const groups = [
    ['My Network · local agents', candidates.filter((agent) => agent.networkId === MY_NETWORK_ID)],
    ['Network agents · mixed groups allowed', candidates.filter((agent) => agent.networkId !== MY_NETWORK_ID)],
  ];
  return groups.filter(([, agents]) => agents.length).map(([label, agents]) => `<div class="list-section">${label}</div>${agents.map((agent) => `<button type="button" class="recipient-option" data-action="toggle-recipient" data-id="${agent.id}"><span class="item-kind">A</span><span><strong>${esc(agent.name)}</strong><small>${esc(networkName(data, agent.networkId))} · ${esc(agent.status)}</small></span><span>+</span></button>`).join('')}`).join('') || '<div class="empty-state">No matching agents.</div>';
}

function renderNewChatModal(state, data) {
  const draft = state.modal.draft;
  const recipients = draft.recipientIds.map((id) => data.agents.find((agent) => agent.id === id)).filter(Boolean);
  const externalCount = recipients.filter((agent) => agent.networkId !== MY_NETWORK_ID && !agent.networkIds.includes(MY_NETWORK_ID)).length;
  const summary = recipients.length === 0
    ? 'No recipients → local Quick chat. It can become a persistent agent later.'
    : recipients.length === 1
      ? `Direct message → ${recipients[0].name}'s existing endless conversation.`
      : `New group in My Network · ${recipients.length} agents.`;
  const submitLabel = recipients.length === 0 ? 'Start Quick chat' : recipients.length === 1 ? 'Open direct chat' : 'Create group + send';
  return modalFrame('New chat', `<form data-form="new-chat" class="new-chat-form">
    <div class="recipient-chips" data-testid="recipient-chips">${recipients.map((agent) => `<button type="button" class="recipient-chip" data-action="toggle-recipient" data-id="${agent.id}" title="Remove ${esc(agent.name)}">${esc(agent.name)} <span>×</span></button>`).join('') || '<span class="muted">To: nobody yet · local Quick chat</span>'}</div>
    <label><span>To · choose local and network agents</span><input name="recipientSearch" data-agent-search value="${esc(state.modal.query ?? '')}" placeholder="Name, role or network" aria-label="Find an agent" autocomplete="off" autofocus></label>
    <div class="agent-suggestions" data-testid="agent-suggestions">${renderAgentSuggestions(state, data)}</div>
    ${recipients.length > 1 ? `<label><span>Group name · optional</span><input name="groupName" value="${esc(draft.groupName)}" placeholder="Release review"></label>` : ''}
    <label><span>First message</span><textarea name="message" required placeholder="Write to ${recipients.length ? 'the selected agent(s)' : 'a local quick agent'}…">${esc(draft.message)}</textarea></label>
    <div class="notice">${esc(summary)}</div>
    ${externalCount ? `<div class="wire-panel dashed"><strong>Mixed group · explicit scope</strong><p class="help">${externalCount} external agent(s) get access to this group only. They do not join My Network and see no other chats.</p></div>` : ''}
    <div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">${submitLabel}</button></div>
  </form>`, true);
}

function renderModal(state, data) {
  const modal = state.modal;
  if (!modal) return '';
  if (modal.type === 'quick-actions') return modalFrame('Quick actions', `<div class="modal-list">${renderQuickActions()}</div>`);
  if (modal.type === 'new-chat') return renderNewChatModal(state, data);
  if (modal.type === 'chat-create-menu') {
    return modalFrame('New', `<div class="modal-list"><button type="button" class="model-option" data-action="new-chat"><span><strong>New chat</strong><small>Compose to local or network agents</small></span><span>→</span></button><button type="button" class="model-option" data-action="new-agent"><span><strong>Add agent</strong><small>Persistent agent · joins My Network automatically</small></span><span>→</span></button><button type="button" class="model-option" data-action="new-channel"><span><strong>New channel</strong><small>Persistent team or task-bound group</small></span><span>→</span></button><button type="button" class="model-option" data-action="networks"><span><strong>Networks</strong><small>Create a network or join with an invite</small></span><span>→</span></button><button type="button" class="model-option" data-action="open-channels"><span><strong>Manage channels</strong><small>Search, open and inspect existing channels</small></span><span>→</span></button><button type="button" class="model-option" data-action="open-networks"><span><strong>Manage networks</strong><small>My Network and additional networks</small></span><span>→</span></button></div>`);
  }
  if (modal.type === 'networks') {
    return modalFrame('Networks', `<p class="help">Create your own space or join an existing one. Joining never changes the default My Network.</p><div class="modal-list"><button type="button" class="model-option" data-action="new-network"><span><strong>Create a network</strong><small>Start an empty space for your agents and channels</small></span><span>→</span></button><button type="button" class="model-option" data-action="join-network"><span><strong>Join a network</strong><small>Use an invite link or network code</small></span><span>→</span></button><button type="button" class="model-option" data-action="open-networks"><span><strong>My networks</strong><small>Open and manage existing memberships</small></span><span>→</span></button></div>`);
  }
  if (modal.type === 'join-network') {
    return modalFrame('Join a network', `<form data-form="join-network"><label><span>Invite link or network code</span><textarea name="invite" required autofocus>${esc(DEMO_NETWORK_INVITE)}</textarea></label><div class="notice">Wireframe demo: this invite joins Research Lab. No agents or channels are shared with your other networks.</div><p class="help">Real flow: paste the owner’s invite, review the network name and permissions, then confirm. Invalid or expired invites show an error without changing membership.</p><div class="modal-actions"><button type="button" data-action="networks">Back</button><button type="submit" class="primary">Join network</button></div></form>`);
  }
  if (modal.type === 'new-app') {
    return modalFrame('New app', `<form data-form="new-app"><label><span>App name</span><input name="name" required autofocus placeholder="Release Cockpit"></label><label><span>What is it for?</span><textarea name="description" placeholder="A custom operational app"></textarea></label><p class="help">Creates a custom app in My Apps. This is separate from installing an existing widget from Widget Store or creating a multi-widget board.</p><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Create app</button></div></form>`);
  }
  if (modal.type === 'invite-agent') return renderInviteAgentModal(state, data);
  if (modal.type === 'new-network') {
    return modalFrame('Create network', `<form data-form="new-network"><label><span>Network name</span><input name="name" required autofocus placeholder="Research Lab"></label><p class="help">Creates an empty network. Add agents and channels explicitly; My Network remains the default home for new agents.</p><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Create network</button></div></form>`);
  }
  if (modal.type === 'new-board') {
    return modalFrame('New board', `<form data-form="new-board"><label><span>Board name</span><input name="name" required autofocus placeholder="Morning dashboard"></label><p class="help">A board is your personal widget layout. It is separate from installing widgets in the store.</p><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Create board</button></div></form>`);
  }
  if (modal.type === 'board') {
    const board = data.boards.find((item) => item.id === modal.boardId);
    if (!board) return '';
    const apps = board.appIds.map((id) => appById(data, id)).filter(Boolean);
    return modalFrame(board.name, `<p class="help">${esc(board.description)} · ${apps.length} widgets</p>${apps.length ? renderAppTiles(apps) : '<div class="empty-state">Empty board. Add widgets from My Apps or the Widget Store.</div>'}<div class="modal-actions"><button type="button" data-action="board-store">Browse Widget Store</button><button type="button" class="primary" data-action="close-modal">Done</button></div>`, true);
  }
  if (modal.type === 'quick-apps') {
    const apps = data.apps.filter((app) => app.id !== 'app:files' && (app.favorite || app.recent || app.running));
    const files = appById(data, 'app:files');
    return modalFrame('Attach', `<div class="list-section">Files</div><div class="modal-list">${files ? `<div class="list-item"><button type="button" class="item-open" data-action="open-app" data-id="${files.id}"><span class="avatar square">${icon('file')}</span><span class="item-copy"><span class="item-title">Files</span><span class="item-preview">Browse files and hand them to the agent</span></span></button></div>` : '<div class="empty-state">No file source connected.</div>'}</div><div class="list-section">Apps</div><div class="modal-list">${apps.map((app) => `<div class="list-item"><button type="button" class="item-open" data-action="open-app" data-id="${app.id}"><span class="avatar square">${icon('apps')}</span><span class="item-copy"><span class="item-title">${esc(app.name)}</span><span class="item-preview">${app.running ? 'Running' : app.favorite ? 'Favorite' : 'Recent'} · ${esc(app.description)}</span></span></button></div>`).join('') || '<div class="empty-state">No apps yet.</div>'}</div><p class="help">Desktop: side panel with Pin and Fullscreen. Mobile: one fullscreen surface.</p><div class="modal-actions"><button type="button" data-action="nav-root" data-section="apps">All apps</button></div>`);
  }
  if (modal.type === 'network-filter') {
    const options = [{ id: 'all', name: 'All networks' }, ...data.networks];
    return modalFrame('Show chats from', `<div class="modal-list">${options.map((network) => `<button type="button" class="model-option" data-action="select-folder" data-id="${network.id}" aria-pressed="${state.folder === network.id}"><span><strong>${esc(network.name)}</strong><small>${network.id === 'all' ? 'Every network you belong to' : network.id === MY_NETWORK_ID ? 'Default home for new agents' : 'Additional network'}</small></span><span>${state.folder === network.id ? 'Selected' : ''}</span></button>`).join('')}</div><div class="modal-actions"><button type="button" data-action="open-networks">Manage networks</button></div>`);
  }
  if (modal.type === 'settings') {
    return modalFrame('Profile & settings', `<div class="modal-list"><button type="button" class="model-option" data-action="open-networks"><span><strong>Networks</strong><small>My Network and ${Math.max(data.networks.length - 1, 0)} additional · create, join, manage</small></span><span>→</span></button><button type="button" class="model-option" data-action="open-directory"><span><strong>All agents</strong><small>${data.agents.length} agents · Chats → Agents filter</small></span><span>→</span></button><button type="button" class="model-option" data-action="notes"><span><strong>UX notes</strong><small>What this wireframe is testing</small></span><span>→</span></button><button type="button" class="model-option" data-action="reset-demo"><span><strong>Reset demo</strong><small>Restore generated data and preferences</small></span><span>→</span></button></div>`);
  }
  if (modal.type === 'command') {
    return modalFrame('Search / Command', `<form data-form="command"><input class="command-input" data-command-input name="query" value="${esc(state.commandQuery)}" placeholder="Agent, channel, network, app or action" aria-label="Search everything" autofocus><div class="command-results" data-testid="command-results">${renderCommandResults(state, data)}</div></form>`, true);
  }
  if (modal.type === 'new-agent') {
    return modalFrame('Add persistent agent', `<form data-form="new-agent"><div class="notice">My Network membership is automatic. No network selection is needed.</div><label><span>Name</span><input name="name" required autofocus placeholder="e.g. Release Analyst"></label><label><span>Purpose</span><textarea name="purpose" placeholder="What is this agent good at?"></textarea></label><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Add to My Network</button></div></form>`);
  }
  if (modal.type === 'quick-chat') {
    return modalFrame('Start a quick chat', `<form data-form="quick-chat"><label><span>First message</span><textarea name="message" required autofocus placeholder="What do you want to discuss?"></textarea></label><p class="help">The title comes from this message. Convert to an agent or link to one later.</p><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Start quick chat</button></div></form>`);
  }
  if (modal.type === 'new-channel') return renderNewChannelModal(state, data);
  if (modal.type === 'new-task') return renderNewTaskModal(state, data);
  if (modal.type === 'conversation-details') return renderConversationDetailsModal(state, data);
  if (modal.type === 'link-agent') {
    const agents = data.agents.filter((agent) => agent.networkId === MY_NETWORK_ID);
    return modalFrame('Link quick chat to agent', `<div class="modal-list">${agents.map((agent) => `<div class="list-item"><button type="button" class="item-open" data-action="link-quick-to-agent" data-agent-id="${agent.id}" data-quick-id="${modal.quickId}"><span class="item-kind">A</span><span class="item-copy"><span class="item-title">${esc(agent.name)}</span><span class="item-preview">${esc(agent.purpose)}</span></span></button></div>`).join('')}</div>`, true);
  }
  if (modal.type === 'app-context') {
    const context = state.appPanel.context;
    const currentValue = `${context.kind}:${context.id}`;
    const conversations = [
      ...data.agents.filter((agent) => agent.recent).map((item) => ({ kind: 'agent', item })),
      ...data.channels.filter((channel) => channel.recent && !channel.archived).map((item) => ({ kind: 'channel', item })),
      ...data.quickChats.filter((quick) => !quick.archived).map((item) => ({ kind: 'quick', item })),
    ];
    return modalFrame('Change app context explicitly', `<form data-form="app-context"><label><span>Context</span><select name="context" autofocus><optgroup label="Networks">${data.networks.map((network) => `<option value="network:${network.id}"${selected(currentValue === `network:${network.id}`)}>${esc(network.name)}</option>`).join('')}</optgroup><optgroup label="Conversations">${conversations.map((found) => `<option value="conversation:${found.item.id}"${selected(currentValue === `conversation:${found.item.id}`)}>${esc(conversationTitle(found))}</option>`).join('')}</optgroup></select></label><p class="help">Changing chats elsewhere does not change this value.</p><div class="modal-actions"><button type="submit" class="primary">Apply context</button></div></form>`);
  }
  if (modal.type === 'invite-cross-network') {
    const channel = data.channels.find((item) => item.id === modal.channelId);
    const candidates = data.agents.filter((agent) => agent.networkId !== channel.networkId && !channel.memberIds.includes(agent.id));
    return modalFrame('Request cross-network invite', `<form data-form="invite-cross-network" data-channel-id="${channel.id}"><div class="notice">The agent gets no access now. This creates an owner approval in Activity / Inbox.</div><label><span>Agent from another network</span><select name="agentId" required autofocus>${candidates.map((agent) => `<option value="${agent.id}">${esc(agent.name)} · ${esc(networkName(data, agent.networkId))}</option>`).join('')}</select></label><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Request approval</button></div></form>`);
  }
  if (modal.type === 'model-picker') {
    const found = findConversation(data, modal.conversationId);
    if (!found) return '';
    const options = ['Auto', 'Kimi K2.6', 'GPT-5.2', 'Claude Sonnet 4.5'];
    return modalFrame(`Model · ${conversationTitle(found)}`, `<p class="help">Applies to future messages in this endless conversation. It does not create a session.</p><div class="modal-list model-options">${options.map((model) => `<button type="button" class="model-option" data-action="select-model" data-id="${found.item.id}" data-model="${model}"><span><strong>${model}</strong><small>${model === 'Auto' ? 'Recommended routing' : 'Wireframe provider option'}</small></span><span>${(found.item.model ?? 'Auto') === model ? 'Selected' : 'Choose'}</span></button>`).join('')}</div>`);
  }
  if (modal.type === 'notes') {
    return modalFrame('What to evaluate', `<ol class="help"><li>A starts in Chats; C starts in Inbox.</li><li>New chat: 0 recipients = local Quick chat, 1 = direct, 2+ = mixed-capable group.</li><li>One New entry: header New on desktop/Fold, floating New on mobile. Fold adds a draggable center splitter and a right navigation rail.</li><li>Use mobile Model/Apps chips without typing / (Model only for local agents), or use slash commands on a keyboard.</li><li>Chats filters: All · Unread · Agents · Channels and a network chip; Agents replaces the old Directory.</li><li>Empty in the prototype bar previews first-run states without deleting demo data.</li><li>Networks supports Create or Join; My Apps has New app, separate from Boards and Store.</li><li>Channel Details → Invite agent shows QR and CLI instructions with channel-only scope.</li><li>Add an agent: it joins My Network automatically.</li><li>New task: the agent creates a task channel and groups three other agents.</li><li>Finish that task: the channel is archived, not deleted.</li><li>Channel Details → Invite cross-network: no access changes before approval.</li><li>Open Apps from a chat, pin an App, switch chats, then try fullscreen.</li><li>Mobile preview: Chats → Channel → App → Close returns without nested drawers.</li><li>Cmd/Ctrl K searches all ${data.agents.length} agent records and ${data.channels.length} channels.</li></ol><div class="wire-panel dashed">Wireframe only: grayscale, fake data, no backend calls.</div>`);
  }
  if (modal.type === 'reset-demo') {
    return modalFrame('Reset demo?', '<p>All created agents, chats, channels and event changes will be discarded. Pinned App and viewport preferences are also reset.</p><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="button" class="primary" data-action="confirm-reset">Reset everything</button></div>');
  }
  return '';
}

function renderNewChannelModal(state, data) {
  const modal = state.modal;
  const networkId = modal.networkId ?? MY_NETWORK_ID;
  const creator = modal.creatorId ? data.agents.find((agent) => agent.id === modal.creatorId) : null;
  const agents = data.agents.filter((agent) => agent.networkId === networkId && agent.id !== creator?.id);
  return modalFrame(creator ? `Create channel as ${creator.name}` : 'Group agents / Create channel', `<form data-form="new-channel"><div class="notice">${creator ? `Agent creator · ${esc(creator.name)}` : 'User-created channel'} · members must belong to the selected network</div><label><span>Network</span><select name="networkId" data-change="channel-network" ${creator ? 'disabled' : ''}><option value="${networkId}">${esc(networkName(data, networkId))}</option>${!creator ? data.networks.filter((network) => network.id !== networkId).map((network) => `<option value="${network.id}">${esc(network.name)}</option>`).join('') : ''}</select>${creator ? `<input type="hidden" name="networkId" value="${networkId}">` : ''}</label><label><span>Channel name</span><input name="name" required autofocus value="${esc(modal.draft?.name ?? '')}" placeholder="release-audit"></label><label><span>Purpose</span><input name="purpose" value="${esc(modal.draft?.purpose ?? '')}" placeholder="Coordinate the release audit"></label><fieldset><legend>Agents to group (${agents.length} available)</legend><div class="member-list">${agents.map((agent) => `<label class="check"><input type="checkbox" name="members" value="${agent.id}">${esc(agent.name)}</label>`).join('')}</div>${creator ? '<p class="help">The creating agent is added automatically.</p>' : ''}</fieldset><label class="check"><input type="checkbox" name="taskBound">Task-bound · archive when the task completes</label><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Create channel</button></div></form>`, true);
}

function renderNewTaskModal(state, data) {
  const modal = state.modal;
  const homeAgents = data.agents.filter((agent) => agent.networkId === MY_NETWORK_ID);
  const agentId = modal.agentId ?? homeAgents.find((agent) => agent.name === 'Release Manager')?.id ?? homeAgents[0].id;
  const agent = homeAgents.find((item) => item.id === agentId) ?? homeAgents[0];
  const others = homeAgents.filter((item) => item.id !== agent.id);
  return modalFrame('New background task', `<form data-form="new-task"><label><span>Agent</span><select name="agentId" data-change="task-agent" ${modal.fixedAgent ? 'disabled' : ''}>${homeAgents.map((item) => `<option value="${item.id}"${selected(item.id === agent.id)}>${esc(item.name)}</option>`).join('')}</select>${modal.fixedAgent ? `<input type="hidden" name="agentId" value="${agent.id}">` : ''}</label><label><span>Task</span><input name="title" required autofocus value="${esc(modal.taskTitle ?? '')}" placeholder="Audit release 2.60"></label><label class="check"><input type="checkbox" name="createChannel" checked>Let the agent create a task-bound channel</label><fieldset><legend>Optional members · otherwise the agent picks 3</legend><div class="member-list">${others.map((item) => `<label class="check"><input type="checkbox" name="members" value="${item.id}">${esc(item.name)}</label>`).join('')}</div></fieldset><p class="help">The channel is created by the agent in My Network. Finishing the task archives the channel.</p><div class="modal-actions"><button type="button" data-action="close-modal">Cancel</button><button type="submit" class="primary">Start task</button></div></form>`, true);
}

function renderConversationDetailsModal(state, data) {
  const found = findConversation(data, state.modal.conversationId);
  if (!found) return '';
  const { kind, item } = found;
  if (kind === 'agent') {
    const created = data.channels.filter((channel) => channel.creatorId === item.id);
    return modalFrame(item.name, `<div class="detail-grid"><div class="detail-cell"><div class="label">Type</div><div class="value">Persistent agent</div></div><div class="detail-cell"><div class="label">Home</div><div class="value">${esc(networkName(data, item.networkId))}</div></div><div class="detail-cell"><div class="label">Status</div><div class="value">${esc(humanStatus(data, found))}</div></div><div class="detail-cell"><div class="label">Channels created</div><div class="value">${created.length}</div></div></div><p>${esc(item.purpose)}</p><div class="action-row"><button type="button" class="primary" data-action="new-task" data-id="${item.id}">New task</button><button type="button" data-action="agent-create-channel" data-id="${item.id}">Create channel as agent</button><button type="button" data-action="quick-apps">Open app</button><button type="button" data-action="open-network" data-id="${item.networkId}">Open ${esc(networkName(data, item.networkId))}</button></div><div class="wire-panel dashed">One identity and one endless main conversation. Topics and branches do not create sessions.</div>`);
  }
  if (kind === 'quick') {
    return modalFrame(item.title, `<p class="help">Quick chat · ${item.archived ? 'archived' : 'active'} · no persistent identity.</p><div class="action-row"><button type="button" class="primary" data-action="convert-quick" data-id="${item.id}">Become agent → My Network</button><button type="button" data-action="link-agent" data-id="${item.id}">Link to existing agent</button>${!item.archived ? `<button type="button" data-action="archive-quick" data-id="${item.id}">Archive</button>` : ''}</div>${item.linkedAgentId ? `<button type="button" data-action="open-conversation" data-id="${item.linkedAgentId}">Open linked agent</button>` : ''}`);
  }
  const members = item.memberIds.map((id) => data.agents.find((agent) => agent.id === id)).filter(Boolean);
  const runningEvent = data.events.find((event) => event.channelId === item.id && event.status === 'running');
  return modalFrame(`#${item.name}`, `<div class="detail-grid"><div class="detail-cell"><div class="label">Network</div><div class="value">${esc(networkName(data, item.networkId))}</div></div><div class="detail-cell"><div class="label">Created by</div><div class="value">${esc(item.creatorName)} · ${item.creatorType}</div></div><div class="detail-cell"><div class="label">Lifetime</div><div class="value">${item.taskBound ? 'Task-bound' : 'Persistent'}${item.archived ? ' · archived' : ''}</div></div><div class="detail-cell"><div class="label">Members</div><div class="value">${members.length}</div></div></div><p>${esc(item.purpose)}</p><h3>Agent members</h3><div class="wire-panel">${members.map((agent) => `<div class="wire-row"><span>${esc(agent.name)}</span><span class="muted">${esc(networkName(data, agent.networkId))}</span></div>`).join('')}</div><div class="action-row">${runningEvent ? `<button type="button" class="primary" data-action="complete-task" data-id="${runningEvent.id}">Complete task + archive channel</button>` : ''}<button type="button" class="primary" data-action="invite-agent" data-id="${item.id}">Invite agent · QR / CLI</button><button type="button" data-action="invite-cross-network" data-id="${item.id}">Add existing agent with approval</button><button type="button" data-action="open-network" data-id="${item.networkId}">Open ${esc(networkName(data, item.networkId))}</button></div>`, true);
}

function renderQrPreview(value) {
  const size = 21;
  const seed = [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const finder = (row, column, originRow, originColumn) => {
    const y = row - originRow;
    const x = column - originColumn;
    if (x < 0 || x > 6 || y < 0 || y > 6) return null;
    return x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
  };
  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const fixed = finder(row, column, 0, 0) ?? finder(row, column, 0, 14) ?? finder(row, column, 14, 0);
      const on = fixed ?? ((row * 17 + column * 31 + row * column * 7 + seed) % 11 < 5);
      cells.push(`<span class="${on ? 'on' : ''}"></span>`);
    }
  }
  return `<div class="qr-code" role="img" aria-label="Wireframe QR code for channel invitation">${cells.join('')}</div>`;
}

function renderInviteAgentModal(state, data) {
  const modal = state.modal;
  const channel = data.channels.find((item) => item.id === modal.channelId);
  if (!channel) return '';
  const invite = buildChannelInvite(data, channel.id);
  const tab = modal.inviteTab ?? 'qr';
  const qr = `<div class="invite-method"><p class="help">Scan with the Fa mobile app on the agent’s device.</p>${renderQrPreview(invite.link)}<ol class="help invite-steps"><li>Open <strong>Agents → Join via QR</strong> on the agent device.</li><li>Scan this code and review <strong>#${esc(channel.name)}</strong> and its channel-only permission.</li><li>Confirm the request. The owner approves it before the agent receives history or sends messages.</li></ol><button type="button" data-action="invite-tab" data-tab="cli">Show CLI invite instead</button></div>`;
  const cli = `<div class="invite-method"><p class="help">Run this command on the machine where the agent is installed:</p><textarea class="cli-command" readonly data-cli-invite aria-label="CLI agent invite">${esc(invite.command)}</textarea><button type="button" class="primary" data-action="copy-channel-invite" data-id="${channel.id}">Copy CLI invite</button><ol class="help invite-steps"><li>Open a terminal on the agent’s machine with <strong>fa</strong> installed.</li><li>Paste and run the command. It contains the network, channel and one-time demo invite.</li><li>The agent appears as pending. After owner approval it can access <strong>this channel only</strong>, not the whole network.</li></ol><button type="button" data-action="invite-tab" data-tab="qr">Show QR code instead</button></div>`;
  return modalFrame(`Invite agent · #${channel.name}`, `<div class="notice"><strong>${esc(networkName(data, channel.networkId))} / #${esc(channel.name)}</strong><br>Scope: ${invite.scope} · one agent · expires in ${invite.expiresLabel}</div><nav class="apps-tabs invite-tabs"><button type="button" class="${active(tab === 'qr')}" data-action="invite-tab" data-tab="qr">QR code</button><button type="button" class="${active(tab === 'cli')}" data-action="invite-tab" data-tab="cli">CLI invite</button></nav>${tab === 'cli' ? cli : qr}<p class="help">Wireframe invite: ${esc(invite.link)}</p>`, true);
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

export function renderMobileKeyboard() {
  return `<section class="mobile-keyboard" data-testid="mobile-keyboard" aria-label="Wireframe screen keyboard">
    <div class="keyboard-accessory"><span>Screen keyboard · UX preview</span><button type="button" class="small" data-action="keyboard-hide">Hide</button></div>
    <div class="keyboard-suggestions" aria-label="Suggested words"><button type="button" data-action="keyboard-key" data-key="agent ">agent</button><button type="button" data-action="keyboard-key" data-key="network ">network</button><button type="button" data-action="keyboard-key" data-key="task ">task</button></div>
    ${KEYBOARD_ROWS.map((row) => `<div class="keyboard-row">${row.map((key) => `<button type="button" class="keyboard-key${key === 'backspace' ? ' wide' : ''}" data-action="keyboard-key" data-key="${key}" aria-label="${key === 'backspace' ? 'Delete' : `Type ${key}`}">${key === 'backspace' ? 'Delete' : key}</button>`).join('')}</div>`).join('')}
    <div class="keyboard-row"><button type="button" class="keyboard-key wide" data-action="keyboard-key" data-key="," aria-label="Type comma">,</button><button type="button" class="keyboard-key space" data-action="keyboard-key" data-key=" ">space</button><button type="button" class="keyboard-key wide" data-action="keyboard-key" data-key="return">return</button></div>
  </section>`;
}

export function renderShell(state, data) {
  const classes = [
    'shell',
    state.mobileDetail ? 'detail-open' : '',
    state.appPanel ? 'with-app' : '',
    state.appMobileOpen ? 'app-mobile-open' : '',
    state.keyboardOpen ? 'keyboard-open' : '',
  ].filter(Boolean).join(' ');
  return `<div class="${classes}" data-variant="${state.variant}" data-section="${state.section}">
    ${renderSidebar(state, data)}
    ${renderFoldSplitter()}
    ${renderMain(state, data)}
    ${state.appPanel ? renderAppSurface(state, data) : ''}
    ${renderBottomNav(state)}
    ${state.appFullScreen && state.appPanel ? renderAppSurface(state, data, true) : ''}
    ${renderQuickFab()}
    ${renderFoldActionRail(state)}
    ${renderModal(state, data)}
    ${state.keyboardOpen ? renderMobileKeyboard() : ''}
  </div>`;
}
