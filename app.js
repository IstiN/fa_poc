import {
  MY_NETWORK_ID,
  addAgent,
  approveEvent,
  buildChannelInvite,
  completeTask,
  composeChat,
  convertQuickChatToAgent,
  createAgentTask,
  createBoard,
  createChannel,
  createApp,
  createDemoData,
  createEmptyPreviewData,
  createNetwork,
  createQuickChat,
  findConversation,
  installWidget,
  joinNetwork,
  linkQuickChatToAgent,
  requestCrossNetworkInvite,
  retryEvent,
  searchAll,
  sendMessage,
} from './model.js';
import { renderAgentSuggestions, renderCommandResults, renderMobileKeyboard, renderShell } from './views.js';

const PREFS_KEY = 'fa2-wireframe-preferences-v1';
const appRoot = document.querySelector('#app');
const frame = document.querySelector('#frame');
const toastRoot = document.querySelector('#toast');
let toastTimer = null;
let data = createDemoData();

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

const prefs = readPrefs();

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const variant = parts[0] === 'c' ? 'c' : parts[0] === 'a' ? 'a' : prefs.variant === 'c' ? 'c' : 'a';
  const fallbackSection = variant === 'c' ? 'inbox' : 'chats';
  const allowed = ['chats', 'activity', 'inbox', 'directory', 'agents', 'apps', 'more'];
  const section = allowed.includes(parts[1]) ? parts[1] : fallbackSection;
  let id = null;
  try {
    id = parts[2] ? decodeURIComponent(parts.slice(2).join('/')) : null;
  } catch {
    id = null;
  }
  return { variant, section, id };
}

const initialRoute = parseRoute();
const initialParams = new URLSearchParams(location.search);
const initialKeyboard = initialParams.has('keyboard');
const requestedViewport = initialParams.get('viewport');
const initialViewport = ['desktop', 'mobile', 'fold'].includes(requestedViewport) ? requestedViewport : null;
let keyboardField = null;
const state = {
  variant: initialRoute.variant,
  section: initialRoute.section,
  selectedId: initialRoute.section === 'chats' && initialRoute.id ? initialRoute.id : 'agent:my:0',
  selectedEventId: ['activity', 'inbox'].includes(initialRoute.section) && initialRoute.id ? initialRoute.id : 'event:deploy',
  selectedNetworkId: ['directory', 'agents'].includes(initialRoute.section) ? initialRoute.id : null,
  mobileDetail: Boolean(initialRoute.id),
  folder: 'all',
  listFilter: 'all',
  activityFilter: 'all',
  directoryTab: 'agents',
  directoryNetwork: 'all',
  directoryQuery: '',
  appFilter: 'all',
  appQuery: '',
  appsTab: 'my',
  modal: null,
  commandQuery: '',
  appPanel: null,
  appMobileOpen: false,
  appFullScreen: false,
  viewport: initialKeyboard ? 'mobile' : initialViewport ?? (['mobile', 'fold'].includes(prefs.viewport) ? prefs.viewport : 'desktop'),
  keyboardOpen: initialKeyboard,
  emptyPreview: initialParams.has('empty'),
};

let populatedData = data;
if (state.emptyPreview) data = createEmptyPreviewData(data);

if (!state.emptyPreview && prefs.pinnedAppId && data.apps.some((app) => app.id === prefs.pinnedAppId)) {
  state.appPanel = {
    appId: prefs.pinnedAppId,
    context: prefs.appContext ?? { kind: 'network', id: MY_NETWORK_ID },
    pinned: true,
  };
}

function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      variant: state.variant,
      viewport: state.viewport,
      pinnedAppId: state.appPanel?.pinned ? state.appPanel.appId : null,
      appContext: state.appPanel?.pinned ? state.appPanel.context : null,
    }));
  } catch {
    // The wireframe also works when storage is unavailable.
  }
}

