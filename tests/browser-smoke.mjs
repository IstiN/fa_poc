import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = resolve(root, 'artifacts');
const serverPort = 4175;
const debugPort = 9225;
const baseUrl = `http://127.0.0.1:${serverPort}`;
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((path) => existsSync(path));
assert.ok(chrome, 'Set CHROME_BIN to a Chrome/Chromium executable');

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const children = [];
const exceptions = [];

async function waitFor(check, description, timeout = 8000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeout) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await sleep(60);
  }
  throw new Error(`Timed out: ${description}${lastError ? ` · ${lastError.message}` : ''}`);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

const server = spawn('python3', ['-m', 'http.server', String(serverPort), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: 'ignore',
});
children.push(server);
await waitFor(async () => fetch(`${baseUrl}/index.html`).then((response) => response.ok), 'static server');

const browser = spawn(chrome, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-crash-restore-bubble',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/fa2-wireframe-chrome-${process.pid}`,
  'about:blank',
], { stdio: 'ignore' });
children.push(browser);

const targets = await waitFor(() => fetchJson(`http://127.0.0.1:${debugPort}/json/list`), 'Chrome debugger');
const page = targets.find((target) => target.type === 'page');
assert.ok(page);
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true });
  socket.addEventListener('error', rejectOpen, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    exceptions.push(message.params.exceptionDetails);
  }
});

function cdp(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolveCdp, rejectCdp) => {
    pending.set(id, { resolve: resolveCdp, reject: rejectCdp });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result.value;
}

const visible = (selector) => `(() => {
  const elements = [...document.querySelectorAll(${JSON.stringify(selector)})];
  return elements.find((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  });
})()`;

async function click(selector) {
  const clicked = await evaluate(`(() => {
    const element = ${visible(selector)};
    if (!element) return false;
    element.click();
    return true;
  })()`);
  assert.ok(clicked, `Visible element not found: ${selector}`);
  await sleep(35);
}

async function setValue(selector, value, eventType = 'input') {
  const changed = await evaluate(`(() => {
    const element = ${visible(selector)};
    if (!element) return false;
    element.value = ${JSON.stringify(value)};
    element.dispatchEvent(new Event(${JSON.stringify(eventType)}, { bubbles: true }));
    return true;
  })()`);
  assert.ok(changed, `Visible input not found: ${selector}`);
  await sleep(35);
}

async function text(selector) {
  return evaluate(`${visible(selector)}?.textContent ?? null`);
}

async function screenshot(name) {
  await evaluate("document.querySelector('#toast')?.classList.remove('visible')");
  await sleep(200);
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(artifacts, name), Buffer.from(result.data, 'base64'));
}

async function openQuickAction(action) {
  await click('[data-action="quick-actions"]');
  await click(`.modal [data-action="${action}"]`);
}

async function openAgentTask(agentId = 'agent:my:0') {
  await click('[data-action="command"]');
  await setValue('[data-command-input]', 'Fa');
  await click(`[data-action="command-open"][data-id="${agentId}"]`);
  await click('.content-head [data-action="conversation-details"]');
  await click('.modal [data-action="new-task"]');
}