function routeForCurrentState() {
  let id = null;
  if (state.mobileDetail && state.section === 'chats') id = state.selectedId;
  if (state.mobileDetail && ['activity', 'inbox'].includes(state.section)) id = state.selectedEventId;
  if (state.mobileDetail && ['directory', 'agents'].includes(state.section)) id = state.selectedNetworkId;
  return `#/${state.variant}/${state.section}${id ? `/${encodeURIComponent(id)}` : ''}`;
}

function updateUrl(replace = false) {
  const url = routeForCurrentState();
  if (replace) history.replaceState({ route: url }, '', url);
  else history.pushState({ route: url }, '', url);
}

function navigate(section, id = null, { detail = false, replace = false, updateUrl: shouldUpdateUrl = true } = {}) {
  const previousSection = state.section;
  const previousSelection = section === 'chats' ? state.selectedId : ['activity', 'inbox'].includes(section) ? state.selectedEventId : state.selectedNetworkId;
  const nextSelection = id ?? previousSelection;
  const selectionChanged = previousSection !== section || (id !== null && nextSelection !== previousSelection);

  state.section = section;
  state.mobileDetail = detail;
  state.modal = null;
  state.appFullScreen = false;
  state.keyboardOpen = false;
  keyboardField = null;
  if (section === 'chats') {
    if (id) state.selectedId = id;
    state.selectedNetworkId = null;
  } else if (section === 'activity' || section === 'inbox') {
    if (id) state.selectedEventId = id;
    state.selectedNetworkId = null;
  } else if (section === 'directory' || section === 'agents') {
    state.selectedNetworkId = detail ? id : null;
  } else {
    state.selectedNetworkId = null;
  }

  if (state.appPanel && !state.appPanel.pinned && selectionChanged) {
    state.appPanel = null;
    state.appMobileOpen = false;
  }
  if (shouldUpdateUrl) updateUrl(replace);
  savePrefs();
  render();
}

function applyRoute(route) {
  state.variant = route.variant;
  state.section = route.section;
  state.mobileDetail = Boolean(route.id);
  state.modal = null;
  state.appFullScreen = false;
  state.appMobileOpen = false;
  state.keyboardOpen = false;
  keyboardField = null;
  if (route.section === 'chats') {
    if (route.id) state.selectedId = route.id;
  } else if (['activity', 'inbox'].includes(route.section)) {
    if (route.id) state.selectedEventId = route.id;
  } else if (['directory', 'agents'].includes(route.section)) {
    state.selectedNetworkId = route.id;
  }
  savePrefs();
  render();
}