try {
  await mkdir(artifacts, { recursive: true });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `${baseUrl}/#/a/chats` });
  await waitFor(() => evaluate(`Boolean(${visible('.shell[data-variant="a"]')})`), 'variant A render');
  assert.match(await text('.content-head h1'), /Fa/);
  await screenshot('a-desktop.png');

  // Global quick actions stay focused; tasks belong to an agent and Apps has its own surface.
  await click('[data-action="quick-actions"]');
  assert.equal(await evaluate(`Boolean(${visible('.modal [data-action="new-task"]')})`), false);
  assert.equal(await evaluate(`Boolean(${visible('.modal [data-action="quick-apps"]')})`), false);
  await click('.modal [data-action="networks"]');
  await waitFor(async () => (await text('.modal h2')) === 'Networks', 'Networks create/join chooser');
  assert.match(await text('.modal'), /Create a network/);
  assert.match(await text('.modal'), /Join a network/);
  await screenshot('networks-chooser.png');
  await click('.modal [data-action="close-modal"]');

  // Add agent: no network picker; automatic My Network membership.
  await openQuickAction('new-agent');
  await setValue('.modal [name="name"]', 'Release Analyst');
  await setValue('.modal [name="purpose"]', 'Analyze release evidence');
  await click('.modal [data-form="new-agent"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === 'Release Analyst', 'new agent chat');
  assert.match(await text('.content-head .subtitle'), /My Network/);
  assert.match(await text('[data-testid="messages"]'), /automatically joined My Network/);

  // Compose with no recipients -> local Quick chat -> persistent agent with history.
  await openQuickAction('new-chat');
  await setValue('.modal [name="message"]', 'Проверить DNS после смены роутера');
  await click('.modal [data-form="new-chat"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1'))?.includes('DNS'), 'quick chat created');
  await click('.content-head [data-action="conversation-details"]');
  await click('.modal [data-action="convert-quick"]');
  await waitFor(async () => (await text('.content-head .subtitle'))?.includes('persistent'), 'quick conversion');
  assert.match(await text('[data-testid="messages"]'), /Проверить DNS/);

  // Gmail-like compose: one recipient reuses the direct endless agent.
  await openQuickAction('new-chat');
  await click('.modal [data-action="toggle-recipient"][data-id="agent:my:1"]');
  await setValue('.modal [name="message"]', 'Direct compose without a new session');
  await click('.modal [data-form="new-chat"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === 'Mail Reader', 'direct compose chat');
  assert.match(await text('[data-testid="messages"]'), /Direct compose without a new session/);

  // Slash tips and model selection apply to the current local agent.
  await setValue('[data-chat-input]', '/');
  await waitFor(() => evaluate(`Boolean(${visible('[data-testid="command-tips"]')})`), 'slash command tips');
  await click('[data-action="chat-command"][data-command="model"]');
  await waitFor(() => evaluate(`Boolean(${visible('.model-options')})`), 'model picker');
  await click('[data-action="select-model"][data-model="Kimi K2.6"]');
  assert.equal(await text('.model-trigger'), 'Kimi K2.6');

  // Mixed local + network recipients create one group with group-only external access.
  await openQuickAction('new-chat');
  await setValue('.modal [data-agent-search]', 'Researcher');
  await click('.modal [data-action="toggle-recipient"][data-id="agent:my:2"]');
  await setValue('.modal [data-agent-search]', 'ai_conf Agent 01');
  await click('.modal [data-action="toggle-recipient"][data-id="agent:ai-conf:0"]');
  await setValue('.modal [name="groupName"]', 'Mixed browser group');
  await setValue('.modal [name="message"]', 'Review together across networks');
  assert.match(await text('.new-chat-form'), /group only/);
  await click('.modal [data-form="new-chat"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === '#Mixed-browser-group', 'mixed compose group');
  assert.match(await text('[data-testid="messages"]'), /access is limited to this group/);
  assert.match(await text('[data-testid="messages"]'), /Review together across networks/);

  // Agent-created task channel starts from the agent's own details, not global quick actions.
  await openAgentTask();
  await setValue('.modal [name="title"]', 'Audit clickable wireframe');
  await click('.modal [data-form="new-task"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === '#Audit-clickable-wireframe', 'agent task channel');
  assert.match(await text('.content-head .subtitle'), /4 agents/);
  assert.match(await text('[data-testid="messages"]'), /Fa created/);
  await click('.content-head [data-action="complete-task"]');
  await waitFor(() => evaluate(`Boolean(${visible('.archived-composer')})`), 'task channel archive');

  // Cross-network request does not grant access before owner approval.
  await click('[data-action="command"]');
  await setValue('[data-command-input]', 'release-260-audit');
  await click('[data-action="command-open"][data-id="channel:my:2"]');
  await click('.content-head [data-action="conversation-details"]');
  await click('.modal [data-action="invite-cross-network"]');
  await click('.modal [data-form="invite-cross-network"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === 'Approve cross-network channel invite', 'cross-network approval');
  assert.match(await text('.content-scroll'), /No membership or network access changes/);
  await click('.content-scroll [data-action="approve-event"]');
  await click('.content-scroll [data-action="open-source"]');
  await waitFor(async () => (await text('.content-head h1')) === '#release-260-audit', 'approved source channel');
  assert.match(await text('[data-testid="messages"]'), /Cross-network invite approved explicitly/);

  // A channel can invite an external agent with QR or a scoped CLI command.
  await click('.content-head [data-action="conversation-details"]');
  await click('.modal [data-action="invite-agent"]');
  await waitFor(() => evaluate(`Boolean(${visible('.qr-code')})`), 'channel QR invite');
  assert.equal(await evaluate(`document.querySelectorAll('.qr-code span').length`), 441);
  assert.match(await text('.modal'), /This channel only/);
  assert.match(await text('.modal'), /Agents → Join via QR/);
  await screenshot('channel-invite-qr.png');
  await click('.modal [data-action="invite-tab"][data-tab="cli"]');
  await waitFor(() => evaluate(`Boolean(${visible('[data-cli-invite]')})`), 'channel CLI invite');
  assert.match(await evaluate(`document.querySelector('[data-cli-invite]').value`), /^fa agent join /);
  assert.match(await text('.modal'), /not the whole network/);
  await click('.modal [data-action="copy-channel-invite"]');
  await screenshot('channel-invite-cli.png');
  await click('.modal [data-action="close-modal"]');

  // Apps: quick access, pin across chats, explicit context, fullscreen.
  await click('.content-head [data-action="quick-apps"]');
  await click('.modal [data-action="open-app"][data-id="app:files"]');
  await waitFor(() => evaluate(`Boolean(${visible('.app-panel')})`), 'app side panel');
  const contextBefore = await text('.app-panel .app-context button');
  await click('.app-panel [data-action="pin-app"]');
  await click('.sidebar [data-action="open-conversation"]');
  assert.equal(await text('.app-panel h1'), 'Files');
  assert.equal(await text('.app-panel .app-context button'), contextBefore);
  await click('.app-panel [data-action="fullscreen-app"]');
  await waitFor(() => evaluate(`Boolean(${visible('.app-overlay')})`), 'app fullscreen');
  await click('.app-overlay [data-action="exit-fullscreen"]');
  await click('.app-panel [data-action="close-app"]');

  // New App lives in My Apps, separate from Store and Boards.
  await click('.section-tabs [data-section="apps"]');
  await click('.app-launcher-main [data-action="new-app"]');
  await setValue('.modal [name="name"]', 'Release Cockpit');
  await setValue('.modal [name="description"]', 'Custom release operations');
  await screenshot('new-app.png');
  await click('.modal [data-form="new-app"] button[type="submit"]');
  await waitFor(async () => (await text('.app-panel h1')) === 'Release Cockpit', 'custom app opens after creation');
  await click('.app-panel [data-action="close-app"]');
  assert.match(await text('.app-launcher-main'), /Release Cockpit/);

  // Variant C starts with activity and exposes quick actions in the inbox.
  await click('[data-prototype="variant"][data-value="c"]');
  await waitFor(() => evaluate(`Boolean(${visible('.shell[data-variant="c"][data-section="inbox"]')})`), 'variant C inbox');
  assert.match(await text('[data-testid="event-list"]'), /Needs you/);
  assert.match(await text('[data-testid="event-list"]'), /Running/);
  await click('[data-action="open-event"][data-id="event:deploy"]');
  await screenshot('c-desktop.png');

  // Fold: two-pane content plus a reserved right action rail.
  await click('[data-prototype="variant"][data-value="a"]');
  await click('[data-prototype="viewport"][data-value="fold"]');
  await waitFor(() => evaluate(`Boolean(${visible('.fold-action-rail')})`), 'Fold action rail');
  const foldLayout = await evaluate(`(() => {
    const main = document.querySelector('.main').getBoundingClientRect();
    const rail = document.querySelector('.fold-action-rail').getBoundingClientRect();
    return { mainRight: main.right, railLeft: rail.left, railWidth: rail.width };
  })()`);
  assert.ok(foldLayout.mainRight <= foldLayout.railLeft + 1, 'Fold content must not slide under the action rail');
  assert.equal(foldLayout.railWidth, 64);
  const splitter = await evaluate(`(() => {
    const rect = ${visible('.fold-splitter')}.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, sidebar: document.querySelector('.sidebar').getBoundingClientRect().width };
  })()`);
  assert.ok(splitter.x > 0, 'Fold center splitter must be visible');
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: splitter.x, y: splitter.y, button: 'left', clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: splitter.x + 45, y: splitter.y, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: splitter.x + 45, y: splitter.y, button: 'left', clickCount: 1 });
  assert.ok(await evaluate(`document.querySelector('.sidebar').getBoundingClientRect().width`) > splitter.sidebar + 20, 'Fold splitter should resize the conversation pane');
  await screenshot('a-fold.png');
  await click('.fold-action-rail [data-section="apps"]');
  await waitFor(() => evaluate(`Boolean(${visible('.app-launcher-main .app-launcher-grid')})`), 'Fold app launcher');
  await screenshot('apps-fold.png');

  // Mobile: one level at a time, fullscreen app, no composer in Apps.
  await click('[data-prototype="variant"][data-value="a"]');
  await click('[data-prototype="viewport"][data-value="mobile"]');
  await waitFor(() => evaluate(`getComputedStyle(${visible('.bottom-nav')}).display === 'grid'`), 'mobile bottom nav');
  await waitFor(() => evaluate(`Boolean(${visible('.quick-fab')})`), 'mobile quick FAB');
  await click('.quick-fab');
  await click('.modal [data-action="new-chat"]');
  await click('.modal [data-action="toggle-recipient"][data-id="agent:my:0"]');
  await setValue('.modal [name="message"]', 'Mobile compose draft');
  if (await evaluate('Boolean(document.querySelector(".mobile-keyboard"))')) await click('[data-action="keyboard-hide"]');
  await screenshot('a-mobile-compose.png');
  await click('.modal [data-action="close-modal"]');
  await click('.sidebar [data-action="open-conversation"]');
  await waitFor(() => evaluate(`Boolean(${visible('.shell.detail-open .main')})`), 'mobile conversation');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.sidebar')).display`), 'none');
  await screenshot('a-mobile-chat.png');

  // Channel invite remains usable as a mobile bottom sheet with QR and CLI tabs.
  await click('.content-head [data-action="conversation-details"]');
  await click('.modal [data-action="invite-agent"]');
  await waitFor(() => evaluate(`Boolean(${visible('.qr-code')})`), 'mobile channel QR invite');
  await screenshot('mobile-channel-invite-qr.png');
  await click('.modal [data-action="invite-tab"][data-tab="cli"]');
  await waitFor(() => evaluate(`Boolean(${visible('[data-cli-invite]')})`), 'mobile channel CLI invite');
  await screenshot('mobile-channel-invite-cli.png');
  await click('.modal [data-action="close-modal"]');

  // Mobile keyboard: functional keys, composer above keyboard, no hidden input.
  await click('.composer input');
  await waitFor(() => evaluate(`Boolean(${visible('[data-testid="mobile-keyboard"]')})`), 'A mobile keyboard');
  const chatKeyboardLayout = await evaluate(`(() => {
    const composer = document.querySelector('.composer').getBoundingClientRect();
    const keyboard = document.querySelector('.mobile-keyboard').getBoundingClientRect();
    return { composerBottom: composer.bottom, keyboardTop: keyboard.top, keyboardHeight: keyboard.height };
  })()`);
  const composerGap = chatKeyboardLayout.keyboardTop - chatKeyboardLayout.composerBottom;
  assert.ok(composerGap >= -1 && composerGap <= 14, 'Floating composer must sit just above the keyboard');
  assert.ok(chatKeyboardLayout.keyboardHeight >= 240, 'Keyboard should have a realistic mobile height');
  await setValue('.composer input', 'Draft with keyboard');
  await click('[data-action="keyboard-key"][data-key="a"]');
  assert.equal(await evaluate(`document.querySelector('.composer input').value`), 'Draft with keyboarda');
  await screenshot('a-mobile-keyboard.png');
  await click('[data-action="keyboard-hide"]');
  assert.equal(await evaluate('Boolean(document.querySelector(".mobile-keyboard"))'), false);
  await click('.content-head [data-action="quick-apps"]');
  await click('.modal [data-action="open-app"][data-id="app:preview"]');
  await waitFor(() => evaluate(`Boolean(${visible('.shell.app-mobile-open .app-panel')})`), 'mobile fullscreen app');
  await screenshot('apps-mobile.png');
  await click('.app-panel [data-action="close-app"]');
  await click('.content-head [data-action="back-list"]');
  await click('.bottom-nav [data-section="apps"]');
  assert.equal(await evaluate('Boolean(document.querySelector(".composer"))'), false);
  await waitFor(() => evaluate(`Boolean(${visible('.app-launcher-grid')})`), 'mobile app grid launcher');
  await screenshot('apps-launcher-mobile.png');
  await click('.app-launcher-mobile [data-action="apps-tab"][data-tab="boards"]');
  await waitFor(() => evaluate(`Boolean(${visible('.app-launcher-mobile .board-grid')})`), 'My Boards tab');
  await click('[data-action="new-board"]');
  await setValue('.modal [name="name"]', 'Mobile Test Board');
  await click('.modal [data-form="new-board"] button[type="submit"]');
  await waitFor(async () => (await text('.modal h2')) === 'Mobile Test Board', 'new board canvas');
  await screenshot('apps-board-mobile.png');
  await click('.modal [data-action="close-modal"]');
  await click('.app-launcher-mobile [data-action="apps-tab"][data-tab="store"]');
  await waitFor(() => evaluate(`Boolean(${visible('.app-launcher-mobile .store-grid')})`), 'Widget Store tab');
  await screenshot('apps-store-mobile.png');
  await click('[data-action="install-widget"][data-id="widget:calendar"]');
  await click('.app-launcher-mobile [data-action="apps-tab"][data-tab="my"]');
  assert.match(await text('.app-launcher-mobile'), /Calendar/);
  assert.match(await text('.app-launcher-mobile'), /Installed/);
  await click('.bottom-nav [data-section="chats"]');
  await click('.create-menu-trigger');
  await screenshot('mobile-create-menu.png');
  await click('.modal [data-action="networks"]');
  await click('.modal [data-action="new-network"]');
  await setValue('.modal [name="name"]', 'Mobile Ops Network');
  await click('.modal [data-form="new-network"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === 'Mobile Ops Network', 'new network from compact menu');
  assert.match(await text('.content-scroll'), /Additional network/);
  await click('.content-head [data-action="back-list"]');
  await click('.bottom-nav [data-section="chats"]');
  await click('.create-menu-trigger');
  await click('.modal [data-action="networks"]');
  await click('.modal [data-action="join-network"]');
  assert.match(await evaluate(`document.querySelector('.modal [name="invite"]').value`), /DEMO-RESEARCH/);
  await screenshot('join-network-mobile.png');
  await click('.modal [data-form="join-network"] button[type="submit"]');
  await waitFor(async () => (await text('.content-head h1')) === 'Research Lab', 'join network with demo invite');
  await click('.content-head [data-action="back-list"]');
  await click('.bottom-nav [data-section="more"]');
  await click('[data-action="notes"]');
  await waitFor(() => evaluate(`Boolean(${visible('.modal')})`), 'mobile UX notes');
  await click('.modal [data-action="close-modal"]');

  await click('[data-prototype="variant"][data-value="c"]');
  await screenshot('c-mobile-inbox.png');
  await openAgentTask();
  await click('.modal [name="title"]');
  await waitFor(() => evaluate(`Boolean(${visible('[data-testid="mobile-keyboard"]')})`), 'C task sheet keyboard');
  await setValue('.modal [name="title"]', 'Mobile keyboard task');
  const sheetKeyboardLayout = await evaluate(`(() => {
    const sheet = document.querySelector('.modal').getBoundingClientRect();
    const keyboard = document.querySelector('.mobile-keyboard').getBoundingClientRect();
    const input = document.querySelector('.modal [name="title"]').getBoundingClientRect();
    return { sheetBottom: sheet.bottom, keyboardTop: keyboard.top, inputBottom: input.bottom };
  })()`);
  assert.ok(sheetKeyboardLayout.sheetBottom <= sheetKeyboardLayout.keyboardTop + 1, 'Task sheet must stay above the keyboard');
  assert.ok(sheetKeyboardLayout.inputBottom <= sheetKeyboardLayout.keyboardTop, 'Focused task input must remain visible');
  await screenshot('c-mobile-keyboard-task.png');
  await click('[data-action="keyboard-hide"]');
  await click('.modal [data-action="close-modal"]');

  // Direct links can open a deterministic mobile conversation with keyboard.
  await cdp('Page.navigate', { url: `${baseUrl}/?keyboard=1#/c/chats/agent:my:0` });
  await waitFor(() => evaluate(`Boolean(${visible('.shell[data-variant="c"].detail-open .composer')})`), 'direct C mobile chat');
  await waitFor(() => evaluate(`Boolean(${visible('[data-testid="mobile-keyboard"]')})`), 'direct keyboard preview');
  assert.equal(await evaluate(`document.querySelector('#frame').classList.contains('mobile-preview')`), true);
  await screenshot('c-mobile-keyboard-chat.png');
  await click('[data-action="keyboard-hide"]');
  await waitFor(() => evaluate(`Boolean(${visible('.composer-chips [data-command="model"]')})`), 'mobile command chips without slash');
  await screenshot('c-mobile-command-chips.png');
  await click('.composer-chips [data-action="chat-command"][data-command="model"]');
  await waitFor(() => evaluate(`Boolean(${visible('.model-options')})`), 'mobile model picker');
  await screenshot('c-mobile-model-picker.png');

  await cdp('Page.navigate', { url: `${baseUrl}/?viewport=fold#/a/chats` });
  await waitFor(() => evaluate(`Boolean(${visible('.fold-action-rail')})`), 'direct Fold preview');
  await cdp('Page.navigate', { url: `${baseUrl}/?viewport=mobile#/a/chats` });
  await waitFor(() => evaluate(`Boolean(${visible('.quick-fab')})`), 'direct Mobile preview');
  assert.equal(await evaluate('Boolean(document.querySelector(".mobile-keyboard"))'), false);

  // Empty preview covers first-run Chats, Inbox and Apps without destroying the populated demo.
  const populatedRows = await evaluate(`document.querySelectorAll('[data-testid="conversation-list"] .list-item').length`);
  await click('[data-prototype="empty"]');
  await waitFor(async () => (await text('[data-testid="conversation-list"]'))?.includes('No chats yet'), 'empty Chats preview');
  assert.match(await text('[data-testid="conversation-list"]'), /Start a chat/);
  await screenshot('empty-mobile-chats.png');
  await click('[data-prototype="empty"]');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid="conversation-list"] .list-item').length`), populatedRows, 'Empty preview must preserve demo rows');
  await click('[data-prototype="empty"]');
  await click('[data-prototype="variant"][data-value="c"]');
  await waitFor(async () => (await text('[data-testid="event-list"]'))?.includes('All caught up'), 'empty Inbox preview');
  await screenshot('empty-mobile-inbox.png');
  await click('.bottom-nav [data-section="apps"]');
  await waitFor(async () => (await text('.app-launcher-mobile'))?.includes('No apps yet'), 'empty My Apps preview');
  await waitFor(() => evaluate(`Boolean(${visible('.app-launcher-mobile [data-action="new-app"]')})`), 'New App in empty state');
  await screenshot('empty-mobile-apps.png');
  await click('[data-prototype="empty"]');
  await cdp('Page.navigate', { url: `${baseUrl}/?empty=1&viewport=mobile#/a/chats` });
  await waitFor(async () => (await text('[data-testid="conversation-list"]'))?.includes('No chats yet'), 'direct empty preview link');
  assert.equal(await evaluate(`document.querySelector('[data-prototype="empty"]').getAttribute('aria-pressed')`), 'true');
  assert.equal(exceptions.length, 0, `Browser exceptions: ${exceptions.map((error) => error.text).join(', ')}`);
  console.log('OK: A + C, compose/direct/mixed group, My Network, tasks, approval, Apps grid, Fold rail, mobile keyboard, /model');
  console.log(`Screenshots: ${artifacts}`);
} finally {
  socket.close();
  for (const child of children.reverse()) child.kill('SIGTERM');
}