function render() {
  document.querySelectorAll('[data-prototype="variant"]').forEach((button) => {
    const isActive = button.dataset.value === state.variant;
    button.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelectorAll('[data-prototype="viewport"]').forEach((button) => {
    const isActive = button.dataset.value === state.viewport;
    button.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelector('[data-prototype="keyboard"]')?.setAttribute('aria-pressed', String(state.keyboardOpen));
  document.querySelector('[data-prototype="empty"]')?.setAttribute('aria-pressed', String(state.emptyPreview));
  frame.classList.toggle('mobile-preview', state.viewport === 'mobile');
  frame.classList.toggle('fold-preview', state.viewport === 'fold');
  if (!state.keyboardOpen) keyboardField = null;
  appRoot.innerHTML = renderShell(state, data);
  document.title = `${state.variant.toUpperCase()} · ${state.section} — Fa 2.0 UX`;
  const messages = document.querySelector('[data-testid="messages"]');
  if (messages) messages.scrollTop = messages.scrollHeight;
  const autofocus = document.querySelector('.modal [autofocus]');
  if (autofocus) queueMicrotask(() => autofocus.focus({ preventScroll: true }));
  else if (state.keyboardOpen) queueMicrotask(() => {
    keyboardField = preferredKeyboardField();
    keyboardField?.focus({ preventScroll: true });
  });
}

function setEmptyPreview(enabled) {
  if (enabled === state.emptyPreview) return;
  if (enabled) {
    populatedData = data;
    data = createEmptyPreviewData(data);
  } else {
    data = populatedData;
  }
  state.emptyPreview = enabled;
  state.selectedId = enabled ? null : 'agent:my:0';
  state.selectedEventId = enabled ? null : 'event:deploy';
  state.selectedNetworkId = null;
  state.appPanel = null;
  state.appMobileOpen = false;
  state.appFullScreen = false;
  state.folder = 'all';
  state.listFilter = 'all';
  state.activityFilter = 'all';
  state.directoryNetwork = 'all';
  state.appsTab = 'my';
  navigate(state.variant === 'c' ? 'inbox' : 'chats', null, { replace: true });
  showToast(enabled ? 'Empty preview · demo data is preserved' : 'Demo data restored');
}

function preferredKeyboardField() {
  return appRoot.querySelector('.composer input, .modal input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), .modal textarea, .list-tools input');
}

function openKeyboard(field = null) {
  if (state.viewport !== 'mobile') return;
  if (field) keyboardField = field;
  if (state.keyboardOpen) return;
  state.keyboardOpen = true;
  const shell = appRoot.querySelector('.shell');
  shell?.classList.add('keyboard-open');
  shell?.insertAdjacentHTML('beforeend', renderMobileKeyboard());
  document.querySelector('[data-prototype="keyboard"]')?.setAttribute('aria-pressed', 'true');
}

function hideKeyboard({ blur = true } = {}) {
  if (blur) keyboardField?.blur();
  state.keyboardOpen = false;
  keyboardField = null;
  appRoot.querySelector('.mobile-keyboard')?.remove();
  appRoot.querySelector('.shell')?.classList.remove('keyboard-open');
  document.querySelector('[data-prototype="keyboard"]')?.setAttribute('aria-pressed', 'false');
}

function typeKeyboardKey(key) {
  const field = keyboardField?.isConnected ? keyboardField : preferredKeyboardField();
  if (!field) return;
  keyboardField = field;
  if (key === 'return' && field.tagName !== 'TEXTAREA') {
    hideKeyboard();
    return;
  }
  field.focus({ preventScroll: true });
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  if (key === 'backspace') {
    const from = start === end && start > 0 ? start - 1 : start;
    field.setRangeText('', from, end, 'end');
  } else {
    field.setRangeText(key === 'return' ? '\n' : key, start, end, 'end');
  }
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastRoot.textContent = message;
  toastRoot.classList.add('visible');
  toastTimer = setTimeout(() => toastRoot.classList.remove('visible'), 2800);
}

function openModal(type, properties = {}) {
  state.modal = { type, ...properties };
  state.keyboardOpen = false;
  keyboardField = null;
  if (type === 'command') state.commandQuery = '';
  if (type === 'new-chat') {
    state.modal.query = '';
    state.modal.draft = { recipientIds: [], message: '', groupName: '' };
  }
  render();
}

function closeModal() {
  state.modal = null;
  state.keyboardOpen = false;
  keyboardField = null;
  render();
}

function inferAppContext() {
  if (state.section === 'chats' && findConversation(data, state.selectedId)) {
    return { kind: 'conversation', id: state.selectedId };
  }
  if (['activity', 'inbox'].includes(state.section)) {
    const event = data.events.find((item) => item.id === state.selectedEventId);
    if (event) return { kind: 'network', id: event.networkId };
  }
  if (state.selectedNetworkId) return { kind: 'network', id: state.selectedNetworkId };
  if (state.folder !== 'all') return { kind: 'network', id: state.folder };
  return { kind: 'network', id: MY_NETWORK_ID };
}

function openApp(appId) {
  if (!data.apps.some((app) => app.id === appId)) return;
  const previous = state.appPanel;
  const sameApp = previous?.appId === appId;
  state.appPanel = {
    appId,
    context: sameApp ? previous.context : inferAppContext(),
    pinned: previous?.pinned ?? false,
  };
  state.appMobileOpen = true;
  state.appFullScreen = false;
  state.modal = null;
  state.keyboardOpen = false;
  keyboardField = null;
  savePrefs();
  render();
}

function closeApp() {
  state.appPanel = null;
  state.appMobileOpen = false;
  state.appFullScreen = false;
  savePrefs();
  render();
}

function openCommandResult(type, id) {
  state.modal = null;
  if (type === 'network') {
    state.directoryTab = 'networks';
    navigate('directory', id, { detail: true });
  } else if (type === 'app') {
    openApp(id);
  } else {
    navigate('chats', id, { detail: true });
  }
}

function openNetwork(networkId) {
  state.directoryTab = 'networks';
  navigate('directory', networkId, { detail: true });
}

function performEventAction(action, eventId) {
  const event = data.events.find((item) => item.id === eventId);
  if (!event) return;
  if (action === 'approve-event') {
    approveEvent(data, eventId);
    event.unread = false;
    showToast(event.pendingInvite ? 'Invite approved · membership updated explicitly' : 'Approved');
  } else if (action === 'complete-task') {
    completeTask(data, eventId);
    if (event.appId) {
      const app = data.apps.find((item) => item.id === event.appId);
      if (app) app.running = false;
    }
    showToast(event.channelId ? 'Task complete · channel archived, history retained' : 'Finished · result added to Activity');
  } else if (action === 'retry-event') {
    retryEvent(data, eventId);
    showToast('Retry started · now Running');
  } else if (action === 'decline-event') {
    event.status = 'later';
    event.unread = false;
    showToast('Moved to Later');
  } else if (action === 'mark-event-read') {
    event.status = 'done';
    event.unread = false;
    showToast('Marked as read');
  }
  render();
}

function toggleRecipient(agentId) {
  if (state.modal?.type !== 'new-chat') return;
  const form = document.querySelector('[data-form="new-chat"]');
  if (form) {
    state.modal.draft.message = form.elements.message.value;
    state.modal.draft.groupName = form.elements.groupName?.value ?? state.modal.draft.groupName;
  }
  const ids = state.modal.draft.recipientIds;
  state.modal.draft.recipientIds = ids.includes(agentId) ? ids.filter((id) => id !== agentId) : [...ids, agentId];
  state.modal.query = '';
  render();
}

const actions = {
  'nav-root': (element) => navigate(element.dataset.section),
  'back-list': () => navigate(state.section),
  'quick-actions': () => openModal('quick-actions'),
  'quick-apps': () => openModal('quick-apps'),
  'chat-create-menu': () => openModal('chat-create-menu'),
  'new-chat': () => openModal('new-chat'),
  'networks': () => openModal('networks'),
  'new-network': () => openModal('new-network'),
  'join-network': () => openModal('join-network'),
  'new-app': () => openModal('new-app'),
  'new-board': () => openModal('new-board'),
  'invite-agent': (element) => openModal('invite-agent', { channelId: element.dataset.id, inviteTab: 'qr' }),
  'invite-tab': (element) => {
    state.modal.inviteTab = element.dataset.tab;
    render();
  },
  'copy-channel-invite': async (element) => {
    const invite = buildChannelInvite(data, element.dataset.id);
    let copied = false;
    try {
      await navigator.clipboard.writeText(invite.command);
      copied = true;
    } catch {
      const field = document.querySelector('[data-cli-invite]');
      field?.focus();
      field?.select();
      copied = Boolean(field && document.execCommand('copy'));
    }
    showToast(copied ? 'CLI invite copied · run it on the agent machine' : 'Select the CLI command and copy it');
  },
  'open-board': (element) => openModal('board', { boardId: element.dataset.id }),
  'board-store': () => {
    state.appsTab = 'store';
    state.appFilter = 'all';
    navigate('apps');
  },
  'install-widget': (element) => {
    const app = installWidget(data, element.dataset.id);
    render();
    showToast(`${app.name} installed into My Apps`);
  },
  'apps-tab': (element) => {
    state.appsTab = element.dataset.tab;
    state.appFilter = 'all';
    if (state.section === 'apps') render();
    else navigate('apps');
  },
  'apps-running': () => {
    state.appsTab = 'my';
    state.appFilter = 'running';
    if (state.section === 'apps') render();
    else navigate('apps');
  },
  'toggle-recipient': (element) => toggleRecipient(element.dataset.id),
  'new-agent': () => openModal('new-agent'),
  'quick-chat': () => openModal('quick-chat'),
  'new-channel': (element) => openModal('new-channel', { networkId: element.dataset.networkId ?? MY_NETWORK_ID }),
  'new-task': (element) => openModal('new-task', element.dataset.id ? { agentId: element.dataset.id, fixedAgent: true } : {}),
  'agent-create-channel': (element) => {
    const agent = data.agents.find((item) => item.id === element.dataset.id);
    if (agent) openModal('new-channel', { creatorId: agent.id, networkId: agent.networkId });
  },
  'command': () => openModal('command'),
  'close-modal': closeModal,
  'open-conversation': (element) => navigate('chats', element.dataset.id, { detail: true }),
  'open-event': (element) => navigate(state.variant === 'c' ? 'inbox' : 'activity', element.dataset.id, { detail: true }),
  'open-directory': () => {
    if (state.variant === 'a') {
      state.listFilter = 'agents';
      navigate('chats');
      return;
    }
    state.directoryTab = 'agents';
    navigate('directory');
  },
  'list-filter': (element) => {
    state.listFilter = element.dataset.filter;
    if (state.section === 'chats') render();
    else navigate('chats');
  },
  'network-filter': () => openModal('network-filter'),
  'select-folder': (element) => {
    state.folder = element.dataset.id;
    state.modal = null;
    render();
  },
  'settings': () => openModal('settings'),
  'open-networks': () => {
    state.directoryTab = 'networks';
    navigate('directory');
  },
  'open-channels': () => {
    if (state.variant === 'a') {
      state.listFilter = 'channels';
      navigate('chats');
      return;
    }
    state.directoryTab = 'channels';
    navigate('directory');
  },
  'open-network': (element) => openNetwork(element.dataset.id),
  'open-activity': () => navigate(state.variant === 'c' ? 'inbox' : 'activity'),
  'directory-tab': (element) => {
    state.directoryTab = element.dataset.tab;
    state.selectedNetworkId = null;
    state.mobileDetail = false;
    render();
  },
  'open-app': (element) => openApp(element.dataset.id),
  'close-app': closeApp,
  'fullscreen-app': () => {
    state.appFullScreen = true;
    render();
  },
  'exit-fullscreen': () => {
    state.appFullScreen = false;
    render();
  },
  'pin-app': () => {
    if (!state.appPanel) return;
    state.appPanel.pinned = !state.appPanel.pinned;
    savePrefs();
    render();
    showToast(state.appPanel.pinned ? 'App pinned · restored on this device' : 'App unpinned');
  },
  'app-context': () => openModal('app-context'),
  'model-picker': (element) => openModal('model-picker', { conversationId: element.dataset.id }),
  'select-model': (element) => {
    const found = findConversation(data, element.dataset.id);
    if (!found) return;
    found.item.model = element.dataset.model;
    closeModal();
    showToast(`${found.item.name ?? found.item.title} → ${element.dataset.model} · future messages`);
  },
  'chat-command': (element) => {
    if (element.dataset.command === 'model') openModal('model-picker', { conversationId: state.selectedId });
    else if (element.dataset.command === 'apps') openModal('quick-apps');
    else openModal('new-chat');
  },
  'conversation-details': (element) => openModal('conversation-details', { conversationId: element.dataset.id }),
  'convert-quick': (element) => {
    const agent = convertQuickChatToAgent(data, element.dataset.id);
    navigate('chats', agent.id, { detail: true });
    showToast('Persistent agent created in My Network · history preserved');
  },
  'link-agent': (element) => openModal('link-agent', { quickId: element.dataset.id }),
  'link-quick-to-agent': (element) => {
    const agent = linkQuickChatToAgent(data, element.dataset.quickId, element.dataset.agentId);
    navigate('chats', agent.id, { detail: true });
    showToast('Quick chat linked to the existing agent');
  },
  'archive-quick': (element) => {
    const quick = data.quickChats.find((item) => item.id === element.dataset.id);
    if (quick) {
      quick.archived = true;
      quick.recent = false;
    }
    navigate('chats');
    showToast('Quick chat archived · still searchable');
  },
  'invite-cross-network': (element) => openModal('invite-cross-network', { channelId: element.dataset.id }),
  'approve-event': (element) => performEventAction('approve-event', element.dataset.id),
  'complete-task': (element) => performEventAction('complete-task', element.dataset.id),
  'retry-event': (element) => performEventAction('retry-event', element.dataset.id),
  'decline-event': (element) => performEventAction('decline-event', element.dataset.id),
  'mark-event-read': (element) => performEventAction('mark-event-read', element.dataset.id),
  'open-source': (element) => {
    const event = data.events.find((item) => item.id === element.dataset.id);
    if (event?.sourceId && findConversation(data, event.sourceId)) navigate('chats', event.sourceId, { detail: true });
  },
  'open-event-channel': (element) => {
    const event = data.events.find((item) => item.id === element.dataset.id);
    if (event?.channelId) navigate('chats', event.channelId, { detail: true });
  },
  'command-open': (element) => openCommandResult(element.dataset.type, element.dataset.id),
  'notes': () => openModal('notes'),
  'reset-demo': () => openModal('reset-demo'),
  'confirm-reset': () => resetDemo(),
  'keyboard-hide': () => hideKeyboard(),
  'keyboard-key': (element) => typeKeyboardKey(element.dataset.key ?? ''),
  'demo-action': (element) => showToast(element.dataset.message ?? 'Done'),
};

function resetDemo() {
  data = createDemoData();
  populatedData = data;
  Object.assign(state, {
    variant: 'a', section: 'chats', selectedId: 'agent:my:0', selectedEventId: 'event:deploy',
    selectedNetworkId: null, mobileDetail: false, folder: 'all', listFilter: 'all', activityFilter: 'all',
    directoryTab: 'agents', directoryNetwork: 'all', directoryQuery: '', appFilter: 'all', appQuery: '', appsTab: 'my',
    modal: null, commandQuery: '', appPanel: null, appMobileOpen: false,
    appFullScreen: false, viewport: 'desktop', keyboardOpen: false, emptyPreview: false,
  });
  try { localStorage.removeItem(PREFS_KEY); } catch { /* no-op */ }
  updateUrl(true);
  render();
  showToast('Demo reset');
}

document.addEventListener('click', (event) => {
  const field = event.target.closest('#app input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), #app textarea');
  if (field) openKeyboard(field);
  const element = event.target.closest('[data-action]');
  if (!element) return;
  const action = element.dataset.action;
  if (action === 'backdrop-close') {
    if (event.target === element) closeModal();
    return;
  }
  if (event.target.closest('form') && element.type === 'submit') return;
  const handler = actions[action];
  if (!handler) return;
  event.preventDefault();
  try {
    handler(element);
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener('focusin', (event) => {
  const field = event.target.closest?.('#app input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), #app textarea');
  if (field) openKeyboard(field);
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const values = new FormData(form);
  try {
    switch (form.dataset.form) {
      case 'new-chat': {
        const result = composeChat(data, {
          recipientIds: state.modal.draft.recipientIds,
          message: values.get('message'),
          groupName: values.get('groupName') ?? '',
        });
        navigate('chats', result.conversation.id, { detail: true });
        showToast(result.kind === 'quick'
          ? 'Local Quick chat started · no persistent agent yet'
          : result.kind === 'agent'
            ? 'Direct chat opened · endless agent, no new session'
            : `Group created${result.externalCount ? ` · ${result.externalCount} external member(s), group-only access` : ''}`);
        break;
      }
      case 'join-network': {
        const network = joinNetwork(data, String(values.get('invite') ?? ''));
        state.directoryTab = 'networks';
        navigate('directory', network.id, { detail: true });
        showToast(`Joined ${network.name} · other networks remain unchanged`);
        break;
      }
      case 'new-app': {
        const app = createApp(data, { name: values.get('name'), description: values.get('description') });
        state.appsTab = 'my';
        navigate('apps');
        openApp(app.id);
        showToast(`${app.name} created in My Apps`);
        break;
      }
      case 'new-network': {
        const network = createNetwork(data, { name: values.get('name') });
        state.directoryTab = 'networks';
        navigate('directory', network.id, { detail: true });
        showToast(`${network.name} created · add agents and channels explicitly`);
        break;
      }
      case 'new-board': {
        const board = createBoard(data, { name: values.get('name') });
        state.appsTab = 'boards';
        navigate('apps');
        openModal('board', { boardId: board.id });
        showToast(`${board.name} created · choose widgets next`);
        break;
      }
      case 'new-agent': {
        const agent = addAgent(data, { name: values.get('name'), purpose: values.get('purpose') });
        navigate('chats', agent.id, { detail: true });
        showToast(`${agent.name} added · My Network membership automatic`);
        break;
      }
      case 'quick-chat': {
        const quick = createQuickChat(data, values.get('message'));
        navigate('chats', quick.id, { detail: true });
        showToast('Quick chat created · no persistent agent yet');
        break;
      }
      case 'new-channel': {
        const channel = createChannel(data, {
          name: values.get('name'),
          purpose: values.get('purpose'),
          networkId: values.get('networkId'),
          creatorId: state.modal.creatorId ?? 'user',
          memberIds: values.getAll('members'),
          taskBound: values.get('taskBound') === 'on',
        });
        navigate('chats', channel.id, { detail: true });
        showToast(`#${channel.name} created · ${channel.memberIds.length} agent members`);
        break;
      }
      case 'new-task': {
        const result = createAgentTask(data, {
          agentId: values.get('agentId'),
          title: values.get('title'),
          createChannel: values.get('createChannel') === 'on',
          memberIds: values.getAll('members'),
        });
        if (state.variant === 'c') navigate('inbox', result.event.id, { detail: true });
        else if (result.channel) navigate('chats', result.channel.id, { detail: true });
        else navigate('activity', result.event.id, { detail: true });
        showToast(result.channel ? 'Agent started the task and created a channel' : 'Background task started');
        break;
      }
      case 'send-message': {
        const message = String(values.get('message')).trim();
        if (message === '/model') {
          const found = findConversation(data, form.dataset.id);
          if (found?.kind === 'channel') showToast('Model selection is available in direct and Quick agent chats');
          else openModal('model-picker', { conversationId: form.dataset.id });
        } else if (message === '/apps') openModal('quick-apps');
        else if (message === '/new') openModal('new-chat');
        else {
          sendMessage(data, form.dataset.id, message);
          render();
        }
        break;
      }
      case 'directory-search': {
        state.directoryQuery = values.get('query').trim();
        render();
        break;
      }
      case 'app-search': {
        state.appQuery = values.get('query').trim();
        render();
        break;
      }
      case 'command': {
        const result = searchAll(data, values.get('query'))[0];
        if (result) openCommandResult(result.type, result.id);
        break;
      }
      case 'app-context': {
        const value = values.get('context');
        state.appPanel.context = value.startsWith('network:')
          ? { kind: 'network', id: value.slice('network:'.length) }
          : { kind: 'conversation', id: value.slice('conversation:'.length) };
        state.modal = null;
        savePrefs();
        render();
        showToast('App context changed explicitly');
        break;
      }
      case 'invite-cross-network': {
        const request = requestCrossNetworkInvite(data, { channelId: form.dataset.channelId, agentId: values.get('agentId') });
        navigate(state.variant === 'c' ? 'inbox' : 'activity', request.id, { detail: true });
        showToast('Approval requested · no access granted yet');
        break;
      }
      default:
        break;
    }
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  const change = target.dataset.change;
  if (change === 'folder') {
    state.folder = target.value;
    render();
  } else if (change === 'activity-filter') {
    state.activityFilter = target.value;
    render();
  } else if (change === 'directory-network') {
    state.directoryNetwork = target.value;
    state.selectedNetworkId = null;
    state.mobileDetail = false;
    render();
  } else if (change === 'app-filter') {
    state.appFilter = target.value;
    render();
  } else if (change === 'channel-network') {
    const form = target.closest('form');
    state.modal.networkId = target.value;
    state.modal.draft = { name: form.elements.name.value, purpose: form.elements.purpose.value };
    render();
  } else if (change === 'task-agent') {
    const form = target.closest('form');
    state.modal.agentId = target.value;
    state.modal.taskTitle = form.elements.title.value;
    render();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-command-input]')) {
    state.commandQuery = event.target.value;
    const results = document.querySelector('[data-testid="command-results"]');
    if (results) results.innerHTML = renderCommandResults(state, data);
    return;
  }
  if (event.target.matches('[data-agent-search]')) {
    state.modal.query = event.target.value;
    const results = document.querySelector('[data-testid="agent-suggestions"]');
    if (results) results.innerHTML = renderAgentSuggestions(state, data);
    return;
  }
  if (event.target.matches('[data-chat-input]')) {
    const tips = document.querySelector('[data-testid="command-tips"]');
    if (tips) tips.hidden = !event.target.value.trimStart().startsWith('/');
  }
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
    event.preventDefault();
    openModal('command');
    return;
  }
  if (event.key !== 'Escape') return;
  if (state.keyboardOpen) {
    hideKeyboard();
    return;
  }
  if (state.modal) closeModal();
  else if (state.appFullScreen) {
    state.appFullScreen = false;
    render();
  } else if (state.appPanel) closeApp();
  else if (state.mobileDetail) navigate(state.section);
});

document.querySelector('.prototype-bar').addEventListener('click', (event) => {
  const button = event.target.closest('[data-prototype]');
  if (!button) return;
  if (button.dataset.prototype === 'variant') {
    const variant = button.dataset.value;
    state.variant = variant;
    navigate(variant === 'c' ? 'inbox' : 'chats');
  } else if (button.dataset.prototype === 'viewport') {
    state.viewport = button.dataset.value;
    state.keyboardOpen = false;
    keyboardField = null;
    state.appMobileOpen = state.viewport === 'mobile' && Boolean(state.appPanel);
    savePrefs();
    render();
  } else if (button.dataset.prototype === 'empty') {
    setEmptyPreview(!state.emptyPreview);
  } else if (button.dataset.prototype === 'keyboard') {
    if (state.viewport !== 'mobile') {
      state.viewport = 'mobile';
      state.keyboardOpen = true;
      savePrefs();
      render();
    } else if (state.keyboardOpen) hideKeyboard();
    else {
      state.keyboardOpen = true;
      render();
    }
  }
});

document.addEventListener('pointerdown', (event) => {
  const splitter = event.target.closest('[data-fold-splitter]');
  if (!splitter || state.viewport !== 'fold') return;
  const shell = splitter.closest('.shell');
  if (!shell) return;
  event.preventDefault();
  splitter.setPointerCapture(event.pointerId);
  const move = (moveEvent) => {
    const bounds = shell.getBoundingClientRect();
    const width = Math.max(220, Math.min(420, moveEvent.clientX - bounds.left));
    shell.style.setProperty('--fold-sidebar', `${width}px`);
    splitter.setAttribute('aria-valuenow', String(Math.round(width)));
  };
  const stop = () => {
    splitter.removeEventListener('pointermove', move);
    splitter.removeEventListener('pointerup', stop);
    splitter.removeEventListener('pointercancel', stop);
  };
  splitter.addEventListener('pointermove', move);
  splitter.addEventListener('pointerup', stop);
  splitter.addEventListener('pointercancel', stop);
});

window.addEventListener('popstate', () => applyRoute(parseRoute()));

updateUrl(true);
render();
